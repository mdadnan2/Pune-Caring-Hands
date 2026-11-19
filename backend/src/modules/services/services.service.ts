import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { UpdateAdminServiceDto } from './dto/update-admin-service.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { serviceItems: { where: { isActive: true }, orderBy: { name: 'asc' } } },
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isActive: true },
      include: { serviceItems: { where: { isActive: true }, orderBy: { name: 'asc' } } },
    });
    if (!service)
      throw new NotFoundException({ message: 'Service not found', code: 'SERVICE_NOT_FOUND' });
    return service;
  }

  async listAdmin() {
    return this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        serviceItems: { orderBy: [{ isActive: 'desc' }, { name: 'asc' }] },
      },
    });
  }

  async getAdminById(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { serviceItems: { orderBy: [{ isActive: 'desc' }, { name: 'asc' }] } },
    });
    if (!service) {
      throw new NotFoundException({ message: 'Service not found', code: 'SERVICE_NOT_FOUND' });
    }
    return service;
  }

  async updateAdmin(serviceId: string, dto: UpdateAdminServiceDto) {
    await this.getAdminById(serviceId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        message: 'Provide at least one field to update.',
        code: 'VALIDATION_ERROR',
      });
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
      include: { serviceItems: { orderBy: [{ isActive: 'desc' }, { name: 'asc' }] } },
    });
  }

  async listItemsAdmin(serviceId: string) {
    await this.getAdminById(serviceId);
    return this.prisma.serviceItem.findMany({
      where: { serviceId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createItemAdmin(serviceId: string, dto: CreateServiceItemDto) {
    await this.getAdminById(serviceId);
    return this.prisma.serviceItem.create({ data: { serviceId, ...dto } });
  }

  async updateItemAdmin(serviceId: string, itemId: string, dto: UpdateServiceItemDto) {
    await this.getAdminById(serviceId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        message: 'Provide at least one field to update.',
        code: 'VALIDATION_ERROR',
      });
    }
    const item = await this.prisma.serviceItem.findFirst({ where: { id: itemId, serviceId } });
    if (!item) {
      throw new NotFoundException({
        message: 'Service item not found',
        code: 'SERVICE_ITEM_NOT_FOUND',
      });
    }
    return this.prisma.serviceItem.update({ where: { id: itemId }, data: dto });
  }
}
