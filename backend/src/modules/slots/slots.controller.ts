import { Controller, Get, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get('available')
  findAvailable(@Query('date') date?: string, @Query('serviceId') _serviceId?: string) {
    return this.slotsService.findAvailable(date);
  }
}
