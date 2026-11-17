import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
    if (!service) throw new NotFoundException({ message: 'Service not found', code: 'SERVICE_NOT_FOUND' });
    return service;
  }
}
