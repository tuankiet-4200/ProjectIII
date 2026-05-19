import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { CreateTrackingEventDto } from './dto';

@Controller('shop-orders')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Post(':id/tracking')
  createEvent(
    @Param('id') shopOrderId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTrackingEventDto,
  ) {
    return this.trackingService.createEvent(shopOrderId, user, dto);
  }

  @Get(':id/tracking')
  getEvents(@Param('id') shopOrderId: string) {
    return this.trackingService.getEventsByShopOrder(shopOrderId);
  }

  @Get('shipper/active')
  @UseGuards(RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  getActiveDeliveries(@CurrentUser('id') shipperId: string) {
    return this.trackingService.getActiveDeliveries(shipperId);
  }
}
