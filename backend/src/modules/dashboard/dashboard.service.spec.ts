import { BookingStatus, PaymentStatus } from '@pch/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns KPI counts, service counts, recent bookings, and payment queue', async () => {
    const prisma = {
      booking: {
        count: jest
          .fn()
          .mockResolvedValueOnce(20)
          .mockResolvedValueOnce(3)
          .mockResolvedValueOnce(4)
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(6)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1),
        groupBy: jest.fn().mockResolvedValue([
          { serviceId: 'service-1', _count: { _all: 12 } },
          { serviceId: 'service-2', _count: { _all: 8 } },
        ]),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ bookingRef: 'PCH-1', status: BookingStatus.CONFIRMED }])
          .mockResolvedValueOnce([
            {
              bookingRef: 'PCH-2',
              patient: { name: 'Asha' },
              service: { name: 'ECG at Home' },
              payment: { status: PaymentStatus.SUBMITTED, submittedAt: new Date() },
            },
          ]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'service-1', name: 'Doctor Home Consultation' },
          { id: 'service-2', name: 'ECG at Home' },
        ]),
      },
    };

    const service = new DashboardService(prisma as unknown as PrismaService);
    const result = await service.getDashboard();

    expect(result.kpis).toEqual({
      totalBookings: 20,
      todaysBookings: 3,
      pendingPaymentVerification: 4,
      confirmed: 5,
      completed: 6,
      cancelled: 2,
      rescheduled: 1,
    });
    expect(result.serviceCounts).toEqual([
      { serviceId: 'service-1', name: 'Doctor Home Consultation', count: 12 },
      { serviceId: 'service-2', name: 'ECG at Home', count: 8 },
    ]);
    expect(result.recentBookings).toHaveLength(1);
    expect(result.paymentVerificationQueue).toHaveLength(1);
  });

  it('queries pending payment verification from the submitted payment state', async () => {
    const prisma = {
      booking: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      service: { findMany: jest.fn().mockResolvedValue([]) },
    };

    await new DashboardService(prisma as unknown as PrismaService).getDashboard();

    expect(prisma.booking.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          status: BookingStatus.PAYMENT_VERIFICATION,
          payment: { status: PaymentStatus.SUBMITTED },
        },
        take: 10,
      }),
    );
  });
});
