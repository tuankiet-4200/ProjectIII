import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod, ShopOrderStatus } from '@prisma/client';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  shipping_address: string;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}

export class UpdateShopOrderStatusDto {
  @IsEnum(ShopOrderStatus)
  status: ShopOrderStatus;
}
