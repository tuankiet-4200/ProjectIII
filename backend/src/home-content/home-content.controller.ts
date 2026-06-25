import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { HomeContentService } from './home-content.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UpdateHomeBannerDto } from './dto';

@Controller('home')
export class HomeContentController {
  constructor(private homeContentService: HomeContentService) {}

  @Get('banner')
  getActiveBanner() {
    return this.homeContentService.getActiveBanner();
  }

  @Get('admin/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAdminBanner() {
    return this.homeContentService.getActiveBanner();
  }

  @Patch('admin/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateBanner(@Body() dto: UpdateHomeBannerDto) {
    return this.homeContentService.updateBanner(dto);
  }
}
