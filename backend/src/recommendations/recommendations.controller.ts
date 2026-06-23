import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Req() req, @Query('q') q?: string) {
    const userId = req.user?.id;
    return this.recommendationsService.getRecommendations(userId, q);
  }

  @Get('public')
  async getPublicRecommendations(@Query('q') q?: string) {
    return this.recommendationsService.getRecommendations('guest', q);
  }
}
