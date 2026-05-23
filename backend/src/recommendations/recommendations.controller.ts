import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Req() req) {
    const userId = req.user?.id;
    return this.recommendationsService.getRecommendations(userId);
  }

  @Get('public')
  async getPublicRecommendations() {
    // Cho user chưa đăng nhập
    return this.recommendationsService.getRecommendations('guest');
  }
}
