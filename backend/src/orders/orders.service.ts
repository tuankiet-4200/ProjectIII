import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CheckoutDto, UpdateShopOrderStatusDto } from './dto';
import { Prisma, ShopOrder } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsGateway,
    @Inject('RMQ_SERVICE') private readonly rmqClient: ClientProxy,
  ) {}

  /**
   * Async Checkout Logic via RabbitMQ
   */
  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Get cart from Redis to ensure it's not empty
    const cartKey = `cart:${userId}`;
    const cartData = await this.redis.hgetall(cartKey);

    if (!cartData || Object.keys(cartData).length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống');
    }

    const selectedProductIds = dto.selected_product_ids?.filter(Boolean) || [];
    const checkoutCartData =
      selectedProductIds.length > 0
        ? Object.fromEntries(
            Object.entries(cartData).filter(([productId]) =>
              selectedProductIds.includes(productId),
            ),
          )
        : cartData;

    if (Object.keys(checkoutCartData).length === 0) {
      throw new BadRequestException('Vui lòng chọn sản phẩm cần thanh toán');
    }

    // 2. Create a pending parent order immediately
    // Calculate an approximate total or just keep it 0 until processor finishes
    const parentOrder = await this.prisma.parentOrder.create({
      data: {
        user_id: userId,
        total_payment: new Prisma.Decimal(0), // Will be updated by processor
        payment_method: dto.payment_method,
        shipping_address: dto.shipping_address,
      },
    });

    // 3. Emit message to RabbitMQ
    this.rmqClient.emit('order.create', {
      userId,
      parentOrderId: parentOrder.id,
      dto,
      cartData: checkoutCartData,
    });

    if (selectedProductIds.length > 0) {
      await this.redis.hdel(cartKey, ...Object.keys(checkoutCartData));
    } else {
      await this.redis.del(cartKey);
    }

    return {
      message: 'Đơn hàng đang được xử lý',
      parent_order_id: parentOrder.id,
      status: 'PROCESSING'
    };
  }

  private calcDiscount(coupon: any, orderAmount: number): number {
    if (coupon.type === 'PERCENTAGE') {
      let discount = (orderAmount * Number(coupon.value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
      return Math.round(discount);
    }
    return Math.min(Number(coupon.value), orderAmount);
  }

  async getMyOrders(userId: string, page = 1, limit = 10) {

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.parentOrder.findMany({
        where: { user_id: userId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          shop_orders: {
            include: {
              shop: { select: { id: true, name: true } },
              order_items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.parentOrder.count({ where: { user_id: userId } }),
    ]);

    return { orders, total, page, limit };
  }

  async getOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.parentOrder.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        shop_orders: {
          include: {
            shop: { select: { id: true, name: true, logo_url: true } },
            order_items: {
              include: {
                product: {
                  select: { id: true, name: true, slug: true, images: true },
                },
              },
            },
            tracking_events: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Shop owner: get orders for their shop
  async getShopOrders(shopId: string, ownerId: string, page = 1, limit = 10) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your shop');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.shopOrder.findMany({
        where: { shop_id: shopId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order_items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          parent_order: {
            select: {
              shipping_address: true,
              payment_method: true,
              user: { select: { full_name: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.shopOrder.count({ where: { shop_id: shopId } }),
    ]);

    return { orders, total, page, limit };
  }

  async updateShopOrderStatus(
    shopOrderId: string,
    ownerId: string,
    dto: UpdateShopOrderStatusDto,
  ) {
    const shopOrder = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
      include: { shop: true },
    });

    if (!shopOrder) throw new NotFoundException('Shop order not found');
    if (shopOrder.shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your shop order');
    }

    const updatedOrder = await this.prisma.shopOrder.update({
      where: { id: shopOrderId },
      data: { status: dto.status },
      include: {
        parent_order: true,
        shop: true,
      },
    });

    // Notify the customer about the status change
    this.logger.log(`Emitting orderStatusChanged: userId=${updatedOrder.parent_order.user_id}, shopOrderId=${updatedOrder.id}, status=${updatedOrder.status}`);
    this.notifications.emitOrderStatusChanged(updatedOrder.parent_order.user_id, {
      orderId: updatedOrder.parent_order_id,
      shopOrderId: updatedOrder.id,
      shopName: updatedOrder.shop.name,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }
}
