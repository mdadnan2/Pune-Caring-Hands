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
import { BookingsService } from './bookings.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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
    FileFieldsInterceptor([{ name: 'prescription', maxCount: 1 }], { storage: undefined }),
  )
  async create(
    @Body() dto: CreateBookingDto,
    @UploadedFiles() files?: { prescription?: UploadedFile[] },
  ) {
    let prescriptionFileKey: string | undefined;
    const prescriptionFile = files?.prescription?.[0];
    if (prescriptionFile) {
      // We don't have bookingRef yet — use a temp placeholder; will be replaced after booking creation
      // Actually we save after booking creation below
      this.uploadsService.validateFile(prescriptionFile);
    }

    const booking = await this.bookingsService.create(dto);

    if (prescriptionFile) {
      prescriptionFileKey = await this.uploadsService.saveFile(
        prescriptionFile,
        'prescriptions',
        booking.bookingRef,
        'prescription',
      );
      // Update serviceDetails with the file key
      await this.updatePrescriptionKey(booking.id, prescriptionFileKey);
    }

    return booking;
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
    @UploadedFile() proofFile?: UploadedFile,
  ) {
    let proofFileKey: string | undefined;
    if (proofFile) {
      this.uploadsService.validateFile(proofFile);
      proofFileKey = await this.uploadsService.saveFile(proofFile, 'payments', bookingRef, 'proof');
    }
    return this.bookingsService.submitPaymentProof(bookingRef, dto, proofFileKey);
  }

  private async updatePrescriptionKey(bookingId: string, key: string) {
    // Import PrismaService via the service to avoid direct access in controller
    // This is a thin wrapper — actual logic delegated
    await this.bookingsService.updatePrescriptionKey(bookingId, key);
  }
}
