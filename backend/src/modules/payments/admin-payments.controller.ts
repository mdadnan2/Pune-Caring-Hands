import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedAdmin, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { PaymentsService } from './payments.service';

type AdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/payments')
@UseGuards(JwtAuthGuard)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Patch(':paymentId/verify')
  verify(@Param('paymentId') paymentId: string, @Req() request: AdminRequest) {
    return this.paymentsService.verify(paymentId, request.user.id);
  }

  @Patch(':paymentId/reject')
  reject(
    @Param('paymentId') paymentId: string,
    @Body() dto: RejectPaymentDto,
    @Req() request: AdminRequest,
  ) {
    return this.paymentsService.reject(paymentId, request.user.id, dto);
  }
}
