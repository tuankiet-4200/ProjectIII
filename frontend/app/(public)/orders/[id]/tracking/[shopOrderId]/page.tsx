"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Navigation,
  Loader2,
  Clock,
  MapPin,
} from "lucide-react";
import { ordersService } from "@/services/orders.service";
import { formatVnd } from "@/lib/currency";
import type { ParentOrder, ShopOrder } from "@/types";
import dynamic from 'next/dynamic';

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

  useEffect(() => {
    if (!orderId || !shopOrderId) return;
    setLoading(true);
    ordersService
      .getOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
        const specificShopOrder = data.shop_orders?.find((s) => s.id === shopOrderId);
        if (specificShopOrder) {
          setShopOrder(specificShopOrder);
        } else {
          setError("Shop order not found in this parent order");
        }
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Failed to load order");
      })
      .finally(() => setLoading(false));
  }, [orderId, shopOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500 mb-4" size={32} />
      </div>
    );
  }

  if (error || !shopOrder) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
        <div className="text-red-500 mb-2 font-bold text-lg">Failed to load tracking data</div>
        <div className="text-slate-500 text-sm mb-6">{error}</div>
        <button onClick={() => router.back()} className="text-violet-500 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* ─── Top bar ─── */}
      <div className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors mr-2">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-violet-500">
            <Navigation size={16} />
            <span>SwiftTrack</span>
          </div>
          <div className="ml-auto text-xs font-semibold text-slate-500 dark:text-gray-400">
            Order: <span className="text-foreground">{shopOrder.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-6 flex-1 min-h-0 space-y-4">
        {/* Map */}
        <TrackingMap shopOrderId={shopOrderId} />

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
              {(!shopOrder.tracking_events || shopOrder.tracking_events.length === 0) ? (
                <div className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
                  No tracking events recorded yet.
                </div>
              ) : (
                shopOrder.tracking_events.map((event, idx) => {
                  const isCurrent = idx === 0;
                  const isDelivered = event.event_type === "delivered";
                  
                  return (
                    <div key={event.id} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 ${
                            isCurrent && !isDelivered
                              ? "border-violet-500 bg-violet-500 shadow-md shadow-violet-500/50"
                              : isDelivered || !isCurrent
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300 dark:border-gray-600 bg-transparent"
                          }`}
                        />
                        {idx < shopOrder.tracking_events!.length - 1 && (
                          <div className="w-px flex-1 bg-card-border my-1 min-h-[32px]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-6 min-w-0">
                        <div
                          className={`text-sm font-bold ${
                            isCurrent && !isDelivered ? "text-violet-500" : isDelivered || !isCurrent ? "text-foreground" : "text-slate-500 dark:text-gray-400"
                          }`}
                        >
                          {TRACKING_EVENT_LABELS[event.event_type] || event.event_type}
                          {isCurrent && !isDelivered && (
                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 truncate">
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
                  );
                })
              )}
            </div>
          </div>

          {/* Right panels */}
          <div className="space-y-4">
            
            {/* Order Details */}
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
                  <span className="text-xs font-semibold text-foreground">{shopOrder.shop.shop_name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Status</span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{shopOrder.status}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-gray-400">Order Total</span>
                  <span className="text-xs font-black text-violet-500">{formatVnd(shopOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={14} className="text-violet-500" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Destination</h3>
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                <div className="font-semibold text-foreground mb-1">
                  {order?.shippingAddress?.full_name}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  {order?.shippingAddress?.phone}
                  <br />
                  {order?.shippingAddress?.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
