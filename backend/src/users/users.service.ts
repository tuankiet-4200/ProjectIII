import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from './dto';

export const USER_SELECT_FIELDS = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  role: true,
  is_banned: true,
  created_at: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT_FIELDS,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getAllUsers() {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          ...USER_SELECT_FIELDS,
          shops: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total };
  }

  async toggleBan(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { is_banned: !user.is_banned },
      select: USER_SELECT_FIELDS,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
      },
    });
  }

  // === Address Management ===

  async getAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // If this is set as default, unset other defaults
    if (dto.is_default) {
      await this.prisma.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
    }

    return this.prisma.userAddress.create({
      data: {
        user_id: userId,
        ...dto,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Verify ownership
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, user_id: userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // If setting as default, unset other defaults
    if (dto.is_default) {
      await this.prisma.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
    }

    return this.prisma.userAddress.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, user_id: userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    return this.prisma.userAddress.delete({
      where: { id: addressId },
    });
  }
}
