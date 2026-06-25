import { Test, TestingModule } from '@nestjs/testing';
import { HomeContentService } from './home-content.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HomeContentService', () => {
  let service: HomeContentService;
  let prisma: {
    homeBanner: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const defaultBanner = {
    id: 1,
    eyebrow: 'SEASONAL DROP',
    title: 'Định nghĩa lại phong cách công nghệ.',
    subtitle: 'Tuyển chọn thiết bị điện tử hiệu năng cao và thời trang thủ công cho người dùng hiện đại.',
    primary_label: 'Khám phá bộ sưu tập',
    primary_href: '/products',
    secondary_label: 'Xem lookbook',
    secondary_href: '/products',
    visual_label: 'THỜI TRANG SỐ CAO CẤP',
    is_active: true,
  };

  beforeEach(async () => {
    prisma = {
      homeBanner: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeContentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HomeContentService>(HomeContentService);
  });

  it('creates and returns the default active banner when none exists', async () => {
    prisma.homeBanner.findFirst.mockResolvedValueOnce(null);
    prisma.homeBanner.create.mockResolvedValueOnce(defaultBanner);

    const result = await service.getActiveBanner();

    expect(result).toEqual(defaultBanner);
    expect(prisma.homeBanner.findFirst).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: { updated_at: 'desc' },
    });
    expect(prisma.homeBanner.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eyebrow: 'SEASONAL DROP',
        title: 'Định nghĩa lại phong cách công nghệ.',
        is_active: true,
      }),
    });
  });

  it('updates the editable homepage banner fields', async () => {
    prisma.homeBanner.findFirst.mockResolvedValueOnce(defaultBanner);
    prisma.homeBanner.update.mockResolvedValueOnce({
      ...defaultBanner,
      title: 'Banner mới',
      primary_href: '/products?sort_by=created_at',
    });

    const result = await service.updateBanner({
      title: 'Banner mới',
      primary_href: '/products?sort_by=created_at',
    });

    expect(result.title).toBe('Banner mới');
    expect(result.primary_href).toBe('/products?sort_by=created_at');
    expect(prisma.homeBanner.update).toHaveBeenCalledWith({
      where: { id: defaultBanner.id },
      data: {
        title: 'Banner mới',
        primary_href: '/products?sort_by=created_at',
      },
    });
  });
});
