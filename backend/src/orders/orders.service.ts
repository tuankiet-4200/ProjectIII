import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CheckoutDto, UpdateShopOrderStatusDto } from './dto';
import { Prisma, ShopOrder } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsGateway,
  ) {}

  /**
   * Core Checkout Logic with Order Splitting
   * 1. Get cart items from Redis
   * 2. Validate stock & fetch current prices
   * 3. Group items by shop_id
   * 4. Create parent_order (total payment)
   * 5. Create shop_orders for each shop
   * 6. Create order_items with price snapshot
   * 7. Decrement stock, increment sales_count
   * 8. Clear cart from Redis
   * All wrapped in a Prisma transaction for ACID compliance
   */
  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Get cart from Redis
    const cartKey = `cart:${userId}`;
    const cartData = await this.redis.hgetall(cartKey);

    if (!cartData || Object.keys(cartData).length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const productIds = Object.keys(cartData);

    // 2. Fetch all products with their shops
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { shop: true },
    });

    // Validate all products exist
    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Some products in your cart no longer exist',
      );
    }

    // Validate stock for each product
    for (const product of products) {
      const requestedQty = parseInt(cartData[product.id], 10);
      if (product.stock_quantity < requestedQty) {
        throw new BadRequestException(
          `Not enough stock for "${product.name}". Available: ${product.stock_quantity}`,
        );
      }
    }

    // 3. Group items by shop_id
    const shopGroups = new Map<
      string,
      { shopId: string; items: { product: (typeof products)[0]; quantity: number }[] }
    >();

    for (const product of products) {
      const quantity = parseInt(cartData[product.id], 10);
      if (!shopGroups.has(product.shop_id)) {
        shopGroups.set(product.shop_id, {
          shopId: product.shop_id,
          items: [],
        });
      }
      shopGroups.get(product.shop_id)!.items.push({ product, quantity });
    }

    // 4. Calculate total payment
    let totalPayment = new Prisma.Decimal(0);
    for (const group of shopGroups.values()) {
      for (const item of group.items) {
        totalPayment = totalPayment.add(
          new Prisma.Decimal(item.product.price.toString()).mul(item.quantity),
        );
      }
    }

    // 5-8. Execute everything in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create parent order
      const parentOrder = await tx.parentOrder.create({
        data: {
          user_id: userId,
          total_payment: totalPayment,
          payment_method: dto.payment_method,
          shipping_address: dto.shipping_address,
        },
      });

      const shopOrders: ShopOrder[] = [];

      // Create shop orders and order items
      for (const group of shopGroups.values()) {
        const shopOrder = await tx.shopOrder.create({
          data: {
            parent_order_id: parentOrder.id,
            shop_id: group.shopId,
            shipping_fee: 0,
          },
        });

        // Create order items for this shop order
        for (const item of group.items) {
          await tx.orderItem.create({
            data: {
              shop_order_id: shopOrder.id,
              product_id: item.product.id,
              quantity: item.quantity,
              price_at_purchase: item.product.price,
            },
          });

          // Decrement stock and increment sales count
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              stock_quantity: { decrement: item.quantity },
              sales_count: { increment: item.quantity },
            },
          });
        }

        shopOrders.push(shopOrder);
      }

      return { parentOrder, shopOrders };
    });

    // Clear cart from Redis after successful transaction
    await this.redis.del(cartKey);

    return {
      message: 'Order placed successfully',
      parent_order_id: result.parentOrder.id,
      total_payment: result.parentOrder.total_payment,
      shop_orders_count: result.shopOrders.length,
      shop_order_ids: result.shopOrders.map((so) => so.id),
    };
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
        parent_order: true, // Needed to find the customer's User ID
        shop: true,
      },
    });

    // Notify the customer about the status change
    this.notifications.emitOrderStatusChanged(updatedOrder.parent_order.user_id, {
      shopOrderId: updatedOrder.id,
      shopName: updatedOrder.shop.name,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }
}
