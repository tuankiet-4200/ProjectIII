"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Package, Truck, Info, CheckCheck, Trash2 } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { AppNotification } from "@/store/useNotificationStore";

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function NotificationItem({ n }: { n: AppNotification }) {
  const router = useRouter();
  const markRead = useNotificationStore((s) => s.markRead);

  const Icon = n.type === "order" ? Package : n.type === "tracking" ? Truck : Info;
  const iconCls = n.type === "order"
    ? "text-violet-400 bg-violet-500/10"
    : n.type === "tracking"
    ? "text-blue-400 bg-blue-500/10"
    : "text-slate-400 bg-slate-500/10";

  const handleClick = () => {
    markRead(n.id);
    if (n.shopOrderId && n.orderId) {
      router.push(`/orders/${n.orderId}/tracking/${n.shopOrderId}`);
    } else if (n.orderId) {
      router.push(`/orders/${n.orderId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-foreground/5 ${!n.read ? "bg-violet-500/5" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-slate-500 dark:text-gray-400"}`}>
          {n.title}
        </div>
        <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {n.message}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</div>
      </div>
      {!n.read && (
        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        className="relative text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in fade-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-card-border bg-card shadow-2xl shadow-black/20 z-50 overflow-hidden" style={{ animation: "slideDown 0.15s ease-out" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
            <h3 className="text-sm font-bold text-foreground">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  <CheckCheck size={11} /> Đánh dấu đã đọc
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-card-border/50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-gray-500">
                <Bell size={28} className="mb-2 opacity-40" />
                <p className="text-xs">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} n={n} />)
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
