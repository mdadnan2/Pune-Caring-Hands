import { IsString, Matches } from 'class-validator';

export class CreateAdminSlotDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must use the YYYY-MM-DD format.',
  })
  date!: string;

  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Start time must be a valid 24-hour HH:mm value.',
  })
  startTime!: string;

  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'End time must be a valid 24-hour HH:mm value.',
  })
  endTime!: string;
}
