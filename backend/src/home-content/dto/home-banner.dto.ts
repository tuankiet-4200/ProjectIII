import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHomeBannerDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  eyebrow?: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(260)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  primary_label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  primary_href?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  secondary_label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  secondary_href?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  visual_label?: string;
}
