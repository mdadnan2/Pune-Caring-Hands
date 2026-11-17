import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(options?: { serviceId?: string; date?: string }) {
    if (options?.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: options.serviceId },
        select: { id: true },
      });

      if (!service) {
        throw new NotFoundException({
          message: 'Service not found',
          code: 'SERVICE_NOT_FOUND',
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      isAvailable: true,
      booking: null,
      date: { gte: today },
    };

    if (options?.date) {
      const requestDate = new Date(`${options.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${options.date}T23:59:59.999Z`);
      where.date = { gte: requestDate, lt: endOfDay };
    }

    return this.prisma.slot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: { id: true, date: true, startTime: true, endTime: true },
    });
  }
}
