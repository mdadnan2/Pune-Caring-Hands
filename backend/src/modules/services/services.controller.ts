import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { UpdateAdminServiceDto } from './dto/update-admin-service.dto';
import { UpdateServiceItemDto } from './dto/update-service-item.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }
}

@Controller('admin/services')
@UseGuards(JwtAuthGuard)
export class AdminServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list() {
    return this.servicesService.listAdmin();
  }

  @Get(':serviceId')
  get(@Param('serviceId') serviceId: string) {
    return this.servicesService.getAdminById(serviceId);
  }

  @Patch(':serviceId')
  update(@Param('serviceId') serviceId: string, @Body() dto: UpdateAdminServiceDto) {
    return this.servicesService.updateAdmin(serviceId, dto);
  }

  @Get(':serviceId/items')
  listItems(@Param('serviceId') serviceId: string) {
    return this.servicesService.listItemsAdmin(serviceId);
  }

  @Post(':serviceId/items')
  createItem(@Param('serviceId') serviceId: string, @Body() dto: CreateServiceItemDto) {
    return this.servicesService.createItemAdmin(serviceId, dto);
  }

  @Patch(':serviceId/items/:itemId')
  updateItem(
    @Param('serviceId') serviceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateServiceItemDto,
  ) {
    return this.servicesService.updateItemAdmin(serviceId, itemId, dto);
  }
}
