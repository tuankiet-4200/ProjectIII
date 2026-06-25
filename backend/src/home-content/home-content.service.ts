import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeBannerDto } from './dto';

const DEFAULT_HOME_BANNER: Prisma.HomeBannerCreateInput = {
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

@Injectable()
export class HomeContentService {
  constructor(private prisma: PrismaService) {}

  async getActiveBanner() {
    const banner = await this.prisma.homeBanner.findFirst({
      where: { is_active: true },
      orderBy: { updated_at: 'desc' },
    });

    if (banner) return banner;

    return this.prisma.homeBanner.create({
      data: DEFAULT_HOME_BANNER,
    });
  }

  async updateBanner(dto: UpdateHomeBannerDto) {
    const banner = await this.getActiveBanner();

    return this.prisma.homeBanner.update({
      where: { id: banner.id },
      data: dto,
    });
  }
}
