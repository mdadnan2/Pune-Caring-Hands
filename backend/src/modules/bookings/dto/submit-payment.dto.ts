import { IsString, MinLength } from 'class-validator';

export class SubmitPaymentDto {
  @IsString()
  @MinLength(6)
  upiTransactionId!: string;
}
