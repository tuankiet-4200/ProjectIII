import api from '../lib/axios';
import type { ParentOrder, ShopOrder, PaginatedResponse, CheckoutData, ShopOrderStatus } from '../types';

export const ordersService = {
  // ─── Customer ────────────────────────────────────────────────────────────────

  checkout: async (data: CheckoutData): Promise<ParentOrder> => {
    const response = await api.post('/orders/checkout', data);
    return response.data;
  },

  getMyOrders: async (page?: number, limit?: number): Promise<PaginatedResponse<ParentOrder>> => {
    const response = await api.get('/orders', { params: { page, limit } });
    return response.data;
  },

  getOrderDetail: async (orderId: string): Promise<ParentOrder> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // ─── Shop Owner ──────────────────────────────────────────────────────────────

  getShopOrders: async (shopId: string, page?: number, limit?: number): Promise<PaginatedResponse<ShopOrder>> => {
    const response = await api.get(`/shops/${shopId}/orders`, { params: { page, limit } });
    return response.data;
  },

  updateShopOrderStatus: async (shopOrderId: string, status: ShopOrderStatus): Promise<ShopOrder> => {
    const response = await api.patch(`/shop-orders/${shopOrderId}/status`, { status });
    return response.data;
  },
};
