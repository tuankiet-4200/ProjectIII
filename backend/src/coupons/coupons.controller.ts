import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ApplyCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  /** Public: Validate và preview giảm giá */
  @Post('validate')
  validate(@Body() dto: ApplyCouponDto) {
    return this.couponsService.validate(dto);
  }

  /** Admin only: Tạo mã giảm giá */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  /** Admin only: Xem tất cả mã */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.couponsService.findAll();
  }

  /** Admin only: Xóa mã */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }
}
