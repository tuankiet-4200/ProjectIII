import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

  it('creates categories with description and icon metadata', async () => {
    const dto = {
      name: 'Camera',
      slug: 'camera',
      description: 'Thiết bị chụp ảnh',
      icon: 'Camera',
    };

    prisma.category.create.mockResolvedValueOnce({ id: 1, ...dto });

    await service.create(dto);

    expect(prisma.category.create).toHaveBeenCalledWith({ data: dto });
  });

  it('updates category metadata', async () => {
    prisma.category.findUnique.mockResolvedValueOnce({ id: 1 });
    prisma.category.update.mockResolvedValueOnce({ id: 1, icon: 'Monitor' });

    await service.update(1, { description: 'Mô tả mới', icon: 'Monitor' });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { description: 'Mô tả mới', icon: 'Monitor' },
    });
  });
});
