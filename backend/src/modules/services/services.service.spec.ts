import { PrismaService } from '../../common/prisma/prisma.service';
import { ServicesService } from './services.service';

describe('ServicesService admin management', () => {
  let prisma: {
    service: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    serviceItem: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: ServicesService;

  beforeEach(() => {
    prisma = {
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      serviceItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ServicesService(prisma as unknown as PrismaService);
  });

  it('lists all services including inactive services and items', async () => {
    prisma.service.findMany.mockResolvedValue([{ id: 'service-1', isActive: false }]);
    await expect(service.listAdmin()).resolves.toEqual([{ id: 'service-1', isActive: false }]);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.any(Object),
      }),
    );
  });

  it('updates service pricing and activation without changing historical booking items', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', name: 'ECG', isActive: true });
    prisma.service.update.mockResolvedValue({ id: 'service-1', basePrice: 800, isActive: false });

    await expect(
      service.updateAdmin('service-1', { basePrice: 800, isActive: false }),
    ).resolves.toEqual({
      id: 'service-1',
      basePrice: 800,
      isActive: false,
    });
    expect(prisma.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'service-1' },
        data: { basePrice: 800, isActive: false },
      }),
    );
  });

  it('rejects a base price for item-priced services', async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: 'service-1',
      slug: 'blood-test-at-home',
      basePrice: null,
    });

    await expect(service.updateAdmin('service-1', { basePrice: 500 })).rejects.toMatchObject({
      response: { code: 'INVALID_PRICING_CONFIGURATION' },
    });
    expect(prisma.service.update).not.toHaveBeenCalled();
  });

  it('clears a legacy base price when an item-priced service is edited', async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: 'service-1',
      slug: 'xray-at-home',
      basePrice: 800,
    });
    prisma.service.update.mockResolvedValue({ id: 'service-1', basePrice: null });

    await service.updateAdmin('service-1', { isActive: false });

    expect(prisma.service.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false, basePrice: null } }),
    );
  });

  it('creates and updates active blood-test or X-ray items', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', name: 'Blood Tests' });
    prisma.serviceItem.create.mockResolvedValue({
      id: 'item-1',
      name: 'CBC',
      price: 500,
      isActive: true,
    });
    prisma.serviceItem.findFirst.mockResolvedValue({ id: 'item-1', serviceId: 'service-1' });
    prisma.serviceItem.update.mockResolvedValue({
      id: 'item-1',
      name: 'CBC',
      price: 600,
      isActive: true,
    });

    await expect(
      service.createItemAdmin('service-1', { name: 'CBC', price: 500, isActive: true }),
    ).resolves.toMatchObject({ price: 500 });
    await expect(
      service.updateItemAdmin('service-1', 'item-1', { price: 600 }),
    ).resolves.toMatchObject({ price: 600 });
  });

  it('rejects update of an item that belongs to another or missing service', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 'service-1', name: 'Blood Tests' });
    prisma.serviceItem.findFirst.mockResolvedValue(null);

    await expect(
      service.updateItemAdmin('service-1', 'missing', { price: 600 }),
    ).rejects.toMatchObject({
      response: { code: 'SERVICE_ITEM_NOT_FOUND' },
    });
  });

  it('rejects public item selection through inactive service lookup', async () => {
    prisma.service.findFirst = jest.fn().mockResolvedValue(null);
    await expect(service.findBySlug('blood-test-at-home')).rejects.toMatchObject({
      response: { code: 'SERVICE_NOT_FOUND' },
    });
  });
});
