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

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('Mã giảm giá đã tồn tại');

    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        value: new Prisma.Decimal(dto.value),
        min_order_amount: dto.min_order_amount ? new Prisma.Decimal(dto.min_order_amount) : null,
        max_discount: dto.max_discount ? new Prisma.Decimal(dto.max_discount) : null,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { created_at: 'desc' } });
  }

  /**
   * Validate and calculate discount — does NOT consume the coupon.
   * Call this on frontend to preview discount before placing order.
   */
  async validate(dto: ApplyCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon || !coupon.is_active) {
      throw new NotFoundException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
    }

    if (coupon.expires_at && coupon.expires_at < new Date()) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestException('Mã giảm giá đã được sử dụng hết');
    }

    if (coupon.min_order_amount && dto.order_amount < Number(coupon.min_order_amount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}₫ để sử dụng mã này`,
      );
    }

    const discount = this.calcDiscount(coupon, dto.order_amount);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount_amount: discount,
      final_amount: Math.max(0, dto.order_amount - discount),
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

  private calcDiscount(coupon: any, orderAmount: number): number {
    if (coupon.type === 'PERCENTAGE') {
      let discount = (orderAmount * Number(coupon.value)) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
      return Math.round(discount);
    }
    return Math.min(Number(coupon.value), orderAmount);
  }

  async delete(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
