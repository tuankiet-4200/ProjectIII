import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';

@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('products')
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('products/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post('shops/:shopId/products')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('shopId') shopId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(shopId, userId, dto);
  }

  @Patch('products/:id/edit')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(productId, userId, dto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.delete(productId, userId);
  }

  @Post('products/:id/interact')
  @UseGuards(JwtAuthGuard)
  recordInteraction(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
    @Body('interaction_type') type: 'VIEW' | 'ADD_TO_CART' | 'PURCHASE',
  ) {
    return this.productsService.recordInteraction(productId, userId, type);
  }
}
