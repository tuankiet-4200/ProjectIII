import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    category: {
      findUnique: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses text search directly without calling the AI service', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('AI service should not be called'));
    prisma.product.findMany.mockResolvedValueOnce([]);
    prisma.product.count.mockResolvedValueOnce(0);

    await service.findAll({ search: 'iphone' });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'iphone', mode: 'insensitive' } },
            { description: { contains: 'iphone', mode: 'insensitive' } },
          ],
        },
      }),
    );

    fetchSpy.mockRestore();
  });

  it('expands parent category filters to include direct child categories', async () => {
    prisma.category.findUnique.mockResolvedValueOnce({
      id: 1,
      children: [{ id: 2 }, { id: 3 }],
    });
    prisma.product.findMany.mockResolvedValueOnce([]);
    prisma.product.count.mockResolvedValueOnce(0);

    await service.findAll({ category_id: 1 });

    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, children: { select: { id: true } } },
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category_id: { in: [1, 2, 3] } },
      }),
    );
    expect(prisma.product.count).toHaveBeenCalledWith({
      where: { category_id: { in: [1, 2, 3] } },
    });
  });
});
