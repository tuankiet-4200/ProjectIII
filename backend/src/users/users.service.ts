import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
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
