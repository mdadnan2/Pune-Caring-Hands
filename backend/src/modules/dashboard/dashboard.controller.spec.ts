import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  it('uses the shared admin JWT guard', () => {
    expect(Reflect.getMetadata('__guards__', DashboardController)).toContain(JwtAuthGuard);
  });

  it('delegates dashboard loading to the service', async () => {
    const dashboardService = { getDashboard: jest.fn().mockResolvedValue({ kpis: {} }) };
    const controller = new DashboardController(dashboardService as never);
    await expect(controller.getDashboard()).resolves.toEqual({ kpis: {} });
  });
});
