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
import { Roles } from '../common/decorators';
import { CreateTrackingEventDto } from './dto';

@Controller('shop-orders')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Post(':id/tracking')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SHIPPER')
  createEvent(
    @Param('id') shopOrderId: string,
    @Body() dto: CreateTrackingEventDto,
  ) {
    return this.trackingService.createEvent(shopOrderId, dto);
  }

  @Get(':id/tracking')
  getEvents(@Param('id') shopOrderId: string) {
    return this.trackingService.getEventsByShopOrder(shopOrderId);
  }
}
