import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Toggle a product in user's wishlist (adds if not exists, removes if exists)
   */
  async toggleWishlist(userId: string, productId: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });

    if (existing) {
      // Remove
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { added: false, message: 'Đã xóa khỏi danh sách yêu thích' };
    } else {
      // Add
      await this.prisma.wishlist.create({
        data: {
          user_id: userId,
          product_id: productId,
        },
      });
      return { added: true, message: 'Đã thêm vào danh sách yêu thích' };
    }
  }

  /**
   * Get all products in user's wishlist
   */
  async getWishlist(userId: string) {
    return this.prisma.product.findMany({
      where: {
        wishlist: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Check if a product is wishlisted by the user
   */
  async checkWishlist(userId: string, productId: string) {
    const wish = await this.prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });
    return { wishlisted: !!wish };
  }
}
