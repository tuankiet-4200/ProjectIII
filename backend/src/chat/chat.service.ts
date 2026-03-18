import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createSession(userId?: string) {
    return this.prisma.chatSession.create({
      data: {
        user_id: userId || null,
      },
    });
  }

  async sendMessage(sessionId: string, dto: SendMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    // Save user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        sender_type: 'USER',
        message_text: dto.message_text,
      },
    });

    // TODO: Integrate with AI service (Python FastAPI)
    // For now, return a placeholder bot response
    const botMessage = await this.prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        sender_type: 'BOT',
        message_text:
          'Cảm ơn bạn đã nhắn tin. Tính năng AI Chatbot đang được phát triển. Vui lòng liên hệ hotline để được hỗ trợ.',
        intent_detected: 'placeholder',
      },
    });

    return { user_message: userMessage, bot_response: botMessage };
  }

  async getMessages(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    return this.prisma.chatMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });
  }

  async closeSession(sessionId: string) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }
}
