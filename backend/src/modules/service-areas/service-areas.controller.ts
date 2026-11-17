import { Controller, Get } from '@nestjs/common';
import { ServiceAreasService } from './service-areas.service';

@Controller('service-areas')
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreasService) {}

  @Get()
  findAll() {
    return this.serviceAreasService.findAll();
  }
}
