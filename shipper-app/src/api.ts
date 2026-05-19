import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// LƯU Ý QUAN TRỌNG KHI TEST BẰNG ĐIỆN THOẠI THẬT:
// 'localhost' sẽ trỏ về chính điện thoại chứ không phải máy tính chạy backend.
// Bạn cần thay thế '192.168.1.xxx' bằng địa chỉ IPv4 LAN thực tế của máy tính.
// (Gõ ipconfig trên Windows hoặc ifconfig trên Mac để lấy IP)
// ==========================================
export const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api';
export const BASE_SOCKET_URL = process.env.EXPO_PUBLIC_API_URL 
  ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '')
  : 'http://192.168.1.9:3000';

export const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('shipper_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
