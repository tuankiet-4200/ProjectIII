"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SHOPS: CartShop[] = [
  { id: 1, name: "TechHub Official Store", badge: "Top Seller" },
  { id: 2, name: "Luxe Living Home", badge: "Verified" },
];

const INITIAL_ITEMS: CartItem[] = [
  {
    id: "prod-1",
    name: "Pro-Sound Wireless Headphones",
    variant: "Space Grey, Over-ear",
    price: 199,
    qty: 1,
    emoji: "🎧",
    bgFrom: "#1a1a1a",
    bgTo: "#2d2d2d",
    shopId: 1, shopName: "TechHub Official Store",
  },
  {
    id: "prod-2",
    name: "SwiftClick Gaming Mouse",
    variant: "RGB, 16000 DPI",
    price: 100,
    qty: 1,
    emoji: "🖱️",
    bgFrom: "#0d1b2a",
    bgTo: "#1b2838",
    shopId: 1, shopName: "TechHub Official Store",
  },
  {
    id: "prod-3",
    name: "Organic Soy Candle",
    variant: "Lavender & Bergamot",
    price: 45,
    qty: 1,
    emoji: "🕯️",
    bgFrom: "#f5f0e0",
    bgTo: "#e8dcb8",
    shopId: 2, shopName: "Luxe Living Home",
  },
];

const PERKS = [
  { icon: Truck, text: "Free shipping on orders over $200" },
  { icon: ShieldCheck, text: "Buyer protection on all orders" },
  { icon: Package, text: "Easy 30-day returns" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { groups, totalItems, fetchCart, updateItem: updateItemStore, removeItem: removeItemStore, isLoading } = useCartStore();
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
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
    } else if (!isLoading) {
      setItems([]);
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
    await removeItemStore(id);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= 200 ? 0 : 12;
  const tax = Math.round(subtotal * 0.035 * 100) / 100;
  const total = subtotal - discount + shipping + tax;

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
                      Subtotal:{" "}
                      <span className="text-foreground font-medium">
                        ${shop.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                      </span>
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-card-border transition-colors duration-300">
                    {shop.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-5">
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
                            ${item.price.toFixed(2)}
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
                          <div className="text-sm font-bold text-foreground w-16 text-right">
                            ${(item.price * item.qty).toFixed(2)}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors ml-1"
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
                    <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                    <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-400 font-semibold" : "text-foreground font-medium"}>
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax (3.5%)</span>
                    <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-card-border pt-3 flex justify-between">
                    <span className="font-bold text-foreground text-base">Total Payment</span>
                    <span className="font-extrabold text-violet-400 text-lg">${total.toFixed(2)}</span>
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
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-900/40"
                >
                  Proceed to Checkout <ArrowRight size={15} />
                </Link>

                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-foreground/5 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Continue Shopping
                </Link>

                <div className="flex items-center justify-center gap-4 pt-1">
                  {["🔒 Secure", "💳 Multi-pay", "📦 Fast Ship"].map((badge) => (
                    <span key={badge} className="text-[10px] text-gray-600">{badge}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
