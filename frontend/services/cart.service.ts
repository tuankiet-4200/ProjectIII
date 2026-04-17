import api from '../lib/axios';
import type { Cart } from '../types';

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return response.data;
  },

  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await api.post('/cart/items', { product_id: productId, quantity });
    return response.data;
  },

  updateItem: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await api.patch(`/cart/items/${productId}`, { quantity });
    return response.data;
  },

  removeItem: async (productId: string): Promise<Cart> => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};
