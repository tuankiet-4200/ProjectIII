import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: {
    userInteraction: {
      findMany: jest.Mock;
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

  it('recommends products from similar users and excludes products the user already interacted with', async () => {
    prisma.userInteraction.findMany
      .mockResolvedValueOnce([
        { product_id: 'viewed-1' },
        { product_id: 'cart-1' },
      ])
      .mockResolvedValueOnce([
        { user_id: 'similar-user-1' },
        { user_id: 'similar-user-2' },
      ])
      .mockResolvedValueOnce([
        { product_id: 'recommended-1' },
        { product_id: 'recommended-2' },
      ]);

    const recommendedProducts = [
      { id: 'recommended-1', name: 'Recommended product' },
    ];
    prisma.product.findMany
      .mockResolvedValueOnce(recommendedProducts)
      .mockResolvedValueOnce([]);

    const result = await service.getRecommendations('user-1');

    expect(result).toEqual(recommendedProducts);
    expect(prisma.userInteraction.findMany).toHaveBeenNthCalledWith(1, {
      where: { user_id: 'user-1' },
      select: { product_id: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    expect(prisma.userInteraction.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        product_id: { in: ['viewed-1', 'cart-1'] },
        user_id: { not: 'user-1' },
      },
      distinct: ['user_id'],
      select: { user_id: true },
      take: 50,
    });
    expect(prisma.userInteraction.findMany).toHaveBeenNthCalledWith(3, {
      where: {
        user_id: { in: ['similar-user-1', 'similar-user-2'] },
        product_id: { notIn: ['viewed-1', 'cart-1'] },
      },
      select: { product_id: true },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    expect(prisma.product.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['recommended-1', 'recommended-2'] } },
      orderBy: [{ sales_count: 'desc' }, { created_at: 'desc' }],
      take: 16,
      include: {
        shop: { select: { id: true, name: true, logo_url: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  });
});
