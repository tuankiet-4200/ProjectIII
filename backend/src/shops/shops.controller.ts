import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { CreateShopDto, UpdateShopDto, UpdateShopStatusDto } from './dto';

@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.shopsService.findAll(page, limit, status);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyShop(@CurrentUser('id') userId: string) {
    return this.shopsService.findMyShop(userId);
  }

  @Get('my/analytics')
  @UseGuards(JwtAuthGuard)
  getMyShopAnalytics(@CurrentUser('id') userId: string) {
    return this.shopsService.getAnalytics(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.shopsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShopDto) {
    return this.shopsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') shopId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.update(shopId, userId, dto);
  }

  // Admin only
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateStatus(@Param('id') shopId: string, @Body() dto: UpdateShopStatusDto) {
    return this.shopsService.updateStatus(shopId, dto);
  }
}
