import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { NotificationsModule } from '../notifications/notifications.module';

import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [NotificationsModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService],
})
export class TrackingModule {}
