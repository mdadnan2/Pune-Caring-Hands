import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminBookingsController } from './admin-bookings.controller';

describe('AdminBookingsController', () => {
  it('protects booking operations with the shared JWT guard', () => {
    expect(Reflect.getMetadata('__guards__', AdminBookingsController)).toContain(JwtAuthGuard);
  });

  it('delegates cancel, reschedule, and complete operations to the service', async () => {
    const bookingsService = {
      cancelAdmin: jest.fn().mockResolvedValue({ status: 'CANCELLED' }),
      rescheduleAdmin: jest.fn().mockResolvedValue({ status: 'RESCHEDULED' }),
      completeAdmin: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
    };
    const controller = new AdminBookingsController(bookingsService as never);

    const request = { user: { id: 'admin-1', email: 'admin@example.com' } };
    await expect(controller.cancel('PCH-REF', request as never)).resolves.toEqual({ status: 'CANCELLED' });
    await expect(controller.reschedule('PCH-REF', { slotId: 'new-slot' }, request as never)).resolves.toEqual({
      status: 'RESCHEDULED',
    });
    await expect(controller.complete('PCH-REF', request as never)).resolves.toEqual({ status: 'COMPLETED' });
    expect(bookingsService.cancelAdmin).toHaveBeenCalledWith('PCH-REF', 'admin-1');
    expect(bookingsService.rescheduleAdmin).toHaveBeenCalledWith('PCH-REF', 'new-slot', 'admin-1');
    expect(bookingsService.completeAdmin).toHaveBeenCalledWith('PCH-REF', 'admin-1');
  });
});
