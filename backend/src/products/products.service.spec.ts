import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    category: {
      findUnique: jest.Mock;
    };
    shop: {
      findUnique: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
      },
      shop: {
        findUnique: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

  it('persists product features and specifications when creating a product', async () => {
    prisma.shop.findUnique.mockResolvedValueOnce({ id: 'shop-1', owner_id: 'owner-1' });
    prisma.product.create.mockResolvedValueOnce({ id: 'product-1' });

    await service.create('shop-1', 'owner-1', {
      category_id: 1,
      name: 'Đồng hồ chống nước',
      slug: 'dong-ho-chong-nuoc',
      description: 'Mô tả thật',
      price: 1200000,
      stock_quantity: 5,
      features: ['Chống nước 5ATM', 'Mặt kính sapphire'],
      specifications: [
        { label: 'Chất liệu', value: 'Thép không gỉ' },
        { label: 'Kích thước', value: '42mm' },
      ],
    });

    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        features: ['Chống nước 5ATM', 'Mặt kính sapphire'],
        specifications: [
          { label: 'Chất liệu', value: 'Thép không gỉ' },
          { label: 'Kích thước', value: '42mm' },
        ],
      }),
    });
  });

  it('updates product features and specifications for owned products', async () => {
    prisma.product.findUnique.mockResolvedValueOnce({
      id: 'product-1',
      shop: { owner_id: 'owner-1' },
    });
    prisma.product.update.mockResolvedValueOnce({ id: 'product-1' });

    await service.update('product-1', 'owner-1', {
      features: ['Pin 7 ngày'],
      specifications: [{ label: 'Pin', value: '7 ngày' }],
    });

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: expect.objectContaining({
        features: ['Pin 7 ngày'],
        specifications: [{ label: 'Pin', value: '7 ngày' }],
      }),
    });
  });
});
