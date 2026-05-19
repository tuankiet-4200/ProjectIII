import { api } from '../api';

export const trackingService = {
  getActiveDeliveries: async () => {
    const { data } = await api.get('/shop-orders/shipper/active');
    return data;
  },

  createEvent: async (shopOrderId: string, payload: { event_type: string; location?: string }) => {
    const { data } = await api.post(`/shop-orders/${shopOrderId}/tracking`, payload);
    return data;
  },
};
