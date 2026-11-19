import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateServiceItemDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive = true;
}
