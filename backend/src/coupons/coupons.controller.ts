import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ApplyCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  /** Validate và preview giảm giá (Cần đăng nhập) */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@CurrentUser('id') userId: string, @Body() dto: ApplyCouponDto) {
    return this.couponsService.validate(dto, userId);
  }

  /** Admin/Vendor: Tạo mã giảm giá */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('id') userId: string, @CurrentUser('role') role: string, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto, userId, role);
  }

  /** Admin only: Xem tất cả mã */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.couponsService.findAll();
  }

  /** Vendor only: Xem mã giảm giá do shop tạo */
  @Get('vendor')
  @UseGuards(JwtAuthGuard)
  findVendorCoupons(@CurrentUser('id') userId: string) {
    return this.couponsService.findVendorCoupons(userId);
  }

  /** Admin/Vendor: Xóa mã */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.couponsService.delete(id, userId, role);
  }
}
