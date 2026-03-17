import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';
import { CheckoutDto, UpdateShopOrderStatusDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ==================== Customer Endpoints ====================

  @Post('orders/checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('orders')
  getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getMyOrders(userId, page, limit);
  }

  @Get('orders/:id')
  getOrderDetail(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderDetail(userId, orderId);
  }

  // ==================== Shop Owner Endpoints ====================

  @Get('shops/:shopId/orders')
  getShopOrders(
    @Param('shopId') shopId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getShopOrders(shopId, userId, page, limit);
  }

  @Patch('shop-orders/:id/status')
  updateShopOrderStatus(
    @Param('id') shopOrderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateShopOrderStatusDto,
  ) {
    return this.ordersService.updateShopOrderStatus(shopOrderId, userId, dto);
  }
}
