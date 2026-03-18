import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';
import { SendMessageDto, LogInteractionDto } from './dto';

@Controller()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private interactionsService: InteractionsService,
  ) {}

  // ==================== Chat Endpoints ====================

  @Post('chat/sessions')
  @UseGuards(JwtAuthGuard)
  createSession(@CurrentUser('id') userId: string) {
    return this.chatService.createSession(userId);
  }

  @Post('chat/sessions/:id/messages')
  sendMessage(
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, dto);
  }

  @Get('chat/sessions/:id/messages')
  getMessages(@Param('id') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  @Patch('chat/sessions/:id/close')
  @UseGuards(JwtAuthGuard)
  closeSession(@Param('id') sessionId: string) {
    return this.chatService.closeSession(sessionId);
  }

  @Get('chat/sessions')
  @UseGuards(JwtAuthGuard)
  getUserSessions(@CurrentUser('id') userId: string) {
    return this.chatService.getUserSessions(userId);
  }

  // ==================== Interaction Logging ====================

  @Post('interactions')
  @UseGuards(JwtAuthGuard)
  logInteraction(
    @CurrentUser('id') userId: string,
    @Body() dto: LogInteractionDto,
  ) {
    return this.interactionsService.logInteraction(userId, dto);
  }

  @Get('interactions')
  @UseGuards(JwtAuthGuard)
  getUserInteractions(@CurrentUser('id') userId: string) {
    return this.interactionsService.getUserInteractions(userId);
  }
}
