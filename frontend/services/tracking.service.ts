import api from '../lib/axios';
import type { TrackingEvent } from '../types';

export interface CreateTrackingEventData {
  event_type: string;
  location?: string;
  shipper_id?: string;
}

export const trackingService = {
  createEvent: async (shopOrderId: string, data: CreateTrackingEventData): Promise<TrackingEvent> => {
    const response = await api.post(`/shop-orders/${shopOrderId}/tracking`, data);
    return response.data;
  },

  getEvents: async (shopOrderId: string) => {
    const { data } = await api.get(`/shop-orders/${shopOrderId}/tracking`);
    return data;
  },

  getActiveDeliveries: async () => {
    const { data } = await api.get('/shop-orders/shipper/active');
    return data;
  },
};
