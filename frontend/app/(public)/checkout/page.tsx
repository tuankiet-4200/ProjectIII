"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ChevronRight,
  Store,
  Minus,
  Plus,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Lock,
  ChevronDown,
  BadgeCheck,
  Package,
} from "lucide-react";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "cod" | "vnpay" | "momo";
type Step = 1 | 2;

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; emoji: string }[] = [
  { id: "cod", label: "COD", desc: "Cash on delivery", emoji: "💵" },
  { id: "vnpay", label: "VNPay", desc: "Bank Transfer", emoji: "🏦" },
  { id: "momo", label: "MoMo", desc: "Mobile Wallet", emoji: "💜" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <h1 className="text-xl font-extrabold text-foreground flex-1">
        {step === 1 ? "Review your order" : "Confirm & Pay"}
      </h1>
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 shrink-0">
        <span className={step >= 1 ? "text-violet-500 font-semibold" : ""}>Step {step} of 2</span>
      </div>
      {/* progress bar */}
      <div className="w-24 h-1 rounded-full bg-foreground/10 overflow-hidden hidden sm:block">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
}

// ─── Qty stepper (read-only style on checkout) ────────────────────────────────

function QtyControl({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-card-border bg-foreground/5">
      <button
        onClick={() => onChange(-1)}
        className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors"
      >
        <Minus size={10} />
      </button>
      <span className="w-6 text-center text-xs font-bold text-foreground select-none">{qty}</span>
      <button
        onClick={() => onChange(1)}
        className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors"
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [step] = useState<Step>(1);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [placed, setPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const groups = useCartStore((s) => s.groups);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Shipping form state
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }
    fetchCart().catch(() => toast.error("Failed to load cart"));
  }, [fetchCart, isAuthenticated, router]);

  const allItems = useMemo(
    () => groups.flatMap((g) => g.items || []).filter((item) => item.product),
    [groups]
  );
  const subtotal = allItems.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * item.quantity,
    0
  );
  const shippingFee = subtotal >= 200 ? 0 : 12;
  const tax = Math.round(subtotal * 0.035);
  const total = subtotal + shippingFee + tax;
  const itemCount = allItems.reduce((s, i) => s + i.quantity, 0);

  const updateQty = async (productId: string, nextQty: number) => {
    try {
      setIsUpdating(true);
      if (nextQty <= 0) {
        await removeItem(productId);
      } else {
        await updateItem(productId, nextQty);
      }
      await fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update cart");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (allItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city) {
      toast.error("Please complete shipping information");
      return;
    }
    setIsSubmitting(true);
    const address = `${shipping.fullName}, ${shipping.phone}, ${shipping.address}, ${shipping.ward}, ${shipping.district}, ${shipping.city}`;
    try {
      const { ordersService } = await import('@/services/orders.service');
      const paymentMap: Record<string, 'COD' | 'VNPAY' | 'MOMO'> = { cod: 'COD', vnpay: 'VNPAY', momo: 'MOMO' };
      await ordersService.checkout({
        shipping_address: address,
        payment_method: paymentMap[payment],
      });
      setPlaced(true);
      await fetchCart();
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-3">Order Placed! 🎉</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">
            Thank you for your purchase. Your order{" "}
            <span className="text-violet-500 font-bold">#LXM-{Math.floor(Math.random() * 90000 + 10000)}</span>{" "}
            has been confirmed.
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-500 mb-8">You will receive a confirmation email shortly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile?tab=orders"
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
            >
              View Orders
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 rounded-xl border border-card-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 transition-all"
            >
              Shop More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* Secure bar */}
      <div className="border-b border-card-border bg-card/80 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 h-10 flex items-center justify-end gap-2">
          <Lock size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Secure Checkout</span>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500 mb-5">
          <Link href="/" className="hover:text-violet-500 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/cart" className="hover:text-violet-500 transition-colors">Cart</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">Checkout</span>
        </div>

        <StepBar step={step} />

        {isLoading ? (
          <div className="rounded-2xl bg-card border border-card-border p-6 text-sm text-slate-500 dark:text-gray-400">
            Loading your cart...
          </div>
        ) : allItems.length === 0 ? (
          <div className="rounded-2xl bg-card border border-card-border p-6 text-sm text-slate-500 dark:text-gray-400">
            Your cart is empty. <Link href="/products" className="text-violet-500">Continue shopping</Link>.
          </div>
        ) : (
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Left column ─── */}
          <div className="flex-1 space-y-5">

            {/* Order review */}
            <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-card-border bg-foreground/5 flex items-center gap-2">
                <MapPin size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-foreground">Review Order Items</h2>
              </div>

              {groups.map((group) => (
                <div key={group.shop?.id || group.shop?.name} className="border-b border-card-border last:border-b-0">
                  {/* Shop header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-foreground/5">
                    <Store size={12} className="text-violet-400" />
                    <span className="text-xs font-bold text-foreground">{group.shop?.name || "Shop"}</span>
                    <span className="ml-auto text-xs text-slate-500 dark:text-gray-500">
                      Tạm tính:{" "}
                      <span className="text-foreground font-semibold">
                        {formatVnd(
                          group.subtotal ??
                            group.items.reduce(
                              (s, i) => s + Number(i.product?.price || 0) * i.quantity,
                              0
                            )
                        )}
                      </span>
                    </span>
                  </div>

                  {group.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-4 px-5 py-4 border-t border-card-border">
                      <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl bg-foreground/5 border border-card-border overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <img
                            src={getPublicImageUrl(item.product.images[0])}
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-contain bg-white"
                          />
                        ) : (
                          <Package size={18} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {item.product?.name || "Product"}
                        </div>
                        <div className="text-sm font-bold text-violet-400 mt-1">
                          {formatVnd(Number(item.product?.price || 0))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <QtyControl
                          qty={item.quantity}
                          onChange={(d) => updateQty(item.product_id, item.quantity + d)}
                        />
                        <div className="text-sm font-bold text-foreground w-24 text-right tabular-nums whitespace-nowrap">
                          {formatVnd(Number(item.product?.price || 0) * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Shipping form */}
            <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-card-border bg-foreground/5 flex items-center gap-2">
                <Truck size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-foreground">Shipping Information</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={shipping.fullName}
                    onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                    className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground placeholder:text-slate-400 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+84 901 234 567"
                    value={shipping.phone}
                    onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                    className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground placeholder:text-slate-400 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Address Line
                  </label>
                  <input
                    type="text"
                    placeholder="House number, Street name"
                    value={shipping.address}
                    onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                    className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground placeholder:text-slate-400 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Ward
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.ward}
                      onChange={(e) => setShipping((s) => ({ ...s, ward: e.target.value }))}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-card">Select Ward</option>
                      <option value="ward1" className="bg-card">Ward 1</option>
                      <option value="ward2" className="bg-card">Ward 2</option>
                      <option value="ward3" className="bg-card">Ward 3</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    District
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.district}
                      onChange={(e) => setShipping((s) => ({ ...s, district: e.target.value }))}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-card">Select District</option>
                      <option value="d1" className="bg-card">District 1</option>
                      <option value="d2" className="bg-card">District 2</option>
                      <option value="d3" className="bg-card">District 3</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    City
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.city}
                      onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-card">Select City</option>
                      <option value="hcm" className="bg-card">Ho Chi Minh City</option>
                      <option value="hn" className="bg-card">Ha Noi</option>
                      <option value="dn" className="bg-card">Da Nang</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-card-border bg-foreground/5 flex items-center gap-2">
                <CreditCard size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-foreground">Payment Method</h2>
              </div>
              <div className="p-5 flex flex-wrap gap-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPayment(opt.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      payment === opt.id
                        ? "border-violet-500/60 bg-violet-500/10"
                        : "border-card-border bg-foreground/5 hover:border-violet-500/30"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-foreground">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-500">{opt.desc}</div>
                    </div>
                    <div
                      className={`ml-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        payment === opt.id ? "border-violet-500 bg-violet-500" : "border-gray-600"
                      }`}
                    >
                      {payment === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Order Summary sidebar ─── */}
          <div className="lg:w-80 shrink-0">
            <div className="rounded-2xl bg-card border border-card-border p-5 space-y-4 sticky top-24">
              <h2 className="text-base font-bold text-foreground">Order Summary</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Tạm tính ({itemCount} sản phẩm)</span>
                  <span className="text-foreground font-medium text-right tabular-nums whitespace-nowrap">
                    {formatVnd(subtotal || totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Vận chuyển</span>
                  <span
                    className={
                      shippingFee === 0
                        ? "text-emerald-500 font-bold"
                        : "text-foreground font-medium"
                    }
                  >
                    {shippingFee === 0 ? "MIỄN PHÍ" : formatVnd(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Thuế</span>
                  <span className="text-foreground font-medium text-right tabular-nums whitespace-nowrap">
                    {formatVnd(tax)}
                  </span>
                </div>
                <div className="border-t border-card-border pt-3 flex justify-between items-baseline gap-3">
                  <span className="font-bold text-foreground">Tổng thanh toán</span>
                  <span className="font-extrabold text-violet-500 text-xl tabular-nums whitespace-nowrap">
                    {formatVnd(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || isUpdating || allItems.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-900/40"
              >
                {isSubmitting ? "Processing..." : "Place Order Now"}
              </button>

              <p className="text-[10px] text-slate-500 dark:text-gray-500 text-center leading-relaxed">
                By clicking "Place Order Now", you agree to our{" "}
                <span className="text-violet-500 cursor-pointer">Terms of Service</span> and{" "}
                <span className="text-violet-500 cursor-pointer">Privacy Policy</span>.
              </p>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 pt-1 text-slate-500 dark:text-gray-500">
                <ShieldCheck size={20} />
                <BadgeCheck size={20} />
                <Lock size={20} />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
