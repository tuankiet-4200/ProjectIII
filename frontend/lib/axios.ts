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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) {
          // If no storage, we can't refresh. Just log out and redirect if needed.
          throw error; 
        }

        const { state } = JSON.parse(authStorage);
        const refreshToken = state?.refreshToken;

        if (!refreshToken) throw error;

        // Call refresh endpoint directly using axios to avoid interceptor loop if refresh also fails with 401
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token } = response.data;

        // Update Zustand store and localStorage
        const newState = {
          ...state,
          accessToken: access_token,
        };
        localStorage.setItem('auth-storage', JSON.stringify({ state: newState, version: 0 }));
        
        // Also update cookie for middleware if any
        document.cookie = `access_token=${access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear expired auth state if refresh fails
        localStorage.removeItem('auth-storage');
        document.cookie = 'access_token=; path=/; max-age=0';
        
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/vendor') || path.startsWith('/checkout') || path.startsWith('/cart')) {
          window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
