import { Controller, Get, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get('available')
  findAvailable(@Query('serviceId') serviceId?: string, @Query('date') date?: string) {
    return this.slotsService.findAvailable({ serviceId, date });
  }
}
