import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  private cartKey(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string) {
    const cartData = await this.redis.hgetall(this.cartKey(userId));

    if (!cartData || Object.keys(cartData).length === 0) {
      return { items: [], grouped_by_shop: [] };
    }

    // Get product details for all items
    const productIds = Object.keys(cartData);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        shop: { select: { id: true, name: true, logo_url: true } },
      },
    });

    const items = products.map((product) => ({
      product_id: product.id,
      quantity: parseInt(cartData[product.id], 10),
      product: product,
    }));

    // Group items by shop
    const shopMap = new Map<string, any>();
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of items) {
      const shopId = item.product.shop.id;
      if (!shopMap.has(shopId)) {
        shopMap.set(shopId, {
          shop: item.product.shop,
          items: [],
          subtotal: 0,
        });
      }
      const group = shopMap.get(shopId);
      group.items.push(item);
      const itemSubtotal = Number(item.product.price) * item.quantity;
      group.subtotal += itemSubtotal;
      totalItems += item.quantity;
      totalAmount += itemSubtotal;
    }

    return {
      groups: Array.from(shopMap.values()),
      total_items: totalItems,
      total_amount: totalAmount,
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    // Validate product exists and has enough stock
    const product = await this.prisma.product.findUnique({
      where: { id: dto.product_id },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.stock_quantity < dto.quantity) {
      throw new BadRequestException('Not enough stock');
    }

    // Check current quantity in cart
    const currentQty = await this.redis.hget(
      this.cartKey(userId),
      dto.product_id,
    );
    const newQty = (currentQty ? parseInt(currentQty, 10) : 0) + dto.quantity;

    if (newQty > product.stock_quantity) {
      throw new BadRequestException('Exceeds available stock');
    }

    await this.redis.hset(
      this.cartKey(userId),
      dto.product_id,
      newQty.toString(),
    );

    return { message: 'Item added to cart', product_id: dto.product_id, quantity: newQty };
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (quantity > product.stock_quantity) {
      throw new BadRequestException('Exceeds available stock');
    }

    await this.redis.hset(
      this.cartKey(userId),
      productId,
      quantity.toString(),
    );

    return { message: 'Cart updated', product_id: productId, quantity };
  }

  async removeItem(userId: string, productId: string) {
    await this.redis.hdel(this.cartKey(userId), productId);
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    await this.redis.del(this.cartKey(userId));
    return { message: 'Cart cleared' };
  }
}
