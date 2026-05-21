import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, ApplyCouponDto } from './dto/coupon.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCouponDto, userId: string, role: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('Mã giảm giá đã tồn tại');

    let shopId = dto.shop_id;
    if (role !== 'ADMIN') {
      const shop = await this.prisma.shop.findFirst({ where: { owner_id: userId } });
      if (!shop) throw new BadRequestException('Bạn chưa có cửa hàng');
      shopId = shop.id;
    }

    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        shop_id: shopId,
        value: new Prisma.Decimal(dto.value),
        min_order_amount: dto.min_order_amount ? new Prisma.Decimal(dto.min_order_amount) : null,
        max_discount: dto.max_discount ? new Prisma.Decimal(dto.max_discount) : null,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { created_at: 'desc' }, include: { shop: { select: { name: true } } } });
  }

  async findVendorCoupons(userId: string) {
    const shop = await this.prisma.shop.findFirst({ where: { owner_id: userId } });
    if (!shop) throw new BadRequestException('Bạn chưa có cửa hàng');
    return this.prisma.coupon.findMany({ where: { shop_id: shop.id }, orderBy: { created_at: 'desc' } });
  }

  /**
   * Validate and calculate discount — does NOT consume the coupon.
   * Call this on frontend to preview discount before placing order.
   */
  async validate(dto: ApplyCouponDto, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: { shop: { select: { name: true } } }
    });

    if (!coupon || !coupon.is_active) {
      throw new NotFoundException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
    }

    if (coupon.expires_at && coupon.expires_at < new Date()) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng trên toàn hệ thống');
    }

    const usage = await this.prisma.couponUsage.findUnique({
      where: { coupon_id_user_id: { coupon_id: coupon.id, user_id: userId } }
    });
    if (usage) {
      throw new BadRequestException('Bạn đã sử dụng mã giảm giá này rồi. Mỗi người chỉ được dùng 1 lần.');
    }

    let applicableAmount = dto.order_amount;

    if (coupon.shop_id) {
      if (!dto.shop_amounts || dto.shop_amounts.length === 0) {
        throw new BadRequestException(`Mã giảm giá này chỉ áp dụng cho sản phẩm của Shop ${coupon.shop?.name || ''}`);
      }
      const shopData = dto.shop_amounts.find(s => s.shop_id === coupon.shop_id);
      if (!shopData) {
        throw new BadRequestException(`Giỏ hàng không có sản phẩm nào thuộc Shop ${coupon.shop?.name || ''}`);
      }
      applicableAmount = shopData.amount;
    }

    if (coupon.min_order_amount && applicableAmount < Number(coupon.min_order_amount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}₫ để sử dụng mã này`
      );
    }

    const discount = this.calcDiscount(coupon, applicableAmount);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount_amount: discount,
      final_amount: Math.max(0, dto.order_amount - discount), // Overall final amount
      description: coupon.type === 'PERCENTAGE'
        ? `Giảm ${coupon.value}%${coupon.max_discount ? ` (tối đa ${Number(coupon.max_discount).toLocaleString('vi-VN')}₫)` : ''}`
        : `Giảm ${Number(coupon.value).toLocaleString('vi-VN')}₫`,
    };
  }

  /** Consume coupon (increment used_count). Call inside order transaction. */
  async consume(code: string) {
    return this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { used_count: { increment: 1 } },
    });
  }

  private calcDiscount(coupon: any, amount: number): number {
    if (coupon.type === 'PERCENTAGE') {
      let discount = (amount * Number(coupon.value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
      return Math.round(discount);
    }
    return Math.min(Number(coupon.value), amount);
  }

  async delete(id: string, userId: string, role: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Mã không tồn tại');
    
    if (role !== 'ADMIN') {
      const shop = await this.prisma.shop.findFirst({ where: { owner_id: userId } });
      if (!shop || coupon.shop_id !== shop.id) throw new BadRequestException('Bạn không có quyền xoá mã này');
    }

    return this.prisma.coupon.delete({ where: { id } });
  }
}
