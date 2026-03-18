import { io, Socket } from 'socket.io-client';

// Lấy URL base từ biến môi trường và loại bỏ phần /api
const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const socket: Socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});

export const connectSocket = (token: string) => {
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
