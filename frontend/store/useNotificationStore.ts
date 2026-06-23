import { create } from 'zustand';
import type { TrackingEvent } from '@/types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'tracking' | 'info';
  read: boolean;
  createdAt: Date;
  orderId?: string;
  shopOrderId?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  // Realtime order status updates: shopOrderId → new status
  orderStatusUpdates: Record<string, string>;
  pushOrderStatusUpdate: (shopOrderId: string, status: string) => void;
  // Realtime tracking events: shopOrderId → TrackingEvent[] (newest first)
  trackingUpdates: Record<string, TrackingEvent[]>;
  pushTrackingEvent: (shopOrderId: string, event: TrackingEvent) => void;
  // Realtime chat messages
  chatMessages: Record<string, any[]>;
  pushChatMessage: (sessionId: string, message: any) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  orderStatusUpdates: {},
  trackingUpdates: {},

  addNotification: (n) => {
    const newNote: AppNotification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    set((state) => ({
      notifications: [newNote, ...state.notifications].slice(0, 50), // giữ tối đa 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  pushOrderStatusUpdate: (shopOrderId, status) => {
    set((state) => ({
      orderStatusUpdates: { ...state.orderStatusUpdates, [shopOrderId]: status },
    }));
  },

  pushTrackingEvent: (shopOrderId, event) => {
    set((state) => {
      const existing = state.trackingUpdates[shopOrderId] || [];
      if (existing.some((e) => e.id === event.id)) return {};
      return {
        trackingUpdates: {
          ...state.trackingUpdates,
          [shopOrderId]: [event, ...existing],
        },
      };
    });
  },

  // Realtime chat
  chatMessages: {},
  pushChatMessage: (sessionId, message) => {
    set((state) => {
      const existing = state.chatMessages[sessionId] || [];
      if (existing.some((m) => m.id === message.id)) return state;
      const newMessages = [...existing, message].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return {
        chatMessages: {
          ...state.chatMessages,
          [sessionId]: newMessages,
        },
      };
    });
  },
}));
