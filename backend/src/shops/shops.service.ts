import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto, UpdateShopDto, UpdateShopStatusDto } from './dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateShopDto) {
    // Check if user already owns a shop
    const existing = await this.prisma.shop.findFirst({
      where: { owner_id: ownerId },
    });
    if (existing) {
      throw new ConflictException('You already own a shop');
    }

    return this.prisma.shop.create({
      data: {
        owner_id: ownerId,
        ...dto,
      },
    });
  }

  async findById(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, full_name: true, email: true },
        },
        _count: { select: { products: true } },
        products: {
          where: { stock_quantity: { gt: 0 } },
          orderBy: { sales_count: 'desc' },
          take: 20,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            sales_count: true,
            stock_quantity: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async findMyShop(ownerId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { owner_id: ownerId },
      include: {
        _count: { select: { products: true, shop_orders: true } },
      },
    });
    if (!shop) throw new NotFoundException('You do not own a shop yet');
    return shop;
  }

  async update(shopId: string, ownerId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your shop');
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: dto,
    });
  }

  async updateStatus(shopId: string, dto: UpdateShopStatusDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    return this.prisma.shop.update({
      where: { id: shopId },
      data: { status: dto.status },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : { status: 'ACTIVE' as any };
    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          owner: { select: { id: true, full_name: true, email: true, phone: true } },
          _count: { select: { products: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { shops, total, page, limit };
  }

  async getAnalytics(ownerId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { owner_id: ownerId },
    });
    if (!shop) {
      throw new NotFoundException('Bạn chưa đăng ký cửa hàng');
    }

    const shopId = shop.id;

    // 1. Fetch all non-cancelled shop orders with items
    const orders = await this.prisma.shopOrder.findMany({
      where: {
        shop_id: shopId,
      },
      include: {
        order_items: true,
      },
    });

    const nonCancelledOrders = orders.filter((o) => o.status !== 'CANCELLED');

    // Total orders count
    const totalOrders = nonCancelledOrders.length;

    // Total revenue
    const totalRevenue = nonCancelledOrders.reduce((sum, order) => {
      const orderSum = order.order_items.reduce((itemSum, item) => {
        return itemSum + Number(item.price_at_purchase) * item.quantity;
      }, 0);
      return sum + orderSum;
    }, 0);

    // Pending orders count
    const pendingOrders = orders.filter((o) =>
      ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPING'].includes(o.status),
    ).length;

    // Average order value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Fetch top products
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        shop_order: {
          shop_id: shopId,
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    });

    const productSalesMap = new Map<string, { name: string; sales: number; revenue: number; images: string[] }>();
    for (const item of orderItems) {
      const pId = item.product_id;
      const price = Number(item.price_at_purchase);
      const qty = item.quantity;
      const rev = price * qty;

      const existing = productSalesMap.get(pId);
      if (existing) {
        existing.sales += qty;
        existing.revenue += rev;
      } else {
        productSalesMap.set(pId, {
          name: item.product.name,
          sales: qty,
          revenue: rev,
          images: item.product.images || [],
        });
      }
    }

    const topProducts = Array.from(productSalesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 3. Generate Chart Data
    // We will distribute the non-cancelled orders into time categories.
    const now = new Date();

    // Yearly: Grouped by Month name for the last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearlyMap = new Map<number, number>(); // month index (0-11) -> sum
    for (let i = 0; i < 12; i++) {
      const m = (now.getMonth() - i + 12) % 12;
      yearlyMap.set(m, 0);
    }

    // Monthly: last 4 weeks of the current month
    const weeklyMap = new Map<string, number>();
    weeklyMap.set('W1', 0);
    weeklyMap.set('W2', 0);
    weeklyMap.set('W3', 0);
    weeklyMap.set('W4', 0);

    // Weekly: 7 days of the current week (Mon to Sun)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dailyMap.set(dayNames[d.getDay()], 0);
    }

    for (const order of nonCancelledOrders) {
      const orderDate = new Date(order.created_at);
      const orderRevenue = order.order_items.reduce((sum, item) => {
        return sum + Number(item.price_at_purchase) * item.quantity;
      }, 0);

      // Distribute to Yearly
      const monthsDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + now.getMonth() - orderDate.getMonth();
      if (monthsDiff >= 0 && monthsDiff < 12) {
        const m = orderDate.getMonth();
        yearlyMap.set(m, (yearlyMap.get(m) || 0) + orderRevenue);
      }

      // Distribute to Monthly (if it's in the current month)
      if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
        const dayOfMonth = orderDate.getDate();
        let weekKey = 'W1';
        if (dayOfMonth > 7 && dayOfMonth <= 14) weekKey = 'W2';
        else if (dayOfMonth > 14 && dayOfMonth <= 21) weekKey = 'W3';
        else if (dayOfMonth > 21) weekKey = 'W4';

        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + orderRevenue);
      }

      // Distribute to Daily (if within last 7 days)
      const timeDiff = now.getTime() - orderDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const dayName = dayNames[orderDate.getDay()];
        dailyMap.set(dayName, (dailyMap.get(dayName) || 0) + orderRevenue);
      }
    }

    // Convert Map back to array format
    const yearlyChart = Array.from(yearlyMap.entries())
      .map(([monthIndex, value]) => ({ label: monthNames[monthIndex], value }))
      .reverse(); // chronological

    const monthlyChart = Array.from(weeklyMap.entries())
      .map(([weekKey, value]) => ({ label: weekKey, value }));

    // Order daily list starting from 7 days ago up to today
    const weeklyChart = Array.from(dailyMap.entries())
      .map(([dayName, value]) => ({ label: dayName, value }))
      .reverse();

    return {
      shopInfo: {
        name: shop.name,
        rating: Number(shop.rating),
      },
      totalRevenue,
      totalOrders,
      pendingOrders,
      averageOrderValue,
      topProducts,
      revenueChart: {
        yearly: yearlyChart,
        monthly: monthlyChart,
        weekly: weeklyChart,
      },
    };
  }
}

