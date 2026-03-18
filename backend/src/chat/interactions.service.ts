import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogInteractionDto } from './dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  async logInteraction(userId: string, dto: LogInteractionDto) {
    return this.prisma.userInteraction.create({
      data: {
        user_id: userId,
        product_id: dto.product_id,
        interaction_type: dto.interaction_type,
      },
    });
  }

  async getUserInteractions(userId: string, limit = 50) {
    return this.prisma.userInteraction.findMany({
      where: { user_id: userId },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true },
        },
      },
    });
  }
}
