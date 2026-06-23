import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string, q?: string) {
    try {
      if (!userId || userId === 'guest') {
        return this.getTrendingProducts(q);
      }

      const interactedProducts = await this.prisma.userInteraction.findMany({
        where: { user_id: userId },
        select: { product_id: true },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      const interactedProductIds = interactedProducts.map(
        (item) => item.product_id,
      );
      if (interactedProductIds.length === 0) {
        return this.getTrendingProducts(q);
      }

      const similarUsers = await this.prisma.userInteraction.findMany({
        where: {
          product_id: { in: interactedProductIds },
          user_id: { not: userId },
        },
        distinct: ['user_id'],
        select: { user_id: true },
        take: 50,
      });

      const similarUserIds = similarUsers.map((item) => item.user_id);
      if (similarUserIds.length === 0) {
        return this.getTrendingProducts(q, interactedProductIds);
      }

      const candidateInteractions = await this.prisma.userInteraction.findMany({
        where: {
          user_id: { in: similarUserIds },
          product_id: { notIn: interactedProductIds },
        },
        select: { product_id: true },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      const candidateProductIds = [
        ...new Set(candidateInteractions.map((item) => item.product_id)),
      ];
      if (candidateProductIds.length === 0) {
        return this.getTrendingProducts(q, interactedProductIds);
      }

      const products = await this.prisma.product.findMany({
        where: {
          ...this.buildSearchWhere(q),
          id: { in: candidateProductIds },
        },
        orderBy: [{ sales_count: 'desc' }, { created_at: 'desc' }],
        take: 16,
        include: this.productInclude,
      });

      if (products.length >= 16) {
        return products;
      }

      const fallbackProducts = await this.getTrendingProducts(q, [
        ...interactedProductIds,
        ...products.map((product) => product.id),
      ]);

      return [...products, ...fallbackProducts].slice(0, 16);
    } catch (error) {
      this.logger.error(
        `Failed to build recommendations from user interactions: ${error.message}`,
      );
      return this.getTrendingProducts(q);
    }
  }

  private readonly productInclude = {
    shop: { select: { id: true, name: true, logo_url: true } },
    category: { select: { id: true, name: true, slug: true } },
  };

  private buildSearchWhere(q?: string): Prisma.ProductWhereInput {
    if (!q?.trim()) {
      return {};
    }

    return {
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
      ],
    };
  }

  private getTrendingProducts(q?: string, excludeIds: string[] = []) {
    const where: Prisma.ProductWhereInput = {
      ...this.buildSearchWhere(q),
    };

    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    return this.prisma.product.findMany({
      where,
      orderBy: [{ sales_count: 'desc' }, { created_at: 'desc' }],
      take: 16,
      include: this.productInclude,
    });
  }
}
