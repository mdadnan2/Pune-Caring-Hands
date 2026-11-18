import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UPLOAD_MAX_FILE_SIZE_BYTES } from '@pch/shared';
import type { UploadedFile as ProofFile } from '../uploads/uploads.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('instructions')
  getInstructions() {
    return this.paymentsService.getInstructions();
  }

  @Post(':bookingRef/proof')
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: undefined,
      limits: { fileSize: UPLOAD_MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  submitProof(
    @Param('bookingRef') bookingRef: string,
    @UploadedFile() proof?: ProofFile,
  ) {
    return this.paymentsService.submitProof(bookingRef, proof);
  }
}
