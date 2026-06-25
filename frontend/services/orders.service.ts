import api from '../lib/axios';
import type { ParentOrder, ShopOrder, PaginatedResponse, CheckoutData, CheckoutResponse, ShopOrderStatus } from '../types';

const normalizePaginated = <T>(payload: any): PaginatedResponse<T> => {
  if (payload?.data && payload?.meta) {
    return payload as PaginatedResponse<T>;
  }

  if (payload?.orders) {
    const total = payload.total || 0;
    const page = payload.page || 1;
    const limit = payload.limit || 10;
    return {
      data: payload.orders as T[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  return payload as PaginatedResponse<T>;
};

export const ordersService = {
  // ─── Customer ────────────────────────────────────────────────────────────────

  checkout: async (data: CheckoutData): Promise<CheckoutResponse> => {
    const response = await api.post('/orders/checkout', data);
    return response.data;
  },

  getMyOrders: async (page?: number, limit?: number): Promise<PaginatedResponse<ParentOrder>> => {
    const response = await api.get('/orders', { params: { page, limit } });
    return normalizePaginated<ParentOrder>(response.data);
  },

  getOrderDetail: async (orderId: string): Promise<ParentOrder> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  confirmSepayPayment: async (orderId: string): Promise<ParentOrder> => {
    const response = await api.patch(`/orders/${orderId}/sepay/confirm`);
    return response.data;
  },

  // ─── Shop Owner ──────────────────────────────────────────────────────────────

  getShopOrders: async (shopId: string, page?: number, limit?: number): Promise<PaginatedResponse<ShopOrder>> => {
    const response = await api.get(`/shops/${shopId}/orders`, { params: { page, limit } });
    return normalizePaginated<ShopOrder>(response.data);
  },

  updateShopOrderStatus: async (shopOrderId: string, status: ShopOrderStatus): Promise<ShopOrder> => {
    const response = await api.patch(`/shop-orders/${shopOrderId}/status`, { status });
    return response.data;
  },
};
