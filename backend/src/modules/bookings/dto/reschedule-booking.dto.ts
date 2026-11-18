import { IsUUID } from 'class-validator';

export class RescheduleBookingDto {
  @IsUUID()
  slotId!: string;
}
