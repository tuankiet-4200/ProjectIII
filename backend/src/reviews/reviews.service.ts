import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  /** Automatically recalculate all shop ratings when module starts */
  async onModuleInit() {
    try {
      const shops = await this.prisma.shop.findMany({ select: { id: true } });
      for (const shop of shops) {
        await this.updateShopRating(shop.id);
      }
      console.log(`[Shop Rating] Successfully initialized ratings for ${shops.length} shops.`);
    } catch (err: any) {
      console.error('[Shop Rating] Failed to initialize ratings:', err.message);
    }
  }

  /**
   * Check if a user has purchased a product (via any completed ShopOrder)
   * and has not already reviewed it.
   */
  async canUserReview(
    userId: string,
    productId: string,
  ): Promise<{ canReview: boolean; hasPurchased: boolean; hasReviewed: boolean }> {
    // Check if user has purchased this product
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        product_id: productId,
        shop_order: {
          status: 'DELIVERED',
          parent_order: { user_id: userId },
        },
      },
    });

    const hasPurchased = !!purchase;

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });

    const hasReviewed = !!existingReview;

    return {
      canReview: hasPurchased && !hasReviewed,
      hasPurchased,
      hasReviewed,
    };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.product_id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const { canReview, hasPurchased, hasReviewed } = await this.canUserReview(
      userId,
      dto.product_id,
    );

    if (!hasPurchased) {
      throw new ForbiddenException(
        'You can only review products you have purchased and received.',
      );
    }
    if (hasReviewed) {
      throw new ConflictException('You have already reviewed this product.');
    }

    const review = await this.prisma.review.create({
      data: {
        user_id: userId,
        product_id: dto.product_id,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });

    // Recalculate average rating of the shop
    await this.updateShopRating(product.shop_id);

    return review;
  }

  /**
   * Recalculates and updates the aggregated rating of a shop
   */
  async updateShopRating(shopId: string) {
    // Get all products of the shop
    const products = await this.prisma.product.findMany({
      where: { shop_id: shopId },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      await this.prisma.shop.update({
        where: { id: shopId },
        data: { rating: 0 },
      });
      return;
    }

    // Aggregate rating of all reviews for these products
    const aggregation = await this.prisma.review.aggregate({
      where: {
        product_id: { in: productIds },
      },
      _avg: {
        rating: true,
      },
    });

    const avgRating = aggregation._avg.rating || 0;

    // Update shop table rating
    await this.prisma.shop.update({
      where: { id: shopId },
      data: { rating: avgRating },
    });
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { product_id: productId },
      include: {
        user: { select: { id: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const total = reviews.length;
    const avgRating =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    return {
      reviews,
      total,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }
}

