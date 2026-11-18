import { SlotsService } from './slots.service';
import { PrismaService } from '../../common/prisma/prisma.service';

type MockPrismaSlots = {
  slot: { findMany: jest.Mock };
};

describe('SlotsService', () => {
  let prisma: MockPrismaSlots;
  let slotsService: SlotsService;

  beforeEach(() => {
    prisma = {
      slot: {
        findMany: jest.fn(),
      },
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
});
