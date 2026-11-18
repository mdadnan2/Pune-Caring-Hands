import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

describe('SlotsController', () => {
  it('accepts serviceId for compatibility without applying a service-specific slot filter', async () => {
    const slotsService = {
      findAvailable: jest.fn().mockResolvedValue([]),
    } as unknown as SlotsService;
    const controller = new SlotsController(slotsService);

    await controller.findAvailable('2026-11-18', 'svc-1');

    expect(slotsService.findAvailable).toHaveBeenCalledWith('2026-11-18');
  });
});
