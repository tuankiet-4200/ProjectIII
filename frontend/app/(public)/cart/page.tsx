"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  ChevronRight,
  Store,
  Heart,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { formatVnd } from "@/lib/currency";
import { calculateOrderTotals } from "@/lib/orderTotals";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  shopId: string | number;
  shopName: string;
  imageUrl?: string;
}

interface CartShop {
  id: string | number;
  name: string;
  badge?: string;
}

const PERKS = [
  { icon: Truck, text: "Miễn phí vận chuyển cho đơn hàng trên 200.000₫" },
  { icon: ShieldCheck, text: "Bảo vệ người mua trên tất cả đơn hàng" },
  { icon: Package, text: "Đổi trả dễ dàng trong 30 ngày" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { groups, fetchCart, updateItem: updateItemStore, removeItem: removeItemStore, isLoading } = useCartStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  // Sync items with store groups
  useEffect(() => {
    if (groups && groups.length > 0) {
      const EMOJI_MAP = ['🎧', '🖱️', '🕯️', '👜', '⌚', '🎵'];
      const BG_MAP = [
        { from: '#1a1a1a', to: '#2d2d2d' }, { from: '#0d1b2a', to: '#1b2838' },
        { from: '#f5f0e0', to: '#e8dcb8' },
      ];
      let idx = 0;
      const mapped: CartItem[] = [];
      groups.forEach((group: any, gi: number) => {
        const shopId = group.shop?.id || gi + 1;
        const shopName = group.shop?.name || 'Shop';
        group.items.forEach((item: any) => {
          mapped.push({
            id: item.product_id || `prod-${idx}`,
            name: item.product?.name || `Product ${idx + 1}`,
            variant: item.product?.category?.name || '',
            price: Number(item.product?.price) || 0,
            qty: item.quantity,
            emoji: EMOJI_MAP[idx % EMOJI_MAP.length],
            bgFrom: BG_MAP[idx % BG_MAP.length].from,
            bgTo: BG_MAP[idx % BG_MAP.length].to,
            shopId: shopId,
            shopName: shopName,
            imageUrl: item.product?.images?.[0]
          });
          idx++;
        });
      });
      setItems(mapped);
      setSelectedIds((prev) => {
        const currentIds = mapped.map((item) => item.id);
        if (prev.length === 0) return currentIds;
        const preserved = prev.filter((id) => currentIds.includes(id));
        const added = currentIds.filter((id) => !prev.includes(id));
        return [...preserved, ...added];
      });
    } else if (!isLoading) {
      setItems([]);
      setSelectedIds([]);
    }
  }, [groups, isLoading]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQty = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      return removeItem(id);
    }
    
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: newQty } : i));
    await updateItemStore(id, newQty);
  };

  const removeItem = async (id: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    await removeItemStore(id);
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const selectedItemCount = selectedItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const totals = calculateOrderTotals(subtotal, discount);

  const itemsByShop = items.reduce((acc, item) => {
    let group = acc.find(g => g.id === item.shopId);
    if (!group) {
      group = { id: item.shopId, name: item.shopName, badge: 'Verified', items: [] };
      acc.push(group);
    }
    group.items.push(item);
    return acc;
  }, [] as (CartShop & { items: CartItem[] })[]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-violet-400 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300">Shopping Cart</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Shopping Cart</h1>
          <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {items.reduce((s, i) => s + i.qty, 0)}
          </span>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <ShoppingBag size={56} className="text-gray-700 mb-5" />
            <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-500 mb-6">Add some premium products to get started.</p>
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40"
            >
              Browse Products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ─── Cart Items ─── */}
            <div className="flex-1 space-y-5">
              {itemsByShop.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-2xl bg-card transition-colors duration-300 border border-card-border overflow-hidden"
                >
                  {/* Shop header */}
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-card-border bg-foreground/[0.02] transition-colors duration-300">
                    <Store size={14} className="text-violet-400" />
                    <span className="text-sm font-bold text-foreground">{shop.name}</span>
                    {shop.badge && (
                      <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                        {shop.badge}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      Tạm tính:{" "}
                      <span className="text-foreground font-medium">
                        {formatVnd(
                          shop.items
                            .filter((item) => selectedIds.includes(item.id))
                            .reduce((s, i) => s + i.price * i.qty, 0)
                        )}
                      </span>
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-card-border transition-colors duration-300">
                    {shop.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          aria-label={`Chọn ${item.name} để thanh toán`}
                          className="h-4 w-4 shrink-0 rounded border-card-border accent-violet-600"
                        />

                        {/* Thumbnail */}
                        {item.imageUrl ? (
                          <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden bg-white">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                            style={{
                              background: `linear-gradient(135deg, ${item.bgFrom}, ${item.bgTo})`,
                            }}
                          >
                            {item.emoji}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                          <p className="text-sm font-extrabold text-violet-400 mt-1">
                            {formatVnd(item.price)}
                          </p>
                        </div>

                        {/* Qty & actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-foreground/5">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-l-xl transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-foreground select-none">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-r-xl transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <div className="text-sm font-bold text-foreground w-28 text-right tabular-nums whitespace-nowrap">
                            {formatVnd(item.price * item.qty)}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button className="text-gray-600 hover:text-rose-400 transition-colors">
                            <Heart size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Perks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PERKS.map((perk) => (
                  <div
                    key={perk.text}
                    className="flex items-center gap-3 rounded-xl bg-card transition-colors duration-300 border border-card-border px-4 py-3"
                  >
                    <perk.icon size={16} className="text-violet-400 shrink-0" />
                    <span className="text-xs text-gray-400">{perk.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Order Summary ─── */}
            <div className="lg:w-80 shrink-0 space-y-4">
              <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-5 space-y-4">
                <h2 className="text-base font-bold text-foreground">Order Summary</h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Tạm tính ({selectedItemCount} sản phẩm)</span>
                    <span className="text-foreground font-medium">{formatVnd(subtotal)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Giảm giá (10%)</span>
                      <span>-{formatVnd(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Vận chuyển</span>
                    <span className={totals.shipping === 0 ? "text-emerald-400 font-semibold" : "text-foreground font-medium"}>
                      {totals.shipping === 0 ? "MIỄN PHÍ" : formatVnd(totals.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Thuế (3.5%)</span>
                    <span className="text-foreground font-medium">{formatVnd(totals.tax)}</span>
                  </div>
                  <div className="border-t border-card-border pt-3 flex justify-between">
                    <span className="font-bold text-foreground text-base">Tổng thanh toán</span>
                    <span className="font-extrabold text-violet-400 text-lg">{formatVnd(totals.total)}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="pt-1">
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 rounded-xl bg-foreground/5 border border-white/10 focus-within:border-violet-500/60 px-3 py-2 transition-colors">
                      <Tag size={13} className="text-gray-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-gray-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => { if (coupon) setCouponApplied(true); }}
                      className="rounded-xl bg-violet-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                      ✓ Coupon applied — 10% off!
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={(event) => {
                    if (selectedIds.length === 0) {
                      event.preventDefault();
                      return;
                    }
                    sessionStorage.setItem("checkout:selected_product_ids", JSON.stringify(selectedIds));
                  }}
                  aria-disabled={selectedIds.length === 0}
                  className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold transition-all shadow-lg shadow-violet-900/40 ${
                    selectedIds.length === 0
                      ? "pointer-events-none bg-violet-600/40 text-white/60"
                      : "bg-violet-600 text-white hover:bg-violet-500 active:scale-95"
                  }`}
                >
                  Proceed to Checkout <ArrowRight size={15} />
                </Link>

                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-foreground/5 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Continue Shopping
                </Link>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
