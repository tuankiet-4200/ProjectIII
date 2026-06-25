import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toNumber(value: unknown) {
  return Number(value || 0);
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const weekStart = startOfDay(addDays(now, -6));
    const monthStart = startOfDay(addDays(now, -27));

    const [
      totalUsers,
      customers,
      admins,
      totalShops,
      activeShops,
      pendingShops,
      totalProducts,
      lowStockProducts,
      totalOrders,
      gmvAggregate,
      categories,
      recentOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
      this.prisma.shop.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stock_quantity: { lte: 5 } } }),
      this.prisma.parentOrder.count(),
      this.prisma.parentOrder.aggregate({ _sum: { total_payment: true } }),
      this.prisma.category.findMany({
        where: { parent_id: null },
        include: {
          _count: { select: { products: true } },
          children: { include: { _count: { select: { products: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.parentOrder.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true, email: true } },
          shop_orders: {
            take: 1,
            include: { shop: { select: { name: true } } },
          },
        },
      }),
    ]);

    const shopGrowth = await Promise.all(
      Array.from({ length: 7 }, async (_, index) => {
        const from = addDays(weekStart, index);
        const to = addDays(from, 1);
        return {
          label: DAY_LABELS[from.getDay()],
          value: await this.prisma.shop.count({ where: { created_at: { gte: from, lt: to } } }),
        };
      }),
    );

    const userGrowth = await Promise.all(
      Array.from({ length: 4 }, async (_, index) => {
        const from = addDays(monthStart, index * 7);
        const to = index === 3 ? addDays(now, 1) : addDays(from, 7);
        return {
          label: `Tuần ${index + 1}`,
          value: await this.prisma.user.count({ where: { created_at: { gte: from, lt: to } } }),
        };
      }),
    );

    const getCategoryProductCount = (category: (typeof categories)[number]) =>
      category._count.products +
      (category.children || []).reduce((sum, child) => sum + child._count.products, 0);
    const totalCategoryProducts = categories.reduce((sum, category) => sum + getCategoryProductCount(category), 0);
    const categoryDistribution = categories.slice(0, 5).map((category) => ({
      label: category.name,
      value: getCategoryProductCount(category),
      pct: totalCategoryProducts > 0 ? Math.round((getCategoryProductCount(category) / totalCategoryProducts) * 100) : 0,
    }));

    const alerts = [
      pendingShops > 0
        ? {
            severity: 'warning',
            title: 'Cửa hàng chờ duyệt',
            desc: `${pendingShops} cửa hàng đang chờ quản trị viên duyệt.`,
          }
        : null,
      lowStockProducts > 0
        ? {
            severity: 'info',
            title: 'Sản phẩm sắp hết hàng',
            desc: `${lowStockProducts} sản phẩm có tồn kho từ 5 trở xuống.`,
          }
        : null,
    ].filter(Boolean);

    return {
      totals: {
        users: totalUsers,
        customers,
        admins,
        shops: totalShops,
        activeShops,
        pendingShops,
        products: totalProducts,
        orders: totalOrders,
        gmv: toNumber(gmvAggregate._sum.total_payment),
      },
      shopGrowth,
      userGrowth,
      categoryDistribution,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customer: order.user?.full_name || order.user?.email || 'Khách hàng',
        shop: order.shop_orders[0]?.shop?.name || 'Nhiều cửa hàng',
        amount: toNumber(order.total_payment),
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
      })),
      alerts,
      system: { status: 'Healthy' },
    };
  }
}
