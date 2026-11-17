import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns available slots from today onwards, grouped by date */
  async findAvailable() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = await this.prisma.slot.findMany({
      where: {
        isAvailable: true,
        booking: null, // not yet booked
        date: { gte: today },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: { id: true, date: true, startTime: true, endTime: true },
    });

    return slots;
  }
}
