import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus } from '@pch/shared';

export class AdminBookingQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
