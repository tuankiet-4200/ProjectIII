import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const token = state?.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear expired auth state
      localStorage.removeItem('auth-storage');
      document.cookie = 'access_token=; path=/; max-age=0';
      // Only redirect if on a protected route
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/vendor') || path.startsWith('/checkout')) {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
