"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Navigation, Loader2, Clock, MapPin } from "lucide-react";
import { ordersService } from "@/services/orders.service";
import { formatVnd } from "@/lib/currency";
import type { ParentOrder, ShopOrder } from "@/types";
import dynamic from 'next/dynamic';
import { useNotificationStore } from "@/store/useNotificationStore";

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { ssr: false });

const TRACKING_EVENT_LABELS: Record<string, string> = {
  order_packed: "Order Packed",
  picked_up: "Picked Up by Courier",
  arrived_at_hub: "Arrived at Sorting Hub",
  delivering: "Out for Delivery",
  delivered: "Delivered",
};

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const shopOrderId = params?.shopOrderId as string;

  const [order, setOrder] = useState<ParentOrder | null>(null);
  const [shopOrder, setShopOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);

  // Realtime tracking events from global store
  const realtimeTrackingEvents = useNotificationStore(
    (s) => s.trackingUpdates[shopOrderId] || []
  );

  // Merge realtime events on top of loaded events (deduplicate by id)
  const mergedTrackingEvents = useMemo(() => {
    const base = shopOrder?.tracking_events || [];
    const baseIds = new Set(base.map((e) => e.id));
    const newEvents = realtimeTrackingEvents.filter((e) => !baseIds.has(e.id));
    return [...newEvents, ...base];
  }, [shopOrder?.tracking_events, realtimeTrackingEvents]);

  useEffect(() => {
    if (!orderId || !shopOrderId) return;
    setLoading(true);
    ordersService
      .getOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
        const found = data.shop_orders?.find((s) => s.id === shopOrderId);
        if (found) {
          setShopOrder(found);
          if (found.status === 'DELIVERED') {
            const key = `delivered_modal_shown_${shopOrderId}`;
            if (!localStorage.getItem(key)) {
              setShowDeliveredModal(true);
              localStorage.setItem(key, '1');
            }
          }
        } else {
          setError("Shop order not found in this parent order");
        }
      })
      .catch((err: any) => setError(err?.response?.data?.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId, shopOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  if (error || !shopOrder) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
        <div className="text-red-500 mb-2 font-bold text-lg">Failed to load tracking data</div>
        <div className="text-slate-500 text-sm mb-6">{error}</div>
        <button onClick={() => router.back()} className="text-violet-500 hover:underline">Go back</button>
      </div>
    );
  }

  const firstProduct = (shopOrder as any)?.order_items?.[0]?.product;
  const reviewTarget = firstProduct?.slug || (shopOrder as any)?.order_items?.[0]?.product_id;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">

      {/* ─── Delivery Confirmation Modal ─── */}
      {showDeliveredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeliveredModal(false)} />
          <div
            className="relative w-full max-w-sm rounded-3xl bg-card border border-card-border shadow-2xl p-7 flex flex-col items-center text-center"
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <span className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</span>
            </div>
            <h2 className="text-xl font-extrabold text-foreground mb-2">Đã giao thành công!</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Đơn hàng{" "}
              <span className="font-bold text-foreground font-mono">
                {shopOrder.id.slice(0, 8).toUpperCase()}
              </span>{" "}
              của bạn đã được giao đến nơi. Cảm ơn bạn đã tin tưởng!
            </p>
            <div className="w-full space-y-3">
              {reviewTarget && (
                <button
                  id="btn-review-product"
                  onClick={() => {
                    setShowDeliveredModal(false);
                    router.push(`/products/${reviewTarget}?tab=reviews`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/30"
                >
                  ⭐ Đánh giá sản phẩm
                </button>
              )}
              <button
                id="btn-not-received"
                onClick={() => setShowDeliveredModal(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
              >
                ⚠️ Chưa nhận được hàng?
              </button>
            </div>
          </div>
          <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
      )}

      {/* ─── Top bar ─── */}
      <div className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors mr-2">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-violet-500">
            <Navigation size={16} /><span>SwiftTrack</span>
          </div>
          <div className="ml-auto text-xs font-semibold text-slate-500 dark:text-gray-400">
            Order: <span className="text-foreground">{shopOrder.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-6 flex-1 min-h-0 space-y-4">
        <TrackingMap shopOrderId={shopOrderId} shippingAddress={order?.shipping_address as string} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tracking Events */}
          <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Navigation size={14} className="text-violet-500" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Tracking Events</h3>
            </div>
            <div className="space-y-0">
              {!mergedTrackingEvents?.length ? (
                <div className="text-sm text-slate-500 py-4 text-center">No tracking events recorded yet.</div>
              ) : (
                mergedTrackingEvents.map((event, idx) => {
                  const isCurrent = idx === 0;
                  const isDelivered = event.event_type === "delivered";
                  return (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 ${
                          isCurrent && !isDelivered
                            ? "border-violet-500 bg-violet-500 shadow-md shadow-violet-500/50 animate-pulse"
                            : "border-emerald-500 bg-emerald-500"
                        }`} />
                        {idx < mergedTrackingEvents!.length - 1 && (
                          <div className="w-px flex-1 bg-card-border my-1 min-h-[32px]" />
                        )}
                      </div>
                      <div className="pb-6 min-w-0">
                        <div className={`text-sm font-bold ${isCurrent && !isDelivered ? "text-violet-500" : "text-foreground"}`}>
                          {TRACKING_EVENT_LABELS[event.event_type] || event.event_type}
                          {isCurrent && !isDelivered && (
                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">CURRENT</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 truncate">
                          {event.location ? `${event.location} · ` : ""}
                          {new Date(event.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panels */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Clock size={14} className="text-violet-500" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Order Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Shop</span>
                  <span className="text-xs font-semibold text-foreground">{(shopOrder as any).shop?.shop_name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Status</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${shopOrder.status === 'DELIVERED' ? 'text-emerald-400' : 'text-foreground'}`}>
                    {shopOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Order Total</span>
                  <span className="text-xs font-black text-violet-500">{formatVnd((shopOrder as any).totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={14} className="text-violet-500" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Destination</h3>
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                <div className="font-semibold text-foreground mb-1">{(order as any)?.shippingAddress?.full_name || (order as any)?.shipping_address}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  {(order as any)?.shippingAddress?.phone}<br />
                  {(order as any)?.shippingAddress?.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
