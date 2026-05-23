import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ShopStatus } from '@prisma/client';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;
}

export class UpdateShopDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsBoolean()
  @IsOptional()
  ai_auto_respond?: boolean;
}

export class UpdateShopStatusDto {
  @IsEnum(ShopStatus)
  status: ShopStatus;
}
