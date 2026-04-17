import api from '../lib/axios';
import type { AuthResponse, RegisterData, LoginData } from '../types';

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout', { refresh_token: refreshToken });
    return response.data;
  },

  getGoogleAuthUrl: (selectAccount = false): string => {
    const url = new URL('/api/auth/google', getApiOrigin());
    if (selectAccount) {
      url.searchParams.set('prompt', 'select_account');
    }
    return url.toString();
  },
};
