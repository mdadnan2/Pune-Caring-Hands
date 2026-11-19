import { Injectable } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@pch/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const puneToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(now)
      .replaceAll('/', '-');
    const today = new Date(`${puneToday}T00:00:00+05:30`);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      totalBookings,
      todaysBookings,
      pendingVerification,
      confirmed,
      completed,
      cancelled,
      rescheduled,
      serviceCounts,
      recentBookings,
      paymentQueue,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PAYMENT_VERIFICATION },
      }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.RESCHEDULED } }),
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        _count: { _all: true },
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          bookingRef: true,
          status: true,
          appointmentType: true,
          totalAmount: true,
          createdAt: true,
          patient: { select: { name: true } },
          service: { select: { id: true, name: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          status: BookingStatus.PAYMENT_VERIFICATION,
          payment: { status: PaymentStatus.SUBMITTED },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          bookingRef: true,
          createdAt: true,
          patient: { select: { name: true } },
          service: { select: { name: true } },
          payment: { select: { status: true, submittedAt: true } },
        },
      }),
    ]);

    const serviceIds = serviceCounts.map((row) => row.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const serviceNames = new Map(services.map((service) => [service.id, service.name]));

    return {
      kpis: {
        totalBookings,
        todaysBookings,
        pendingPaymentVerification: pendingVerification,
        confirmed,
        completed,
        cancelled,
        rescheduled,
      },
      serviceCounts: serviceCounts.map((row) => ({
        serviceId: row.serviceId,
        name: serviceNames.get(row.serviceId) ?? 'Unknown service',
        count: row._count._all,
      })),
      recentBookings,
      paymentVerificationQueue: paymentQueue,
    };
  }
}
