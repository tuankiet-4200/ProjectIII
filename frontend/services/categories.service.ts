import api from '../lib/axios';
import type { Category, CreateCategoryData } from '../types';

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateCategoryData>): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
