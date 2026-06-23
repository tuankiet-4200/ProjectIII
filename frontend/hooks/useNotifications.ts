"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { toast } from "sonner";
import type { TrackingEvent } from "@/types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY_FOR_PICKUP: "Chờ shipper lấy hàng",
  SHIPPING: "Đang vận chuyển",
  DELIVERED: "Đã giao thành công 🎉",
  CANCELLED: "Đã huỷ",
};

const TRACKING_EVENT_LABELS: Record<string, string> = {
  order_packed: "Đơn hàng đã được đóng gói",
  picked_up: "Shipper đã lấy hàng",
  arrived_at_hub: "Hàng đến kho trung chuyển",
  delivering: "Đang giao hàng đến bạn",
  delivered: "Giao hàng thành công! 🎉",
};

export function useNotifications() {
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const pushOrderStatusUpdate = useNotificationStore((s) => s.pushOrderStatusUpdate);
  const pushTrackingEvent = useNotificationStore((s) => s.pushTrackingEvent);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Disconnect old socket if token changed
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("[Notifications] Connecting to socket:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      // Use a callback so each reconnect attempt fetches the latest token from the store
      auth: (cb) => {
        const freshToken = useAuthStore.getState().accessToken;
        cb({ token: freshToken });
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.log("[Notifications] ✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Notifications] ❌ Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Notifications] Socket disconnected, reason:", reason);
    });

    // Lắng nghe thay đổi trạng thái đơn hàng
    socket.on("orderStatusChanged", (data: {
      orderId: string;
      shopOrderId: string;
      status: string;
      shopName?: string;
    }) => {
      console.log("[Notifications] 📦 orderStatusChanged received:", data);

      const label = ORDER_STATUS_LABELS[data.status] || data.status;
      const shopLabel = data.shopName ? `[${data.shopName}] ` : "";

      // Show toast immediately
      toast.success(`${shopLabel}Đơn hàng: ${label}`, {
        duration: 6000,
        description: "Nhấn để xem chi tiết đơn hàng",
        action: data.orderId ? {
          label: "Xem",
          onClick: () => {
            window.location.href = `/orders/${data.orderId}`;
          },
        } : undefined,
      });

      // Save to notification bell
      addNotification({
        type: "order",
        title: "Cập nhật đơn hàng",
        message: `${shopLabel}Đơn hàng của bạn: ${label}`,
        orderId: data.orderId,
        shopOrderId: data.shopOrderId,
      });

      // Push to global status store so order pages update instantly
      if (data.shopOrderId) {
        pushOrderStatusUpdate(data.shopOrderId, data.status);
      }

      // Browser push notification
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Cập nhật đơn hàng 📦", {
          body: `${shopLabel}Trạng thái: ${label}`,
          icon: "/favicon.ico",
        });
      }
    });

    // Lắng nghe sự kiện tracking
    socket.on("trackingEvent", (data: {
      shopOrderId: string;
      event_type: string;
      location?: string;
      id?: string;
      created_at?: string;
    }) => {
      console.log("[Notifications] 🚚 trackingEvent received:", data);

      const label = TRACKING_EVENT_LABELS[data.event_type] || data.event_type;
      const message = data.location ? `${label} — ${data.location}` : label;

      toast.info(message, { duration: 5000 });

      addNotification({
        type: "tracking",
        title: "Cập nhật vận chuyển",
        message,
        shopOrderId: data.shopOrderId,
      });

      // Push vào store để các trang tracking cập nhật realtime
      const trackingEvent: TrackingEvent = {
        id: data.id || crypto.randomUUID(),
        shop_order_id: data.shopOrderId,
        event_type: data.event_type,
        location: data.location,
        created_at: data.created_at || new Date().toISOString(),
      };
      pushTrackingEvent(data.shopOrderId, trackingEvent);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Cập nhật vận chuyển 🚚", {
          body: message,
          icon: "/favicon.ico",
        });
      }
    });

    // Lắng nghe sự kiện tin nhắn mới
    socket.on("newChatMessage", (data: { session_id: string; message: any }) => {
      console.log("[Notifications] 💬 newChatMessage received:", data);
      
      const pushChatMessage = useNotificationStore.getState().pushChatMessage;
      pushChatMessage(data.session_id, data.message);
      
      // Optionally notify user if not on chat page
      if (data.message.sender_type !== "USER") {
        toast("Tin nhắn mới", {
          description: data.message.message_text,
          duration: 4000,
        });
      }
    });

    socketRef.current = socket;

    return () => {
      console.log("[Notifications] Cleaning up socket");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addNotification, isAuthenticated, pushOrderStatusUpdate, pushTrackingEvent, token]);

  // Yêu cầu quyền browser notification lần đầu đăng nhập
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);
}
