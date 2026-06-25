import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ShopsModule } from './shops/shops.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TrackingModule } from './tracking/tracking.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { HomeContentModule } from './home-content/home-content.module';
import { AdminAnalyticsModule } from './admin-analytics/admin-analytics.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    ShopsModule, 
    CategoriesModule, 
    ProductsModule, 
    CartModule, 
    OrdersModule, 
    NotificationsModule, 
    TrackingModule, 
    ChatModule, 
    RedisModule,
    UploadsModule,
    ReviewsModule,
    CouponsModule,
    WishlistModule,
    RecommendationsModule,
    HomeContentModule,
    AdminAnalyticsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
