import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getPuneDateTime } from './slot-time.util';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(date?: string) {
    const now = new Date();
    const { date: today, time: currentTime } = getPuneDateTime(now);
    const todayDate = new Date(`${today}T00:00:00.000Z`);

    let dateFilter;
    if (date) {
      if (!isDateOnly(date)) {
        throw new BadRequestException({
          message: 'Date must be a valid YYYY-MM-DD date',
          code: 'VALIDATION_ERROR',
        });
      }

      if (date < today) {
        return [];
      }

      const requestedDate = new Date(`${date}T00:00:00.000Z`);
      dateFilter =
        date === today
          ? { date: requestedDate, startTime: { gt: currentTime } }
          : { date: requestedDate };
    } else {
      dateFilter = {
        OR: [{ date: { gt: todayDate } }, { date: todayDate, startTime: { gt: currentTime } }],
      };
    }

    const where = {
      isAvailable: true,
      booking: null,
      ...dateFilter,
    };

    return this.prisma.slot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: { id: true, date: true, startTime: true, endTime: true },
    });
  }
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
