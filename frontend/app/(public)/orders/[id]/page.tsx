"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Package, CreditCard } from "lucide-react";
import { ordersService } from "@/services/orders.service";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import type { ParentOrder } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string | undefined;
  const [order, setOrder] = useState<ParentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-3">
                      {shop.shop?.name || "Shop"}
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
