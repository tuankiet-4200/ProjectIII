import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { InteractionsService } from './interactions.service';
import { ChatController } from './chat.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, InteractionsService],
  exports: [ChatService, InteractionsService],
})
export class ChatModule {}
