import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { PaymentMethod, ShopOrderStatus } from '@prisma/client';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  shipping_address: string;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selected_product_ids?: string[];
}

export class UpdateShopOrderStatusDto {
  @IsEnum(ShopOrderStatus)
  status: ShopOrderStatus;
}
