import api from '../lib/axios';
import type { Shop, PaginatedResponse, CreateShopData, ShopStatus } from '../types';

export const shopsService = {
  getAll: async (page?: number, limit?: number): Promise<PaginatedResponse<Shop>> => {
    const response = await api.get('/shops', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Shop> => {
    const response = await api.get(`/shops/${id}`);
    return response.data;
  },

  getMyShop: async (): Promise<Shop> => {
    const response = await api.get('/shops/my');
    return response.data;
  },

  create: async (data: CreateShopData): Promise<Shop> => {
    const response = await api.post('/shops', data);
    return response.data;
  },

  update: async (shopId: string, data: Partial<CreateShopData>): Promise<Shop> => {
    const response = await api.patch(`/shops/${shopId}`, data);
    return response.data;
  },

  // Admin only
  updateStatus: async (shopId: string, status: ShopStatus): Promise<Shop> => {
    const response = await api.patch(`/shops/${shopId}/status`, { status });
    return response.data;
  },
};
