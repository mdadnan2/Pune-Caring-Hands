import { SlotsService } from './slots.service';
import { PrismaService } from '../../common/prisma/prisma.service';

type MockPrismaSlots = {
  service: { findUnique: jest.Mock };
  slot: { findMany: jest.Mock };
};

describe('SlotsService', () => {
  let prisma: MockPrismaSlots;
  let slotsService: SlotsService;

  beforeEach(() => {
    prisma = {
      service: {
        findUnique: jest.fn(),
      },
      slot: {
        findMany: jest.fn(),
      },
    };

    slotsService = new SlotsService(prisma as unknown as PrismaService);
  });

  it('uses the requested date and service filters when fetching available slots', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 'svc-1' });
    prisma.slot.findMany.mockResolvedValue([{ id: 'slot-1', date: '2026-11-18T00:00:00.000Z' }]);

    await slotsService.findAvailable({ serviceId: 'svc-1', date: '2026-11-18' });

    expect(prisma.service.findUnique).toHaveBeenCalledWith({
      where: { id: 'svc-1' },
      select: { id: true },
    });

    expect(prisma.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          booking: null,
          date: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('excludes unavailable and booked slots', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 'svc-1' });
    prisma.slot.findMany.mockResolvedValue([]);

    await slotsService.findAvailable({ serviceId: 'svc-1' });

    expect(prisma.slot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAvailable: true,
          booking: null,
        }),
      }),
    );
  });
});
