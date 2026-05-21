import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  value: number; // % hoặc số tiền

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usage_limit?: number;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  @IsString()
  shop_id?: string;
}

export class ShopAmountDto {
  @IsString()
  shop_id: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class ApplyCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  order_amount: number; // For platform-wide coupons

  @IsOptional()
  shop_amounts?: ShopAmountDto[]; // For shop-specific coupons
}
