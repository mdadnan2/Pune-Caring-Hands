import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAdminSlotDto } from './dto/create-admin-slot.dto';
import { AdminSlotsQueryDto } from './dto/admin-slots-query.dto';
import { UpdateAdminSlotDto } from './dto/update-admin-slot.dto';
import { SlotsService } from './slots.service';

@Controller('admin/slots')
@UseGuards(JwtAuthGuard)
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  list(@Query() query: AdminSlotsQueryDto) {
    return this.slotsService.listAdmin(query);
  }

  @Post()
  create(@Body() dto: CreateAdminSlotDto) {
    return this.slotsService.createAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminSlotDto) {
    return this.slotsService.updateAdmin(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.slotsService.deleteAdmin(id);
  }
}
