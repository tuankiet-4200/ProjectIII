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

      const interactions = await this.prisma.userInteraction.findMany({
        where: { user_id: userId },
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

      const interactedProductIds = interactions.map((item) => item.product_id);
      if (interactedProductIds.length === 0) {
        return this.getTrendingProducts(q);
      }

      const categoryScores = new Map<number, number>();
      const shopScores = new Map<string, number>();

      interactions.forEach((interaction, index) => {
        const baseWeight = this.getInteractionWeight(
          interaction.interaction_type,
        );
        const recencyWeight = Math.max(0.35, 1 - index * 0.03);
        const score = baseWeight * recencyWeight;

        categoryScores.set(
          interaction.product.category_id,
          (categoryScores.get(interaction.product.category_id) || 0) + score,
        );
        shopScores.set(
          interaction.product.shop_id,
          (shopScores.get(interaction.product.shop_id) || 0) + score,
        );
      });

      const categoryIds = [...categoryScores.keys()];
      const shopIds = [...shopScores.keys()];

      const candidateProducts = await this.prisma.product.findMany({
        where: {
          ...this.buildSearchWhere(q),
          id: { notIn: interactedProductIds },
          OR: [
            { category_id: { in: categoryIds } },
            { shop_id: { in: shopIds } },
          ],
        },
        take: 48,
        include: this.productInclude,
      });

      const products = candidateProducts
        .map((product) => ({
          product,
          score:
            (categoryScores.get(product.category_id) || 0) * 3 +
            (shopScores.get(product.shop_id) || 0) +
            Number(product.sales_count || 0) * 0.01,
        }))
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product)
        .slice(0, 16);

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

  private getInteractionWeight(type: string) {
    switch (type) {
      case 'PURCHASE':
        return 8;
      case 'ADD_TO_CART':
        return 5;
      case 'VIEW':
      default:
        return 1;
    }
  }

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
