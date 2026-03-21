"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "cod" | "vnpay" | "momo";
type Step = 1 | 2;

interface OrderItem {
  id: number;
  name: string;
  variant: string;
  price: number;
  qty: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  shopId: number;
}

// ─── Mock order data ──────────────────────────────────────────────────────────

const ORDER_GROUPS = [
  {
    id: 1,
    name: "TechHub Official Store",
    items: [
      {
        id: 1, name: "Pro-Sound Wireless Headphones", variant: "Space Grey, Over-ear",
        price: 199, qty: 1, emoji: "🎧", bgFrom: "#1a1a1a", bgTo: "#2d2d2d", shopId: 1,
      },
      {
        id: 2, name: "SwiftClick Gaming Mouse", variant: "RGB, 16000 DPI",
        price: 100, qty: 1, emoji: "🖱️", bgFrom: "#0d1b2a", bgTo: "#1b2838", shopId: 1,
      },
    ],
  },
  {
    id: 2,
    name: "Luxe Living Home",
    items: [
      {
        id: 3, name: "Organic Soy Candle", variant: "Lavender & Bergamot",
        price: 45, qty: 1, emoji: "🕯️", bgFrom: "#f5f0e0", bgTo: "#e8dcb8", shopId: 2,
      },
    ],
  },
];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; emoji: string }[] = [
  { id: "cod", label: "COD", desc: "Cash on delivery", emoji: "💵" },
  { id: "vnpay", label: "VNPay", desc: "Bank Transfer", emoji: "🏦" },
  { id: "momo", label: "MoMo", desc: "Mobile Wallet", emoji: "💜" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <h1 className="text-xl font-extrabold text-white flex-1">
        {step === 1 ? "Review your order" : "Confirm & Pay"}
      </h1>
      <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
        <span className={step >= 1 ? "text-violet-400 font-semibold" : ""}>Step {step} of 2</span>
      </div>
      {/* progress bar */}
      <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden hidden sm:block">
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
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5">
      <button
        onClick={() => onChange(-1)}
        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <Minus size={10} />
      </button>
      <span className="w-6 text-center text-xs font-bold text-white select-none">{qty}</span>
      <button
        onClick={() => onChange(1)}
        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>(1);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [placed, setPlaced] = useState(false);
  const [groups, setGroups] = useState(ORDER_GROUPS);

  // Shipping form state
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: "",
  });

  const updateQty = (groupId: number, itemId: number, delta: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: g.items
                .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
                .filter((i) => i.qty > 0),
            }
          : g
      ).filter((g) => g.items.length > 0)
    );
  };

  const allItems = groups.flatMap((g) => g.items);
  const subtotal = allItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingFee = subtotal >= 200 ? 0 : 12;
  const tax = +(subtotal * 0.035).toFixed(2);
  const total = subtotal + shippingFee + tax;
  const itemCount = allItems.reduce((s, i) => s + i.qty, 0);

  if (placed) {
    return (
      <div className="min-h-screen bg-[#0B0A10] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">Order Placed! 🎉</h1>
          <p className="text-sm text-gray-400 mb-2">
            Thank you for your purchase. Your order{" "}
            <span className="text-violet-400 font-bold">#LXM-{Math.floor(Math.random() * 90000 + 10000)}</span>{" "}
            has been confirmed.
          </p>
          <p className="text-xs text-gray-600 mb-8">You will receive a confirmation email shortly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
            >
              View Orders
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
            >
              Shop More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white">

      {/* Secure bar */}
      <div className="border-b border-white/5 bg-[#0F0D1A]/80">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 h-10 flex items-center justify-end gap-2">
          <Lock size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Secure Checkout</span>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
          <Link href="/" className="hover:text-violet-400 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/cart" className="hover:text-violet-400 transition-colors">Cart</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300">Checkout</span>
        </div>

        <StepBar step={step} />

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Left column ─── */}
          <div className="flex-1 space-y-5">

            {/* Order review */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <MapPin size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-white">Review Order Items</h2>
              </div>

              {groups.map((group) => (
                <div key={group.id} className="border-b border-white/5 last:border-b-0">
                  {/* Shop header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-white/[0.015]">
                    <Store size={12} className="text-violet-400" />
                    <span className="text-xs font-bold text-gray-300">{group.name}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      Subtotal:{" "}
                      <span className="text-white font-semibold">
                        ${group.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                      </span>
                    </span>
                  </div>

                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4 border-t border-white/[0.03]">
                      <div
                        className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl"
                        style={{ background: `linear-gradient(135deg, ${item.bgFrom}, ${item.bgTo})` }}
                      >
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.variant}</div>
                        <div className="text-sm font-bold text-violet-400 mt-1">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <QtyControl
                          qty={item.qty}
                          onChange={(d) => updateQty(group.id, item.id, d)}
                        />
                        <div className="text-sm font-bold text-white w-14 text-right">
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Shipping form */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <Truck size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-white">Shipping Information</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={shipping.fullName}
                    onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white placeholder:text-gray-600 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+84 901 234 567"
                    value={shipping.phone}
                    onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white placeholder:text-gray-600 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Address Line
                  </label>
                  <input
                    type="text"
                    placeholder="House number, Street name"
                    value={shipping.address}
                    onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white placeholder:text-gray-600 px-4 py-2.5 outline-none transition-colors"
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Ward
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.ward}
                      onChange={(e) => setShipping((s) => ({ ...s, ward: e.target.value }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-[#1C1828]">Select Ward</option>
                      <option value="ward1" className="bg-[#1C1828]">Ward 1</option>
                      <option value="ward2" className="bg-[#1C1828]">Ward 2</option>
                      <option value="ward3" className="bg-[#1C1828]">Ward 3</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    District
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.district}
                      onChange={(e) => setShipping((s) => ({ ...s, district: e.target.value }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-[#1C1828]">Select District</option>
                      <option value="d1" className="bg-[#1C1828]">District 1</option>
                      <option value="d2" className="bg-[#1C1828]">District 2</option>
                      <option value="d3" className="bg-[#1C1828]">District 3</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    City
                  </label>
                  <div className="relative">
                    <select
                      value={shipping.city}
                      onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-sm text-white px-4 py-2.5 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-[#1C1828]">Select City</option>
                      <option value="hcm" className="bg-[#1C1828]">Ho Chi Minh City</option>
                      <option value="hn" className="bg-[#1C1828]">Ha Noi</option>
                      <option value="dn" className="bg-[#1C1828]">Da Nang</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <CreditCard size={13} className="text-violet-400" />
                <h2 className="text-sm font-bold text-white">Payment Method</h2>
              </div>
              <div className="p-5 flex flex-wrap gap-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPayment(opt.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      payment === opt.id
                        ? "border-violet-500/60 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-gray-500">{opt.desc}</div>
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
          <div className="lg:w-72 shrink-0">
            <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 space-y-4 sticky top-24">
              <h2 className="text-base font-bold text-white">Order Summary</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping Total</span>
                  <span className={shippingFee === 0 ? "text-emerald-400 font-bold" : "text-white font-medium"}>
                    {shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span className="text-white font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-white">Total Payment</span>
                  <span className="font-extrabold text-violet-400 text-xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setPlaced(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-900/40"
              >
                Place Order Now
              </button>

              <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                By clicking "Place Order Now", you agree to our{" "}
                <span className="text-violet-500 cursor-pointer">Terms of Service</span> and{" "}
                <span className="text-violet-500 cursor-pointer">Privacy Policy</span>.
              </p>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 pt-1">
                <ShieldCheck size={20} className="text-gray-600" />
                <BadgeCheck size={20} className="text-gray-600" />
                <Lock size={20} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
