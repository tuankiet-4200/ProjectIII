import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes product counts for parent and child categories', async () => {
    prisma.category.findMany.mockResolvedValueOnce([]);

    await service.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { parent_id: null },
      include: {
        _count: { select: { products: true } },
        children: {
          include: {
            _count: { select: { products: true } },
            children: {
              include: {
                _count: { select: { products: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  });
});
