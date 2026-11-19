import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UPLOAD_MAX_FILE_SIZE_BYTES } from '@pch/shared';
import { BookingsService } from './bookings.service';
import type { UploadedFile as BookingUploadedFile } from '../uploads/uploads.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /api/v1/bookings
   * Creates a booking. Accepts multipart/form-data to support prescription upload.
   */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'prescription', maxCount: 1 }], {
      storage: undefined,
      limits: { fileSize: UPLOAD_MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  async create(
    @Body() dto: CreateBookingDto,
    @UploadedFiles() files?: { prescription?: BookingUploadedFile[] },
  ) {
    const prescriptionFile = files?.prescription?.[0];
    return this.bookingsService.create(dto, prescriptionFile);
  }

  @Get(':bookingRef')
  findByRef(@Param('bookingRef') bookingRef: string) {
    return this.bookingsService.findByRef(bookingRef);
  }
}
