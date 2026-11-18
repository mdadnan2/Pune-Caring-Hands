import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
  IsArray,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AppointmentType } from '@pch/shared';

function parseMultipartJson({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export class CreateBookingDto {
  @IsUUID()
  serviceId!: string;

  @IsEnum(AppointmentType)
  appointmentType!: AppointmentType;

  @IsString()
  @MinLength(2)
  patientName!: string;

  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  patientPhone!: string;

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  patientAlternatePhone?: string;

  @IsOptional()
  @IsString()
  patientEmail?: string;

  @IsString()
  @MinLength(10)
  patientAddress!: string;

  @Matches(/^\d{6}$/, { message: 'Enter a valid 6-digit PIN code' })
  patientPinCode!: string;

  @IsOptional()
  @IsString()
  patientMapsLink?: string;

  @IsOptional()
  @IsDateString()
  patientDateOfBirth?: string;

  @IsOptional()
  @IsUUID()
  slotId?: string;

  @IsOptional()
  @Transform(parseMultipartJson)
  @IsArray()
  @IsUUID('4', { each: true })
  serviceItemIds?: string[];

  @IsOptional()
  @Transform(parseMultipartJson)
  @IsObject()
  serviceDetails?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}
