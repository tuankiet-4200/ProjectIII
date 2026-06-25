import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('CartService', () => {
  let service: CartService;
  let redis: {
    hget: jest.Mock;
    hset: jest.Mock;
  };
  let prisma: {
    product: {
      findUnique: jest.Mock;
    };
    userInteraction: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    redis = {
      hget: jest.fn(),
      hset: jest.fn(),
    };
    prisma = {
      product: {
        findUnique: jest.fn(),
      },
      userInteraction: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: RedisService, useValue: redis },
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records an ADD_TO_CART interaction after adding an item', async () => {
    prisma.product.findUnique.mockResolvedValueOnce({
      id: 'product-1',
      stock_quantity: 10,
    });
    redis.hget.mockResolvedValueOnce(null);

    await service.addItem('user-1', { product_id: 'product-1', quantity: 2 });

    expect(redis.hset).toHaveBeenCalledWith('cart:user-1', 'product-1', '2');
    expect(prisma.userInteraction.create).toHaveBeenCalledWith({
      data: {
        product_id: 'product-1',
        user_id: 'user-1',
        interaction_type: 'ADD_TO_CART',
      },
    });
  });
});
