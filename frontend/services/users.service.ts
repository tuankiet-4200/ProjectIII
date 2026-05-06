import api from '../lib/axios';
import type { User, UserAddress, CreateAddressData } from '../types';

export const usersService = {
  getAll: async (): Promise<{ users: any[]; total: number }> => {
    const response = await api.get('/users');
    return response.data;
  },

  toggleBan: async (userId: string): Promise<any> => {
    const response = await api.patch(`/users/${userId}/ban`);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'full_name' | 'phone'>>): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  getAddresses: async (): Promise<UserAddress[]> => {
    const response = await api.get('/users/me/addresses');
    return response.data;
  },

  createAddress: async (data: CreateAddressData): Promise<UserAddress> => {
    const response = await api.post('/users/me/addresses', data);
    return response.data;
  },

  updateAddress: async (addressId: string, data: Partial<CreateAddressData>): Promise<UserAddress> => {
    const response = await api.patch(`/users/me/addresses/${addressId}`, data);
    return response.data;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    await api.delete(`/users/me/addresses/${addressId}`);
  },
};
