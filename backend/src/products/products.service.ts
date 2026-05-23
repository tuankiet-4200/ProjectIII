import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.shop_id) {
      where.shop_id = query.shop_id;
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { created_at: 'desc' };
    switch (query.sort_by) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'best_selling':
        orderBy = { sales_count: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { created_at: 'desc' };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          shop: { select: { id: true, name: true, logo_url: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        shop: { select: { id: true, name: true, logo_url: true, rating: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(shopId: string, ownerId: string, dto: CreateProductDto) {
    // Verify shop ownership
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your shop');
    }

    const product = await this.prisma.product.create({
      data: {
        shop_id: shopId,
        ...dto,
      },
    });
    this.syncVectorDB();
    return product;
  }

  async update(productId: string, ownerId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your product');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
    this.syncVectorDB();
    return updated;
  }

  async delete(productId: string, ownerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.shop.owner_id !== ownerId) {
      throw new ForbiddenException('Not your product');
    }

    const deleted = await this.prisma.product.delete({ where: { id: productId } });
    this.syncVectorDB();
    return deleted;
  }

  async recordInteraction(productId: string, userId: string, type: 'VIEW' | 'ADD_TO_CART' | 'PURCHASE') {
    return this.prisma.userInteraction.create({
      data: {
        product_id: productId,
        user_id: userId,
        interaction_type: type,
      },
    });
  }

  private syncVectorDB() {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    // Gọi sync background, không đợi
    fetch(`${aiServiceUrl}/sync`, { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log('[ProductSync] Vector DB synced:', data))
      .catch(err => console.error('[ProductSync] Error syncing vector DB:', err.message));
  }
}
