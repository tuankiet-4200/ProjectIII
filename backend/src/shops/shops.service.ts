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
}
