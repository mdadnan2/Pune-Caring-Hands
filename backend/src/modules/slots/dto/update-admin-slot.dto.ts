import { IsBoolean, IsString, Matches, ValidateIf } from 'class-validator';

export class UpdateAdminSlotDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must use the YYYY-MM-DD format.',
  })
  date?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Start time must be a valid 24-hour HH:mm value.',
  })
  startTime?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'End time must be a valid 24-hour HH:mm value.',
  })
  endTime?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;
}
