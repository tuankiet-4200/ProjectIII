import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    chatSession: {
      findUnique: jest.Mock;
    };
    chatMessage: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      chatSession: {
        findUnique: jest.fn(),
      },
      chatMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: NotificationsGateway,
          useValue: { emitChatMessage: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends matching shop products as SQL context to the AI service', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ reply: 'Shop có iPhone.' }),
    });
    jest.spyOn(global, 'fetch').mockImplementation(fetchSpy as any);

    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      shop_id: 'shop-1',
      shop: {
        id: 'shop-1',
        name: 'Apple Store',
        owner_id: 'owner-1',
        ai_auto_respond: true,
      },
    });
    prisma.chatMessage.create
      .mockResolvedValueOnce({
        id: 'message-1',
        session_id: 'session-1',
        sender_type: 'USER',
        message_text: 'Shop có iPhone không?',
      })
      .mockResolvedValueOnce({
        id: 'message-2',
        session_id: 'session-1',
        sender_type: 'BOT',
        message_text: 'Shop có iPhone.',
      });
    prisma.chatMessage.findMany.mockResolvedValueOnce([
      {
        sender_type: 'USER',
        message_text: 'Shop có iPhone không?',
        created_at: new Date(),
      },
    ]);
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: 'product-1',
        name: 'iPhone 17 Pro Max',
        price: 36890000,
        stock_quantity: 15,
        description: 'Điện thoại Apple',
        slug: 'iphone-17-pro-max',
      },
    ]);

    await service.sendMessage('session-1', {
      message_text: 'Shop có iPhone không?',
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        shop_id: 'shop-1',
        OR: expect.arrayContaining([
          { name: { contains: 'iphone', mode: 'insensitive' } },
          { description: { contains: 'iphone', mode: 'insensitive' } },
          { meta_title: { contains: 'iphone', mode: 'insensitive' } },
          { meta_description: { contains: 'iphone', mode: 'insensitive' } },
        ]),
      },
      orderBy: [{ sales_count: 'desc' }, { created_at: 'desc' }],
      take: 8,
      select: {
        id: true,
        name: true,
        price: true,
        stock_quantity: true,
        description: true,
        slug: true,
      },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://ai-service:8000/chat/predict',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    );
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.products_context).toEqual([
      {
        id: 'product-1',
        name: 'iPhone 17 Pro Max',
        price: 36890000,
        stock_quantity: 15,
        description: 'Điện thoại Apple',
        slug: 'iphone-17-pro-max',
      },
    ]);

    (global.fetch as jest.Mock).mockRestore();
  });
});
