import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminSlotsController } from './admin-slots.controller';

describe('AdminSlotsController', () => {
  it('protects all admin slot routes with the shared JWT guard', () => {
    expect(Reflect.getMetadata('__guards__', AdminSlotsController)).toContain(JwtAuthGuard);
  });
});
