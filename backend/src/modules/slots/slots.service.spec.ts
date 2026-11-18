import { SlotsService } from './slots.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

type MockPrismaSlots = {
  slot: {
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('SlotsService', () => {
  let prisma: MockPrismaSlots;
  let slotsService: SlotsService;

  beforeEach(() => {
    prisma = {
      slot: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    };

    slotsService = new SlotsService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters by the requested date, excludes past times today, and keeps slots global', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.findMany.mockResolvedValue([{ id: 'slot-1', date: '2026-11-18T00:00:00.000Z' }]);

    await slotsService.findAvailable('2026-11-18');

    expect(prisma.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          booking: null,
          date: new Date('2026-11-18T00:00:00.000Z'),
          startTime: { gt: '11:00' },
        }),
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
    );
  });

  it('excludes unavailable and booked slots', async () => {
    prisma.slot.findMany.mockResolvedValue([]);

    await slotsService.findAvailable();

    expect(prisma.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          booking: null,
          OR: expect.arrayContaining([
            expect.objectContaining({ date: expect.objectContaining({ gt: expect.any(Date) }) }),
            expect.objectContaining({ startTime: { gt: expect.any(String) } }),
          ]),
        }),
      }),
    );
  });

  it('does not query the database for a date before today', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));

    await expect(slotsService.findAvailable('2026-11-17')).resolves.toEqual([]);
    expect(prisma.slot.findMany).not.toHaveBeenCalled();
  });

  it('rejects invalid calendar dates', async () => {
    await expect(slotsService.findAvailable('2026-02-30')).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
    expect(prisma.slot.findMany).not.toHaveBeenCalled();
  });

  it('creates a future slot and defaults it to available', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.create.mockResolvedValue({ id: 'slot-1', isAvailable: true });

    await expect(
      slotsService.createAdmin({
        date: '2026-11-18',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).resolves.toMatchObject({ isAvailable: true });
    expect(prisma.slot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          date: new Date('2026-11-18T00:00:00.000Z'),
          startTime: '12:00',
          endTime: '13:00',
          isAvailable: true,
        },
      }),
    );
  });

  it('rejects malformed or impossible dates', async () => {
    await expect(
      slotsService.createAdmin({ date: '2026-02-30', startTime: '12:00', endTime: '13:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_DATE_INVALID' } });
    expect(prisma.slot.create).not.toHaveBeenCalled();
  });

  it('rejects invalid 24-hour times', async () => {
    await expect(
      slotsService.createAdmin({ date: '2026-11-19', startTime: '24:00', endTime: '25:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_TIME_INVALID' } });
    expect(prisma.slot.create).not.toHaveBeenCalled();
  });

  it('rejects a start time that is not before the end time', async () => {
    await expect(
      slotsService.createAdmin({ date: '2026-11-19', startTime: '10:00', endTime: '10:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_TIME_RANGE_INVALID' } });
  });

  it('rejects creating a slot in the past using Pune time', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));

    await expect(
      slotsService.createAdmin({ date: '2026-11-18', startTime: '11:00', endTime: '12:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_IN_PAST' } });
    expect(prisma.slot.create).not.toHaveBeenCalled();
  });

  it('returns a clear conflict for duplicate date and start time', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.19.1',
      }),
    );

    await expect(
      slotsService.createAdmin({ date: '2026-11-18', startTime: '12:00', endTime: '13:00' }),
    ).rejects.toMatchObject({
      response: {
        code: 'SLOT_DUPLICATE',
        message: 'A slot already exists for this date and start time.',
      },
    });
  });

  it('updates the schedule of an unbooked slot', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.findUnique
      .mockResolvedValueOnce({
        id: 'slot-1',
        date: new Date('2026-11-18T00:00:00.000Z'),
        startTime: '12:00',
        endTime: '14:00',
        booking: null,
      })
      .mockResolvedValueOnce({ id: 'slot-1', startTime: '13:00' });
    prisma.slot.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      slotsService.updateAdmin('slot-1', { startTime: '13:00' }),
    ).resolves.toMatchObject({ startTime: '13:00' });
    expect(prisma.slot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'slot-1', booking: { is: null } },
        data: { startTime: '13:00' },
      }),
    );
  });

  it('rejects changing the date or time of a booked slot', async () => {
    prisma.slot.findUnique.mockResolvedValue({
      id: 'slot-1',
      date: new Date('2026-11-19T00:00:00.000Z'),
      startTime: '12:00',
      endTime: '13:00',
      booking: { id: 'booking-1' },
    });

    await expect(
      slotsService.updateAdmin('slot-1', { startTime: '14:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_BOOKED_TIME_LOCKED' } });
    expect(prisma.slot.update).not.toHaveBeenCalled();
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
  });

  it('rejects invalid update ranges and updates into the past', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.findUnique.mockResolvedValue({
      id: 'slot-1',
      date: new Date('2026-11-19T00:00:00.000Z'),
      startTime: '09:00',
      endTime: '10:00',
      booking: null,
    });

    await expect(
      slotsService.updateAdmin('slot-1', { startTime: '10:00' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_TIME_RANGE_INVALID' } });
    await expect(
      slotsService.updateAdmin('slot-1', { date: '2026-11-17' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_IN_PAST' } });
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
  });

  it('returns a clear conflict when moving a slot to a duplicate date and start time', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.slot.findUnique.mockResolvedValue({
      id: 'slot-1',
      date: new Date('2026-11-18T00:00:00.000Z'),
      startTime: '12:00',
      endTime: '13:00',
      booking: null,
    });
    prisma.slot.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.19.1',
      }),
    );

    await expect(
      slotsService.updateAdmin('slot-1', { startTime: '12:30' }),
    ).rejects.toMatchObject({ response: { code: 'SLOT_DUPLICATE' } });
  });

  it('allows deleting an unbooked slot and rejects deleting a booked slot', async () => {
    prisma.slot.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    prisma.slot.findUnique.mockResolvedValue({
      booking: { id: 'booking-1' },
    });

    await expect(slotsService.deleteAdmin('slot-free')).resolves.toEqual({
      id: 'slot-free',
      deleted: true,
    });
    await expect(slotsService.deleteAdmin('slot-booked')).rejects.toMatchObject({
      response: { code: 'SLOT_BOOKED_DELETE' },
    });
    expect(prisma.slot.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'slot-free', booking: { is: null } },
    });
  });

  it('filters the admin slot list by date, availability, and booking state', async () => {
    prisma.slot.findMany.mockResolvedValue([]);
    prisma.slot.count.mockResolvedValue(0);

    await expect(
      slotsService.listAdmin({
        date: '2026-11-19',
        availability: 'unavailable',
        bookingStatus: 'booked',
        page: 1,
        pageSize: 20,
      }),
    ).resolves.toMatchObject({ total: 0, page: 1, totalPages: 0 });
    expect(prisma.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          date: new Date('2026-11-19T00:00:00.000Z'),
          isAvailable: false,
          booking: { isNot: null },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: 0,
        take: 20,
      }),
    );
  });
});
