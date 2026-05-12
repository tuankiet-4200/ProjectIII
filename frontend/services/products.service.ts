import api from '../lib/axios';
import type { Product, PaginatedResponse, CreateProductData, UpdateProductData, ProductQuery } from '../types';

export const productsService = {
  getAll: async (query?: ProductQuery): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params: query });
    const { products, total, page, limit } = response.data;
    if (products) {
      return {
        data: products,
        meta: {
          total: total || 0,
          page: page || 1,
          limit: limit || 20,
          totalPages: Math.ceil((total || 0) / (limit || 20))
        }
      };
    }
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  },

  create: async (shopId: string, data: CreateProductData): Promise<Product> => {
    const response = await api.post(`/shops/${shopId}/products`, data);
    return response.data;
  },

  update: async (productId: string, data: UpdateProductData): Promise<Product> => {
    const response = await api.patch(`/products/${productId}/edit`, data);
    return response.data;
  },

  delete: async (productId: string): Promise<void> => {
    await api.delete(`/products/${productId}`);
  },
};
