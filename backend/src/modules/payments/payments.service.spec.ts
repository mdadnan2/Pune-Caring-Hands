import { BadRequestException } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@pch/shared';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let prisma: {
    booking: { findUnique: jest.Mock; updateMany: jest.Mock };
    payment: { findUnique: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let uploads: {
    validateFile: jest.Mock;
    saveFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let payments: PaymentsService;

  beforeEach(() => {
    prisma = {
      booking: { findUnique: jest.fn(), updateMany: jest.fn() },
      payment: { findUnique: jest.fn(), updateMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
    };
    uploads = {
      validateFile: jest.fn(),
      saveFile: jest.fn().mockResolvedValue('payments/payment-proof.png'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    payments = new PaymentsService(
      prisma as unknown as PrismaService,
      uploads as unknown as UploadsService,
      { get: jest.fn((key: string) => (key === 'UPI_ID' ? 'care@upi' : 'Pune Caring Hands')) } as unknown as ConfigService,
    );
  });

  it('requires a payment screenshot and does not create a payment submission without one', async () => {
    await expect(payments.submitProof('PCH-REF', undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
    expect(uploads.saveFile).not.toHaveBeenCalled();
  });

  it('stores the proof and atomically moves the booking to verification without confirming', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-id',
      bookingRef: 'PCH-REF',
      status: BookingStatus.PAYMENT_PENDING,
      payment: { id: 'payment-id', status: PaymentStatus.PENDING, proofFileKey: null },
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });
    const proof = {
      originalname: 'arbitrary-name.png',
      mimetype: 'image/png',
      size: 10,
      buffer: Buffer.from('proof'),
    };

    await expect(payments.submitProof('PCH-REF', proof)).resolves.toEqual({
      bookingRef: 'PCH-REF',
      status: BookingStatus.PAYMENT_VERIFICATION,
    });
    expect(uploads.validateFile).toHaveBeenCalledWith(proof);
    expect(uploads.saveFile).toHaveBeenCalledWith(proof, 'payments', 'PCH-REF', 'proof');
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'payment-id', status: PaymentStatus.PENDING },
      data: expect.objectContaining({ status: PaymentStatus.SUBMITTED }),
    }));
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-id', status: BookingStatus.PAYMENT_PENDING },
      data: { status: BookingStatus.PAYMENT_VERIFICATION },
    });
  });

  it('verifies payment and confirms the booking only through the admin action', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-id',
      bookingId: 'booking-id',
      status: PaymentStatus.SUBMITTED,
      booking: { bookingRef: 'PCH-REF', status: BookingStatus.PAYMENT_VERIFICATION },
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(payments.verify('payment-id', 'admin-id')).resolves.toEqual({
      paymentId: 'payment-id',
      bookingRef: 'PCH-REF',
      status: BookingStatus.CONFIRMED,
    });
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'payment-id', status: PaymentStatus.SUBMITTED },
      data: expect.objectContaining({
        status: PaymentStatus.VERIFIED,
        verifiedByAdminId: 'admin-id',
      }),
    }));
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-id', status: BookingStatus.PAYMENT_VERIFICATION },
      data: { status: BookingStatus.CONFIRMED },
    });
  });

  it('records a correction reason and keeps the booking unconfirmed', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-id',
      bookingId: 'booking-id',
      status: PaymentStatus.SUBMITTED,
      booking: { bookingRef: 'PCH-REF', status: BookingStatus.PAYMENT_VERIFICATION },
    });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      payments.reject('payment-id', 'admin-id', { reason: 'Amount is not readable' }),
    ).resolves.toMatchObject({
      bookingRef: 'PCH-REF',
      status: BookingStatus.PAYMENT_PENDING,
      rejectionReason: 'Amount is not readable',
    });
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: PaymentStatus.REJECTED,
        rejectionReason: 'Amount is not readable',
        verifiedByAdminId: 'admin-id',
      }),
    }));
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-id', status: BookingStatus.PAYMENT_VERIFICATION },
      data: { status: BookingStatus.PAYMENT_PENDING },
    });
  });
});
