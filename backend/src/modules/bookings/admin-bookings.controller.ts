import {
  Body,
  Controller,
  BadRequestException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthenticatedAdmin, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

type AdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  list(@Query() query: AdminBookingQueryDto) {
    return this.bookingsService.listAdmin(query);
  }

  @Get(':bookingRef')
  get(@Param('bookingRef') bookingRef: string) {
    return this.bookingsService.getAdminByRef(bookingRef);
  }

  @Post(':bookingRef/cancel')
  cancel(@Param('bookingRef') bookingRef: string, @Req() request: AdminRequest) {
    return this.bookingsService.cancelAdmin(bookingRef, request.user.id);
  }

  @Post(':bookingRef/reschedule')
  reschedule(
    @Param('bookingRef') bookingRef: string,
    @Body() dto: RescheduleBookingDto,
    @Req() request: AdminRequest,
  ) {
    return this.bookingsService.rescheduleAdmin(bookingRef, dto.slotId, request.user.id);
  }

  @Post(':bookingRef/complete')
  complete(@Param('bookingRef') bookingRef: string, @Req() request: AdminRequest) {
    return this.bookingsService.completeAdmin(bookingRef, request.user.id);
  }

  @Get(':bookingRef/files/:kind')
  async file(
    @Param('bookingRef') bookingRef: string,
    @Param('kind') kind: string,
    @Res() response: Response,
  ): Promise<void> {
    if (kind !== 'proof' && kind !== 'prescription') {
      throw new BadRequestException({ message: 'Invalid file type', code: 'VALIDATION_ERROR' });
    }

    const storedFile = await this.bookingsService.getAdminFile(bookingRef, kind);
    response.set({
      'Content-Type': storedFile.mimeType,
      'Content-Disposition': `inline; filename="${kind}-${bookingRef}.${extensionFor(storedFile.mimeType)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(storedFile.buffer);
  }
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}
