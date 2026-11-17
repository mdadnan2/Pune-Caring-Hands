import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ServiceAreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, pinCode: true },
    });
  }

  /**
   * Validates that a PIN code is supported for a given service.
   * If no ServiceAreaService rows exist for the service, it is available in all active areas.
   */
  async validatePinForService(pinCode: string, serviceId: string): Promise<boolean> {
    const area = await this.prisma.serviceArea.findFirst({
      where: { pinCode, isActive: true },
    });
    if (!area) return false;

    const specificRestrictions = await this.prisma.serviceAreaService.count({
      where: { serviceId },
    });

    if (specificRestrictions === 0) return true; // available in all active areas

    const allowed = await this.prisma.serviceAreaService.findFirst({
      where: { serviceAreaId: area.id, serviceId },
    });
    return !!allowed;
  }
}
