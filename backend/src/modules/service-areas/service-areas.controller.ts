import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ServiceAreasService } from './service-areas.service';

@Controller('service-areas')
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreasService) {}

  @Get()
  findAll() {
    return this.serviceAreasService.findAll();
  }

  @Get('validate')
  async validate(@Query('pinCode') pinCode: string, @Query('serviceId') serviceId: string) {
    if (!pinCode || !serviceId) {
      throw new BadRequestException({
        message: 'A valid PIN code and service ID are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const supported = await this.serviceAreasService.validatePinForService(pinCode, serviceId);
    return { supported };
  }
}
