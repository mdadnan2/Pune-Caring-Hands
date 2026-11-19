import { Injectable } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@pch/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const { appointmentStart, appointmentEnd, slotStart, slotEnd } = getPuneDayBounds(new Date());

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
        where: {
          OR: [
            { slot: { date: { gte: slotStart, lt: slotEnd } } },
            { appointmentType: 'IMMEDIATE', createdAt: { gte: appointmentStart, lt: appointmentEnd } },
          ],
        },
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

export function getPuneDayBounds(now: Date): {
  appointmentStart: Date;
  appointmentEnd: Date;
  slotStart: Date;
  slotEnd: Date;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const puneDate = `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
  const appointmentStart = new Date(`${puneDate}T00:00:00+05:30`);
  const appointmentEnd = new Date(appointmentStart.getTime() + 24 * 60 * 60 * 1000);
  const slotStart = new Date(`${puneDate}T00:00:00.000Z`);
  const slotEnd = new Date(slotStart.getTime() + 24 * 60 * 60 * 1000);

  return { appointmentStart, appointmentEnd, slotStart, slotEnd };
}
