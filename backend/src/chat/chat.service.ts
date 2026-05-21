import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SenderType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway
  ) {}

  async createSession(userId?: string, shopId?: string) {
    if (userId && shopId) {
      // Check if session already exists for this shop & user
      const existing = await this.prisma.chatSession.findFirst({
        where: { user_id: userId, shop_id: shopId },
      });
      if (existing) return existing;
    }

    return this.prisma.chatSession.create({
      data: {
        user_id: userId || null,
        shop_id: shopId || null,
      },
    });
  }

  async sendMessage(sessionId: string, dto: SendMessageDto, senderType: SenderType = 'USER') {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { shop: true },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    // Save message
    const savedMessage = await this.prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        sender_type: senderType,
        message_text: dto.message_text,
      },
    });

    // If it's a Shop session, handle real-time routing
    if (session.shop_id) {
      if (senderType === 'USER' && session.shop?.owner_id) {
        this.notificationsGateway.emitChatMessage(session.shop.owner_id, { session_id: sessionId, message: savedMessage });
      } else if (senderType === 'SHOP' && session.user_id) {
        this.notificationsGateway.emitChatMessage(session.user_id, { session_id: sessionId, message: savedMessage });
      }
      return { message: savedMessage };
    } 
    
    // Fallback: AI Chatbot Logic
    const botMessage = await this.prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        sender_type: 'BOT',
        message_text:
          'Cảm ơn bạn đã nhắn tin. Tính năng AI Chatbot đang được phát triển. Vui lòng liên hệ hotline để được hỗ trợ.',
        intent_detected: 'placeholder',
      },
    });

    return { user_message: savedMessage, bot_response: botMessage };
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
        shop: { select: { id: true, name: true, logo_url: true } },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async getVendorSessions(ownerId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { owner_id: ownerId },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    return this.prisma.chatSession.findMany({
      where: { shop_id: shop.id },
      orderBy: { updated_at: 'desc' },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }
}
