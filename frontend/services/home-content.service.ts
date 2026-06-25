import api from '../lib/axios';
import type { HomeBanner, UpdateHomeBannerData } from '../types';

export const homeContentService = {
  getBanner: async (): Promise<HomeBanner> => {
    const response = await api.get('/home/banner');
    return response.data;
  },

  getAdminBanner: async (): Promise<HomeBanner> => {
    const response = await api.get('/home/admin/banner');
    return response.data;
  },

  updateBanner: async (data: UpdateHomeBannerData): Promise<HomeBanner> => {
    const response = await api.patch('/home/admin/banner', data);
    return response.data;
  },
};
