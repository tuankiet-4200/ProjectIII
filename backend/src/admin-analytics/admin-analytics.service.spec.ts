import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnalyticsService } from './admin-analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn().mockResolvedValue(2) },
      shop: { count: jest.fn().mockResolvedValue(1) },
      product: { count: jest.fn().mockResolvedValue(3) },
      parentOrder: {
        count: jest.fn().mockResolvedValue(4),
        aggregate: jest.fn().mockResolvedValue({ _sum: { total_payment: 250000 } }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-1',
            total_payment: 250000,
            payment_status: 'UNPAID',
            payment_method: 'COD',
            created_at: new Date('2026-06-25T00:00:00.000Z'),
            user: { full_name: 'Test User', email: 'test@example.com' },
            shop_orders: [{ shop: { name: 'Demo Shop' } }],
          },
        ]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([
          { name: 'Camera', _count: { products: 2 } },
          { name: 'Laptop', _count: { products: 1 } },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AdminAnalyticsService);
  });

  it('returns real marketplace overview from prisma aggregates', async () => {
    const result = await service.getOverview();

    expect(result.totals.gmv).toBe(250000);
    expect(result.shopGrowth).toHaveLength(7);
    expect(result.userGrowth).toHaveLength(4);
    expect(result.categoryDistribution).toEqual([
      { label: 'Camera', value: 2, pct: 67 },
      { label: 'Laptop', value: 1, pct: 33 },
    ]);
    expect(result.recentOrders[0]).toMatchObject({
      id: 'order-1',
      customer: 'Test User',
      shop: 'Demo Shop',
      amount: 250000,
    });
  });
});
