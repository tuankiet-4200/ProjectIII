import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: {
    userInteraction: {
      findMany: jest.Mock;
      create?: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      userInteraction: {
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('returns trending products for guests without calling the AI service', async () => {
    const trendingProducts = [
      { id: 'p1', name: 'Popular product', sales_count: 10 },
    ];
    prisma.product.findMany.mockResolvedValueOnce(trendingProducts);

    const result = await service.getRecommendations('guest');

    expect(result).toBe(trendingProducts);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ sales_count: 'desc' }, { created_at: 'desc' }],
      take: 16,
      include: {
        shop: { select: { id: true, name: true, logo_url: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  });

  it('scores content-based recommendations from weighted user interactions', async () => {
    prisma.userInteraction.findMany.mockResolvedValueOnce([
      {
        product_id: 'viewed-phone',
        interaction_type: 'VIEW',
        created_at: new Date('2026-06-25T10:00:00Z'),
        product: { category_id: 1, shop_id: 'shop-a' },
      },
      {
        product_id: 'cart-audio',
        interaction_type: 'ADD_TO_CART',
        created_at: new Date('2026-06-25T11:00:00Z'),
        product: { category_id: 2, shop_id: 'shop-b' },
      },
    ]);

    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: 'same-view-category',
        category_id: 1,
        shop_id: 'shop-x',
        sales_count: 100,
        created_at: new Date('2026-06-20T00:00:00Z'),
      },
      {
        id: 'same-cart-category',
        category_id: 2,
        shop_id: 'shop-y',
        sales_count: 1,
        created_at: new Date('2026-06-20T00:00:00Z'),
      },
    ]);
    prisma.product.findMany.mockResolvedValueOnce([]);

    const result = await service.getRecommendations('user-1');

    expect(prisma.userInteraction.findMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
      select: {
        product_id: true,
        interaction_type: true,
        created_at: true,
        product: {
          select: {
            category_id: true,
            shop_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    expect(prisma.product.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: { notIn: ['viewed-phone', 'cart-audio'] },
        OR: [
          { category_id: { in: [1, 2] } },
          { shop_id: { in: ['shop-a', 'shop-b'] } },
        ],
      },
      take: 48,
      include: {
        shop: { select: { id: true, name: true, logo_url: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    expect(result.map((product) => product.id)).toEqual([
      'same-cart-category',
      'same-view-category',
    ]);
  });
});
