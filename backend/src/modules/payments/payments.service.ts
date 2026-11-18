import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { BookingStatus, PaymentStatus } from '@pch/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadsService, type UploadedFile } from '../uploads/uploads.service';
import { RejectPaymentDto } from './dto/reject-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly config: ConfigService,
  ) {}

  getInstructions() {
    const upiId = this.config.get<string>('UPI_ID');
    if (!upiId) {
      throw new ServiceUnavailableException({
        message: 'UPI payment instructions are not configured. Please contact support.',
        code: 'PAYMENT_CONFIGURATION_UNAVAILABLE',
      });
    }

    return {
      upiId,
      payeeName: this.config.get<string>('UPI_NAME') ?? 'Pune Caring Hands',
    };
  }

  async submitProof(bookingRef: string, file?: UploadedFile) {
    if (!file) {
      throw new BadRequestException({
        message: 'Payment screenshot is required.',
        code: 'PAYMENT_PROOF_REQUIRED',
      });
    }
    this.uploads.validateFile(file);

    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: { payment: true },
    });
    if (!booking?.payment) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }
    if (
      booking.status !== BookingStatus.PAYMENT_PENDING ||
      (booking.payment.status !== 'PENDING' && booking.payment.status !== 'REJECTED')
    ) {
      throw new ConflictException({
        message: 'Payment proof cannot be submitted for this booking state.',
        code: 'PAYMENT_NOT_PENDING',
      });
    }

    const proofFileKey = await this.uploads.saveFile(file, 'payments', bookingRef, 'proof');
    try {
      const previousProofKey = booking.payment.proofFileKey;
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const update = await tx.payment.updateMany({
          where: { id: booking.payment!.id, status: booking.payment!.status },
          data: {
            proofFileKey,
            status: PaymentStatus.SUBMITTED,
            submittedAt: new Date(),
            rejectedAt: null,
            rejectionReason: null,
          },
        });
        if (update.count !== 1) {
          throw new ConflictException({
            message: 'Payment status changed. Refresh the booking and try again.',
            code: 'PAYMENT_NOT_PENDING',
          });
        }

        const bookingUpdate = await tx.booking.updateMany({
          where: { id: booking.id, status: BookingStatus.PAYMENT_PENDING },
          data: { status: BookingStatus.PAYMENT_VERIFICATION },
        });
        if (bookingUpdate.count !== 1) {
          throw new ConflictException({
            message: 'Booking status changed. Refresh the booking and try again.',
            code: 'PAYMENT_NOT_PENDING',
          });
        }
      });

      if (previousProofKey) {
        await this.deletePreviousProof(previousProofKey);
      }

      return { bookingRef, status: BookingStatus.PAYMENT_VERIFICATION };
    } catch (error) {
      await this.deleteUploadedFile(proofFileKey);
      throw error;
    }
  }

  async verify(paymentId: string, adminId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (!payment) {
      throw new NotFoundException({ message: 'Payment not found', code: 'PAYMENT_NOT_FOUND' });
    }
    if (
      payment.status !== PaymentStatus.SUBMITTED ||
      payment.booking.status !== BookingStatus.PAYMENT_VERIFICATION
    ) {
      throw new ConflictException({
        message: 'Only payments awaiting verification can be approved.',
        code: 'PAYMENT_NOT_SUBMITTED',
      });
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const update = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.SUBMITTED },
        data: {
          status: PaymentStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
          rejectionReason: null,
        },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          message: 'Payment status changed. Refresh and try again.',
          code: 'PAYMENT_NOT_SUBMITTED',
        });
      }

      const bookingUpdate = await tx.booking.updateMany({
        where: { id: payment.bookingId, status: BookingStatus.PAYMENT_VERIFICATION },
        data: { status: BookingStatus.CONFIRMED },
      });
      if (bookingUpdate.count !== 1) {
        throw new ConflictException({
          message: 'Booking status changed. Refresh and try again.',
          code: 'PAYMENT_NOT_SUBMITTED',
        });
      }
    });

    return { paymentId, bookingRef: payment.booking.bookingRef, status: BookingStatus.CONFIRMED };
  }

  async reject(paymentId: string, adminId: string, dto: RejectPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (!payment) {
      throw new NotFoundException({ message: 'Payment not found', code: 'PAYMENT_NOT_FOUND' });
    }
    if (
      payment.status !== PaymentStatus.SUBMITTED ||
      payment.booking.status !== BookingStatus.PAYMENT_VERIFICATION
    ) {
      throw new ConflictException({
        message: 'Only payments awaiting verification can be returned for correction.',
        code: 'PAYMENT_NOT_SUBMITTED',
      });
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const update = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.SUBMITTED },
        data: {
          status: PaymentStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: dto.reason.trim(),
          verifiedByAdminId: adminId,
        },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          message: 'Payment status changed. Refresh and try again.',
          code: 'PAYMENT_NOT_SUBMITTED',
        });
      }

      const bookingUpdate = await tx.booking.updateMany({
        where: { id: payment.bookingId, status: BookingStatus.PAYMENT_VERIFICATION },
        data: { status: BookingStatus.PAYMENT_PENDING },
      });
      if (bookingUpdate.count !== 1) {
        throw new ConflictException({
          message: 'Booking status changed. Refresh and try again.',
          code: 'PAYMENT_NOT_SUBMITTED',
        });
      }
    });

    return {
      paymentId,
      bookingRef: payment.booking.bookingRef,
      status: BookingStatus.PAYMENT_PENDING,
      rejectionReason: dto.reason.trim(),
    };
  }

  private async deletePreviousProof(key: string): Promise<void> {
    try {
      await this.uploads.deleteFile(key);
    } catch (error) {
      this.logger.error(
        `Could not remove superseded payment proof: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async deleteUploadedFile(key: string): Promise<void> {
    try {
      await this.uploads.deleteFile(key);
    } catch (error) {
      this.logger.error(
        `Payment submission failed and uploaded proof cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException({
        message: 'Payment proof could not be submitted. Please retry.',
        code: 'PAYMENT_SUBMISSION_FAILED',
      });
    }
  }
}
