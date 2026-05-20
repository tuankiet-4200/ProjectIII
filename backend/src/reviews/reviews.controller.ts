import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  /** Public: Get all reviews for a product */
  @Get('product/:productId')
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  /** Authenticated: Check if current user can review a product */
  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  canReview(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.reviewsService.canUserReview(userId, productId);
  }

  /** Authenticated: Submit a review */
  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, dto);
  }
}
