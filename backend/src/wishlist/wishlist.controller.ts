import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  /** Get user's wishlist */
  @Get()
  getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  /** Toggle product in wishlist */
  @Post('toggle')
  toggleWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: ToggleWishlistDto,
  ) {
    return this.wishlistService.toggleWishlist(userId, dto.product_id);
  }

  /** Check if a product is wishlisted */
  @Get('check/:productId')
  checkWishlist(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.checkWishlist(userId, productId);
  }
}
