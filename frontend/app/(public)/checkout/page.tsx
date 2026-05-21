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
  Tag,
  X,
} from "lucide-react";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import dynamic from 'next/dynamic';

const AddressMapPicker = dynamic(() => import('@/components/AddressMapPicker').then(mod => mod.AddressMapPicker), { ssr: false });

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
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount_amount: number; description: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
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

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [debouncedAddressInfo, setDebouncedAddressInfo] = useState({ address: "", ward: "", district: "", city: "" });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=3")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Failed to load provinces", err));
  }, []);

  useEffect(() => {
    if (shipping.address.trim().length > 2 || shipping.city) {
      const timer = setTimeout(() => {
        setDebouncedAddressInfo({
          address: shipping.address,
          ward: shipping.ward,
          district: shipping.district,
          city: shipping.city,
        });
        setShowMap(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [shipping.address, shipping.ward, shipping.district, shipping.city]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setShipping((s) => ({ ...s, city: cityName, district: "", ward: "" }));
    const p = provinces.find((prov) => prov.name === cityName);
    setDistricts(p ? p.districts : []);
    setWards([]);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    setShipping((s) => ({ ...s, district: districtName, ward: "" }));
    const d = districts.find((dist) => dist.name === districtName);
    setWards(d ? d.wards : []);
  };

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const shop_amounts = groups.map(g => ({
        shop_id: g.shop?.id || "",
        amount: g.subtotal ?? g.items.reduce((s, i) => s + Number(i.product?.price || 0) * i.quantity, 0)
      })).filter(s => s.shop_id !== "");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode.trim().toUpperCase(), 
          order_amount: subtotal,
          shop_amounts
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mã không hợp lệ');
      setCouponApplied({ code: data.code, discount_amount: data.discount_amount, description: data.description });
      toast.success(`Áp dụng mã thành công! Giảm ${data.discount_amount.toLocaleString('vi-VN')}₫`);
    } catch (e: any) {
      toast.error(e.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (allItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }
    if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
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
        coupon_code: couponApplied?.code,
      });
      setPlaced(true);
      await fetchCart();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
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

                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Tỉnh/Thành phố
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.city}
                      onChange={handleCityChange}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-card">Chọn Tỉnh/Thành phố</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.name} className="bg-card">{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Quận/Huyện
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.district}
                      onChange={handleDistrictChange}
                      disabled={!districts.length}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <option value="" className="bg-card">Chọn Quận/Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.name} className="bg-card">{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Phường/Xã
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.ward}
                      onChange={(e) => setShipping((s) => ({ ...s, ward: e.target.value }))}
                      disabled={!wards.length}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <option value="" className="bg-card">Chọn Phường/Xã</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.name} className="bg-card">{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1.5">
                    Ngõ ngách, số nhà
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Số 10 ngõ 123..."
                      value={shipping.address}
                      onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                      className="w-full rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-sm text-foreground placeholder:text-slate-400 px-4 py-2.5 outline-none transition-colors"
                    />
                    {showMap && (
                      <AddressMapPicker
                        addressInfo={debouncedAddressInfo}
                        onSelectAddress={(address) => setShipping((s) => ({ ...s, address }))}
                      />
                    )}
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
              <h2 className="text-base font-bold text-foreground">Tóm tắt đơn hàng</h2>

              {/* Coupon input */}
              <div className="space-y-2">
                {couponApplied ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-400">{couponApplied.code}</div>
                        <div className="text-[10px] text-emerald-500/70">{couponApplied.description}</div>
                      </div>
                    </div>
                    <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} className="text-slate-400 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="flex-1 rounded-xl bg-input-bg border border-card-border focus:border-violet-500/60 text-xs text-foreground placeholder:text-slate-400 px-3 py-2 outline-none transition-colors"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 transition-all"
                    >
                      {couponLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Tạm tính ({itemCount} sản phẩm)</span>
                  <span className="text-foreground font-medium text-right tabular-nums whitespace-nowrap">
                    {formatVnd(subtotal || totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Vận chuyển</span>
                  <span className={shippingFee === 0 ? "text-emerald-500 font-bold" : "text-foreground font-medium"}>
                    {shippingFee === 0 ? 'MIỄN PHÍ' : formatVnd(shippingFee)}
                  </span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1"><Tag size={11} /> Giảm giá</span>
                    <span className="font-bold">-{formatVnd(couponApplied.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-card-border pt-3 flex justify-between items-baseline gap-3">
                  <span className="font-bold text-foreground">Tổng thanh toán</span>
                  <span className="font-extrabold text-violet-500 text-xl tabular-nums whitespace-nowrap">
                    {formatVnd(Math.max(0, subtotal + shippingFee - (couponApplied?.discount_amount ?? 0)))}
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
