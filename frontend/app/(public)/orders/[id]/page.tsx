"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Package,
  CreditCard,
  Clock,
  Loader2,
  Truck,
  CheckCircle2,
  XCircle,
  Navigation,
} from "lucide-react";
import { ordersService } from "@/services/orders.service";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import { toast } from "sonner";
import type { ParentOrder, TrackingEvent } from "@/types";
import { useNotificationStore } from "@/store/useNotificationStore";

const TRACKING_EVENT_LABELS: Record<string, string> = {
  order_packed: "Order Packed",
  picked_up: "Picked Up by Courier",
  arrived_at_hub: "Arrived at Sorting Hub",
  delivering: "Out for Delivery",
  delivered: "Delivered",
};

const ORDER_STATUS_LABELS_VI: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY_FOR_PICKUP: "Chờ shipper lấy hàng",
  SHIPPING: "Đang vận chuyển",
  DELIVERED: "Đã giao thành công 🎉",
  CANCELLED: "Đã huỷ",
};

const SHOP_ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.FC<{ size?: number; className?: string }> }
> = {
  PENDING: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  PREPARING: {
    label: "Preparing",
    cls: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
    icon: Loader2,
  },
  SHIPPING: {
    label: "Shipping",
    cls: "bg-violet-500/10 text-violet-500 dark:text-violet-400 border-violet-500/20",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    cls: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20",
    icon: XCircle,
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string | undefined;
  const [order, setOrder] = useState<ParentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live status updates from socket (via global store)
  const orderStatusUpdates = useNotificationStore((s) => s.orderStatusUpdates);
  // Live tracking events from socket (via global store)
  const trackingUpdates = useNotificationStore((s) => s.trackingUpdates);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    ordersService
      .getOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Failed to load order");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // When a realtime status update arrives, patch it into the local order state
  useEffect(() => {
    if (!order) return;
    let changed = false;
    const updatedShopOrders = (order.shop_orders || []).map((so) => {
      const newStatus = orderStatusUpdates[so.id];
      if (newStatus && newStatus !== so.status) {
        changed = true;
        const label = ORDER_STATUS_LABELS_VI[newStatus] || newStatus;
        toast.success(`Đơn hàng [${so.shop?.name || "Shop"}]: ${label}`, { duration: 5000 });
        return { ...so, status: newStatus as typeof so.status };
      }
      return so;
    });
    if (changed) {
      setOrder((prev) => prev ? { ...prev, shop_orders: updatedShopOrders } : prev);
    }
  }, [orderStatusUpdates]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto max-w-5xl px-4 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500 mb-6">
          <Link href="/" className="hover:text-violet-500 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/profile?tab=orders" className="hover:text-violet-500 transition-colors">
            Order History
          </Link>
          <span>/</span>
          <span className="text-foreground">Order Detail</span>
        </div>

        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400"
          >
            <ChevronLeft size={14} /> Back
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-card border border-card-border p-6 text-sm text-slate-500 dark:text-gray-400">
            Loading order...
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card border border-card-border p-6 text-sm text-red-400">
            {error}
          </div>
        ) : order ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-card border border-card-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-500">Order ID</div>
                  <div className="text-lg font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-gray-500">Total</div>
                  <div className="text-lg font-extrabold text-violet-500 tabular-nums">
                    {formatVnd(Number(order.total_payment))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-card border border-card-border p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CreditCard size={14} className="text-violet-500" /> Payment
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  Method: <span className="text-foreground font-semibold">{order.payment_method}</span>
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  Status: <span className="text-foreground font-semibold">{order.payment_status}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-card-border p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <MapPin size={14} className="text-violet-500" /> Shipping
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  {order.shipping_address}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-card-border p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
                <Package size={14} className="text-violet-500" /> Items
              </div>
              <div className="space-y-4">
                {(order.shop_orders || []).map((shop) => (
                  <div key={shop.id} className="rounded-xl border border-card-border bg-foreground/5 p-4">
                    <div className="flex items-center justify-between gap-4 mb-4 border-b border-card-border/50 pb-2">
                      <div className="text-xs font-bold text-slate-500 dark:text-gray-400">
                        {shop.shop?.name || "Shop"}
                      </div>
                      {(() => {
                        const status = shop.status || "PENDING";
                        const config = SHOP_ORDER_STATUS_CONFIG[status] || {
                          label: status,
                          cls: "bg-slate-500/10 text-slate-500 border-slate-500/20",
                          icon: Clock,
                        };
                        const StatusIcon = config.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.cls}`}
                          >
                            <StatusIcon size={10} className={status === "PREPARING" ? "animate-spin" : ""} />
                            {config.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="space-y-3">
                      {(shop.order_items || []).map((item) => {
                        const productName = item.product?.name || "Product";
                        const productLink = item.product?.slug
                          ? `/products/${item.product.slug}`
                          : `/products/${item.product_id}`;
                        const unitPrice = Number(item.price_at_purchase || 0);
                        const lineTotal = unitPrice * item.quantity;
                        return (
                          <Link
                            key={item.id}
                            href={productLink}
                            className="flex items-center justify-between gap-4 text-sm rounded-lg p-2 hover:bg-foreground/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-foreground/5 border border-card-border overflow-hidden flex items-center justify-center">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={getPublicImageUrl(item.product.images[0])}
                                    alt={productName}
                                    className="w-full h-full object-contain bg-white"
                                  />
                                ) : (
                                  <Package size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-foreground font-semibold truncate">
                                  {productName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                  {formatVnd(unitPrice)} × {item.quantity}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-foreground font-semibold tabular-nums whitespace-nowrap">
                              {formatVnd(lineTotal)}
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Tracking Timeline (Latest Only) */}
                    {(() => {
                      // Merge realtime events with loaded ones for this shop order
                      const base = shop.tracking_events || [];
                      const realtime = trackingUpdates[shop.id] || [];
                      const baseIds = new Set(base.map((e) => e.id));
                      const merged = [
                        ...realtime.filter((e) => !baseIds.has(e.id)),
                        ...base,
                      ];
                      if (merged.length === 0) return null;
                      const event = merged[0];
                      const isDelivered = event.event_type === "delivered";
                      return (
                        <div className="mt-4 pt-4 border-t border-card-border/50">
                          <Link href={`/orders/${order.id}/tracking/${shop.id}`} className="flex items-center gap-2 text-xs font-bold text-foreground mb-3 hover:text-violet-500 transition-colors w-fit">
                            <Navigation size={12} className="text-violet-500" /> Theo dõi đơn hàng
                          </Link>
                          <div className="space-y-0">
                            <div key={event.id} className="flex gap-3">
                              {/* Dot */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1 ${
                                    !isDelivered
                                      ? "border-violet-500 bg-violet-500 shadow-md shadow-violet-500/50 animate-pulse"
                                      : "border-emerald-500 bg-emerald-500"
                                  }`}
                                />
                              </div>
                              {/* Content */}
                              <div className="min-w-0">
                                <div
                                  className={`text-xs font-bold ${
                                    !isDelivered ? "text-violet-500" : "text-foreground"
                                  }`}
                                >
                                  {TRACKING_EVENT_LABELS[event.event_type] || event.event_type}
                                  {!isDelivered && (
                                    <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 truncate">
                                  {event.location ? `${event.location} · ` : ""}
                                  {new Date(event.created_at).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
