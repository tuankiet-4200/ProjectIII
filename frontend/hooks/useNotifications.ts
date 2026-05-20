"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY_FOR_PICKUP: "Chờ shipper lấy hàng",
  SHIPPING: "Đang vận chuyển",
  DELIVERED: "Đã giao thành công",
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
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Avoid duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
      console.log("[Notifications] Socket connected:", socket.id);
    });

    // Lắng nghe thay đổi trạng thái đơn hàng
    socket.on("orderStatusChanged", (data: { orderId: string; shopOrderId: string; status: string; shopName?: string }) => {
      const label = ORDER_STATUS_LABELS[data.status] || data.status;
      addNotification({
        type: "order",
        title: "Cập nhật đơn hàng",
        message: `${data.shopName ? `[${data.shopName}] ` : ""}Đơn hàng của bạn: ${label}`,
        orderId: data.orderId,
        shopOrderId: data.shopOrderId,
      });

      // Browser push notification (nếu được cấp quyền)
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Cập nhật đơn hàng 📦", {
          body: `${data.shopName ? `[${data.shopName}] ` : ""}Trạng thái: ${label}`,
          icon: "/favicon.ico",
        });
      }
    });

    // Lắng nghe sự kiện tracking
    socket.on("trackingEvent", (data: { shopOrderId: string; event_type: string; location?: string }) => {
      const label = TRACKING_EVENT_LABELS[data.event_type] || data.event_type;
      addNotification({
        type: "tracking",
        title: "Cập nhật vận chuyển",
        message: data.location ? `${label} — ${data.location}` : label,
        shopOrderId: data.shopOrderId,
      });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Cập nhật vận chuyển 🚚", {
          body: data.location ? `${label} — ${data.location}` : label,
          icon: "/favicon.ico",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("[Notifications] Socket disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, addNotification]);

  // Yêu cầu quyền browser notification lần đầu đăng nhập
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);
}
