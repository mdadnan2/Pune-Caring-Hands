import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getPuneDateTime, isDateOnly, isFutureSlot, parseDateOnly } from './slot-time.util';

export type AdminSlotFilters = {
  date?: string;
  availability?: 'available' | 'unavailable';
  bookingStatus?: 'booked' | 'unbooked';
  page: number;
  pageSize: number;
};

export type SlotSchedule = { date: string; startTime: string; endTime: string };
export type UpdateAdminSlot = Partial<SlotSchedule> & { isAvailable?: boolean };

const adminSlotSelect = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      bookingRef: true,
      status: true,
      patient: { select: { name: true } },
      service: { select: { name: true } },
    },
  },
} satisfies Prisma.SlotSelect;

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

  async listAdmin(filters: AdminSlotFilters) {
    if (filters.date && !isDateOnly(filters.date)) {
      throw new BadRequestException({
        message: 'Date must be a valid YYYY-MM-DD date',
        code: 'SLOT_DATE_INVALID',
      });
    }

    const where: Prisma.SlotWhereInput = {
      ...(filters.date && { date: parseDateOnly(filters.date) }),
      ...(filters.availability && { isAvailable: filters.availability === 'available' }),
      ...(filters.bookingStatus === 'booked' && { booking: { isNot: null } }),
      ...(filters.bookingStatus === 'unbooked' && { booking: { is: null } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.slot.findMany({
        where,
        select: adminSlotSelect,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.slot.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }

  async createAdmin(schedule: SlotSchedule) {
    assertValidSlotSchedule(schedule);
    try {
      return await this.prisma.slot.create({
        data: {
          date: parseDateOnly(schedule.date),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: true,
        },
        select: adminSlotSelect,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw duplicateSlotError();
      }
      throw error;
    }
  }

  async updateAdmin(id: string, changes: UpdateAdminSlot) {
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException({
        message: 'Provide at least one slot field to update.',
        code: 'SLOT_UPDATE_EMPTY',
      });
    }

    const existing = await this.prisma.slot.findUnique({
      where: { id },
      select: { id: true, date: true, startTime: true, endTime: true, booking: { select: { id: true } } },
    });
    if (!existing) {
      throw slotNotFoundError();
    }

    const scheduleChanged =
      (changes.date !== undefined && changes.date !== existing.date.toISOString().slice(0, 10)) ||
      (changes.startTime !== undefined && changes.startTime !== existing.startTime) ||
      (changes.endTime !== undefined && changes.endTime !== existing.endTime);

    if (existing.booking && scheduleChanged) {
      throw new ConflictException({
        message: 'The date and time of a booked slot cannot be changed.',
        code: 'SLOT_BOOKED_TIME_LOCKED',
      });
    }

    const schedule = {
      date: changes.date ?? existing.date.toISOString().slice(0, 10),
      startTime: changes.startTime ?? existing.startTime,
      endTime: changes.endTime ?? existing.endTime,
    };
    if (scheduleChanged) {
      assertValidSlotSchedule(schedule);
    }

    const data: Prisma.SlotUpdateManyMutationInput = {
      ...(changes.date !== undefined && { date: parseDateOnly(schedule.date) }),
      ...(changes.startTime !== undefined && { startTime: schedule.startTime }),
      ...(changes.endTime !== undefined && { endTime: schedule.endTime }),
      ...(changes.isAvailable !== undefined && { isAvailable: changes.isAvailable }),
    };

    try {
      if (scheduleChanged) {
        const result = await this.prisma.slot.updateMany({
          where: { id, booking: { is: null } },
          data,
        });
        if (result.count !== 1) {
          const current = await this.prisma.slot.findUnique({
            where: { id },
            select: { booking: { select: { id: true } } },
          });
          if (!current) throw slotNotFoundError();
          if (current.booking) {
            throw new ConflictException({
              message: 'The date and time of a booked slot cannot be changed.',
              code: 'SLOT_BOOKED_TIME_LOCKED',
            });
          }
          throw new ConflictException({
            message: 'The slot changed while being updated. Refresh and try again.',
            code: 'SLOT_UPDATE_CONFLICT',
          });
        }
      } else {
        await this.prisma.slot.update({ where: { id }, data });
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw duplicateSlotError();
      }
      if (isRecordNotFoundError(error)) {
        throw slotNotFoundError();
      }
      throw error;
    }

    const updated = await this.prisma.slot.findUnique({
      where: { id },
      select: adminSlotSelect,
    });
    if (!updated) throw slotNotFoundError();
    return updated;
  }

  async deleteAdmin(id: string) {
    const result = await this.prisma.slot.deleteMany({
      where: { id, booking: { is: null } },
    });
    if (result.count === 1) {
      return { id, deleted: true };
    }

    const existing = await this.prisma.slot.findUnique({
      where: { id },
      select: { booking: { select: { id: true } } },
    });
    if (!existing) {
      throw slotNotFoundError();
    }
    throw new ConflictException({
      message: 'A slot with a booking cannot be deleted.',
      code: 'SLOT_BOOKED_DELETE',
    });
  }
}

function assertValidSlotSchedule(schedule: SlotSchedule): void {
  if (!isDateOnly(schedule.date)) {
    throw new BadRequestException({
      message: 'Date must be a valid YYYY-MM-DD date.',
      code: 'SLOT_DATE_INVALID',
    });
  }
  if (!isValidTime(schedule.startTime) || !isValidTime(schedule.endTime)) {
    throw new BadRequestException({
      message: 'Start and end times must be valid 24-hour HH:mm values.',
      code: 'SLOT_TIME_INVALID',
    });
  }
  if (schedule.startTime >= schedule.endTime) {
    throw new BadRequestException({
      message: 'Start time must be before end time.',
      code: 'SLOT_TIME_RANGE_INVALID',
    });
  }
  if (!isFutureSlot(parseDateOnly(schedule.date), schedule.startTime)) {
    throw new BadRequestException({
      message: 'You cannot create or move a slot into the past.',
      code: 'SLOT_IN_PAST',
    });
  }
}

function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

function duplicateSlotError(): ConflictException {
  return new ConflictException({
    message: 'A slot already exists for this date and start time.',
    code: 'SLOT_DUPLICATE',
  });
}

function slotNotFoundError(): NotFoundException {
  return new NotFoundException({ message: 'Slot not found.', code: 'SLOT_NOT_FOUND' });
}
