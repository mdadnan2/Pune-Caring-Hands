import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UPLOAD_MAX_FILE_SIZE_BYTES } from '@pch/shared';
import { BookingsService } from './bookings.service';
import { UploadsService } from '../uploads/uploads.service';
import type { UploadedFile as BookingUploadedFile } from '../uploads/uploads.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly uploadsService: UploadsService,
  ) {}

  /**
   * POST /api/v1/bookings
   * Creates a booking. Accepts multipart/form-data to support prescription upload.
   */
  @Post()
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

  /**
   * POST /api/v1/bookings/:bookingRef/payment
   * Patient submits UPI transaction ID + optional proof screenshot.
   */
  @Post(':bookingRef/payment')
  @UseInterceptors(FileInterceptor('proof', { storage: undefined }))
  async submitPayment(
    @Param('bookingRef') bookingRef: string,
    @Body() dto: SubmitPaymentDto,
    @UploadedFile() proofFile?: BookingUploadedFile,
  ) {
    let proofFileKey: string | undefined;
    if (proofFile) {
      this.uploadsService.validateFile(proofFile);
      proofFileKey = await this.uploadsService.saveFile(proofFile, 'payments', bookingRef, 'proof');
    }
    return this.bookingsService.submitPaymentProof(bookingRef, dto, proofFileKey);
  }
}
