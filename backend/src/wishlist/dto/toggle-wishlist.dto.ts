import { IsString, IsUUID } from 'class-validator';

export class ToggleWishlistDto {
  @IsString()
  @IsUUID()
  product_id: string;
}
