import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminServicesController } from './services.controller';

describe('AdminServicesController', () => {
  it('uses the shared admin JWT guard', () => {
    expect(Reflect.getMetadata('__guards__', AdminServicesController)).toContain(JwtAuthGuard);
  });

  it('delegates service and item operations to the service', async () => {
    const servicesService = {
      listAdmin: jest.fn().mockResolvedValue([]),
      getAdminById: jest.fn().mockResolvedValue({ id: 'service-1' }),
      updateAdmin: jest.fn().mockResolvedValue({ id: 'service-1', isActive: false }),
      listItemsAdmin: jest.fn().mockResolvedValue([]),
      createItemAdmin: jest.fn().mockResolvedValue({ id: 'item-1' }),
      updateItemAdmin: jest.fn().mockResolvedValue({ id: 'item-1', price: 600 }),
    };
    const controller = new AdminServicesController(servicesService as never);

    await expect(controller.list()).resolves.toEqual([]);
    await expect(controller.update('service-1', { isActive: false })).resolves.toMatchObject({
      isActive: false,
    });
    await expect(
      controller.createItem('service-1', { name: 'CBC', price: 500, isActive: true }),
    ).resolves.toEqual({ id: 'item-1' });
    await expect(
      controller.updateItem('service-1', 'item-1', { price: 600 }),
    ).resolves.toMatchObject({ price: 600 });
  });
});
