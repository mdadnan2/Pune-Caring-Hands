import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ServiceAreasService } from '../service-areas/service-areas.service';
import { AppointmentType, BookingStatus, PaymentStatus } from '@pch/shared';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceAreasService: ServiceAreasService,
  ) {}

  async create(dto: CreateBookingDto, prescriptionFileKey?: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
      include: { serviceItems: { where: { isActive: true } } },
    });

    if (!service) {
      throw new NotFoundException({ message: 'Service not found', code: 'SERVICE_NOT_FOUND' });
    }

    const pinSupported = await this.serviceAreasService.validatePinForService(
      dto.patientPinCode,
      dto.serviceId,
    );
    if (!pinSupported) {
      throw new BadRequestException({
        message: 'Sorry, this service is currently unavailable in your area.',
        code: 'AREA_NOT_SUPPORTED',
      });
    }

    if (dto.appointmentType === AppointmentType.SCHEDULED && !dto.slotId) {
      throw new BadRequestException({
        message: 'A time slot is required for scheduled appointments',
        code: 'VALIDATION_ERROR',
      });
    }

    if (service.slug === 'blood-test-at-home' && (!dto.serviceItemIds || dto.serviceItemIds.length === 0)) {
      throw new BadRequestException({
        message: 'Select at least one blood test.',
        code: 'VALIDATION_ERROR',
      });
    }

    if (service.slug === 'xray-at-home' && (!dto.serviceItemIds || dto.serviceItemIds.length !== 1)) {
      throw new BadRequestException({
        message: 'Select one X-Ray type.',
        code: 'VALIDATION_ERROR',
      });
    }

    let totalAmount = 0;
    let validatedItemIds: string[] = [];

    if (service.basePrice !== null) {
      totalAmount = service.basePrice;
    } else if (dto.serviceItemIds && dto.serviceItemIds.length > 0) {
      const selectedItems = service.serviceItems.filter(
        (item: { id: string; price: number }) => dto.serviceItemIds!.includes(item.id),
      );
      if (selectedItems.length !== dto.serviceItemIds.length) {
        throw new BadRequestException({
          message: 'One or more selected service items are invalid',
          code: 'INVALID_SERVICE_ITEM',
        });
      }
      totalAmount = selectedItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
      validatedItemIds = selectedItems.map((item: { id: string }) => item.id);
    } else if (prescriptionFileKey) {
      totalAmount = 0;
    } else {
      throw new BadRequestException({
        message: 'Service items are required for this service',
        code: 'VALIDATION_ERROR',
      });
    }

    if (service.slug === 'medicine-home-delivery' && !prescriptionFileKey && !dto.notes) {
      throw new BadRequestException({
        message: 'Prescription upload or notes are required for medicine delivery.',
        code: 'VALIDATION_ERROR',
      });
    }

    let ageAtBooking: number | undefined;
    if (dto.patientDateOfBirth) {
      const dob = new Date(dto.patientDateOfBirth);
      const today = new Date();
      ageAtBooking = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        ageAtBooking--;
      }
    }

    const bookingRef = await this.generateBookingRef();

    const booking = await this.prisma.$transaction(async (tx: PrismaService) => {
      const patient = await tx.patient.upsert({
        where: { phone: dto.patientPhone },
        update: {
          name: dto.patientName,
          address: dto.patientAddress,
          ...(dto.patientEmail && { email: dto.patientEmail }),
          ...(dto.patientDateOfBirth && { dateOfBirth: new Date(dto.patientDateOfBirth) }),
        },
        create: {
          name: dto.patientName,
          phone: dto.patientPhone,
          address: dto.patientAddress,
          ...(dto.patientEmail && { email: dto.patientEmail }),
          ...(dto.patientDateOfBirth && { dateOfBirth: new Date(dto.patientDateOfBirth) }),
        },
      });

      if (dto.slotId) {
        const slot = await tx.slot.findUnique({ where: { id: dto.slotId } });
        if (!slot || !slot.isAvailable) {
          throw new ConflictException({
            message: 'The selected time slot is no longer available. Please choose another slot.',
            code: 'SLOT_UNAVAILABLE',
          });
        }

        const existingBooking = await tx.booking.findUnique({ where: { slotId: dto.slotId } });
        if (existingBooking) {
          throw new ConflictException({
            message: 'The selected time slot is no longer available. Please choose another slot.',
            code: 'SLOT_UNAVAILABLE',
          });
        }

        await tx.slot.update({ where: { id: dto.slotId }, data: { isAvailable: false } });
      }

      const serviceDetails: Record<string, unknown> = { ...(dto.serviceDetails ?? {}) };
      if (dto.patientAlternatePhone) {
        serviceDetails.alternatePhone = dto.patientAlternatePhone;
      }
      if (dto.patientMapsLink) {
        serviceDetails.mapsLink = dto.patientMapsLink;
      }
      if (prescriptionFileKey) {
        serviceDetails.prescriptionFileKey = prescriptionFileKey;
      }

      const newBooking = await tx.booking.create({
        data: {
          bookingRef,
          patientId: patient.id,
          serviceId: dto.serviceId,
          slotId: dto.slotId ?? null,
          appointmentType: dto.appointmentType,
          status: BookingStatus.REQUESTED,
          totalAmount,
          notes: dto.notes ?? null,
          serviceDetails,
          ageAtBooking: ageAtBooking ?? null,
          bookingItems: {
            create: validatedItemIds.map((itemId) => {
              const item = service.serviceItems.find(
                (serviceItem: { id: string; name: string; price: number }) => serviceItem.id === itemId,
              );
              if (!item) {
                throw new BadRequestException({
                  message: 'One or more selected service items are invalid',
                  code: 'INVALID_SERVICE_ITEM',
                });
              }

              return { serviceItemId: itemId, name: item.name, price: item.price };
            }),
          },
          payment: {
            create: {
              amount: totalAmount,
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: {
          service: { select: { name: true, slug: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
          bookingItems: true,
          payment: { select: { id: true, amount: true, status: true } },
        },
      });

      return newBooking;
    });

    return booking;
  }

  async updatePrescriptionKey(bookingId: string, prescriptionFileKey: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    const serviceDetails = (booking.serviceDetails ?? {}) as Record<string, unknown>;
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { serviceDetails: { ...serviceDetails, prescriptionFileKey } },
    });
  }

  async findByRef(bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: {
        service: { select: { name: true, slug: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
        bookingItems: true,
        payment: { select: { id: true, amount: true, status: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    return {
      bookingRef: booking.bookingRef,
      status: booking.status,
      appointmentType: booking.appointmentType,
      totalAmount: booking.totalAmount,
      service: booking.service,
      slot: booking.slot,
      bookingItems: booking.bookingItems,
      payment: booking.payment,
      createdAt: booking.createdAt,
    };
  }

  async submitPaymentProof(bookingRef: string, dto: SubmitPaymentDto, proofFileKey?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    if (!booking.payment) {
      throw new BadRequestException({ message: 'Payment record not found', code: 'INTERNAL_ERROR' });
    }

    if (booking.payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException({
        message: 'Payment has already been submitted',
        code: 'PAYMENT_ALREADY_SUBMITTED',
      });
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          upiTransactionId: dto.upiTransactionId,
          proofFileKey: proofFileKey ?? null,
          status: PaymentStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAYMENT_VERIFICATION },
      }),
    ]);

    return { bookingRef, status: BookingStatus.PAYMENT_VERIFICATION };
  }

  private async generateBookingRef(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.booking.count({
      where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `PCH-${dateStr}-${seq}`;
  }
}
