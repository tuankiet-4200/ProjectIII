"use client";

import { useState } from "react";
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Shield,
  Pencil,
  Plus,
  Trash2,
  Check,
  BadgeCheck,
  Eye,
  EyeOff,
  ChevronRight,
  Package,
  Clock,
  Star,
  Camera,
  Bell,
  LogOut,
  Lock,
  Smartphone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "profile" | "address" | "orders" | "wishlist" | "security";

interface Address {
  id: number;
  label: string;
  isDefault: boolean;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  id: string;
  date: string;
  status: "delivered" | "processing" | "shipped" | "cancelled";
  total: number;
  items: number;
  productName: string;
  emoji: string;
}

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  inStock: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USER = {
  name: "Julianne Doe",
  email: "j.doe@premium.com",
  phone: "+1 (555) 902-3412",
  avatar: "JD",
  tier: "Platinum Member",
  verified: true,
  joined: "January 2023",
};

const ADDRESSES: Address[] = [
  {
    id: 1,
    label: "Home Office",
    isDefault: true,
    line1: "1230 Creative Lane, Suite 404",
    city: "San Francisco",
    state: "CA",
    zip: "94107",
    country: "United States",
  },
  {
    id: 2,
    label: "Downtown Loft",
    isDefault: false,
    line1: "111 Market Street, Apt 12B",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    country: "United States",
  },
];

const ORDERS: Order[] = [
  {
    id: "#LXM-00412",
    date: "Mar 15, 2026",
    status: "delivered",
    total: 1299,
    items: 1,
    productName: "SonicMaster Elite Headphones",
    emoji: "🎧",
  },
  {
    id: "#LXM-00389",
    date: "Mar 2, 2026",
    status: "delivered",
    total: 249,
    items: 1,
    productName: "Lunar Series Minimalist Watch",
    emoji: "⌚",
  },
  {
    id: "#LXM-00371",
    date: "Feb 18, 2026",
    status: "shipped",
    total: 420,
    items: 1,
    productName: "Retrospect 35mm Analog Camera",
    emoji: "📷",
  },
  {
    id: "#LXM-00340",
    date: "Jan 30, 2026",
    status: "cancelled",
    total: 189,
    items: 2,
    productName: "Sonic-X Noise Cancelling Headphones",
    emoji: "🎵",
  },
];

const WISHLIST: WishlistItem[] = [
  {
    id: 1,
    name: "Golden Era Tube Amplifier",
    price: 12500,
    emoji: "🔆",
    bgFrom: "#1c1209",
    bgTo: "#2d1a08",
    inStock: true,
  },
  {
    id: 2,
    name: "Vintage Walnut Turntable Pro",
    price: 2850,
    emoji: "🎵",
    bgFrom: "#2d1b0e",
    bgTo: "#4a2c0a",
    inStock: true,
  },
  {
    id: 3,
    name: "Reference Series 5 Monitor Speaker",
    price: 4200,
    originalPrice: 4800,
    emoji: "🔊",
    bgFrom: "#f8f8f5",
    bgTo: "#e8e8e0",
    inStock: false,
  },
  {
    id: 4,
    name: "Crystalline IEM Reference Earphones",
    price: 680,
    emoji: "🎶",
    bgFrom: "#0d1b2a",
    bgTo: "#1b2838",
    inStock: true,
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Order["status"], { label: string; cls: string }> = {
  delivered: { label: "Delivered", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  processing: { label: "Processing", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  shipped: { label: "Shipped", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  danger,
}: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ─── Section: Profile Info ────────────────────────────────────────────────────

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: USER.name,
    email: USER.email,
    phone: USER.phone,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Profile Information</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Pencil size={12} />
          {editing ? "Cancel" : "Edit Details"}
        </button>
      </div>

      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6">
        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
              {USER.avatar}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-[#14121C] flex items-center justify-center hover:bg-violet-500 transition-colors">
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div>
            <div className="text-base font-bold text-white">{USER.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-violet-400 font-semibold bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                {USER.tier}
              </span>
              {USER.verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  <BadgeCheck size={10} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "FULL NAME", field: "name" as const, value: form.name, type: "text" },
            { label: "EMAIL ADDRESS", field: "email" as const, value: form.email, type: "email" },
            { label: "PHONE NUMBER", field: "phone" as const, value: form.phone, type: "tel" },
            { label: "MEMBER SINCE", value: USER.joined, type: "text", readonly: true },
          ].map((item) => (
            <div key={item.label}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                {item.label}
              </label>
              {editing && !item.readonly && item.field ? (
                <input
                  type={item.type}
                  value={form[item.field]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [item.field!]: e.target.value }))
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-white text-sm px-4 py-2.5 outline-none transition-colors"
                />
              ) : (
                <div className="text-sm font-semibold text-white py-2.5 px-4 rounded-xl bg-white/[0.03] border border-transparent">
                  {item.value}
                </div>
              )}
            </div>
          ))}

          {/* Account Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              ACCOUNT STATUS
            </label>
            <div className="py-2.5 px-4 rounded-xl bg-white/[0.03] border border-transparent">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <BadgeCheck size={14} /> Verified
              </span>
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex justify-end mt-6 gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-5 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-5 py-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Address Book ────────────────────────────────────────────────────

function AddressSection() {
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);

  const setDefault = (id: number) =>
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );

  const remove = (id: number) =>
    setAddresses((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Address Book</h2>
        <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40">
          <Plus size={13} /> Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-2xl bg-[#14121C] border p-5 transition-all ${
              addr.isDefault ? "border-violet-500/40" : "border-white/5"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={14} className="text-violet-400" />
                </div>
                <span className="text-sm font-bold text-white">{addr.label}</span>
              </div>
              {addr.isDefault && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-full border border-violet-500/25">
                  <Check size={9} /> DEFAULT
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {addr.line1}
              {addr.line2 && `, ${addr.line2}`}
              <br />
              {addr.city}, {addr.state} {addr.zip}
              <br />
              {addr.country}
            </p>
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
              <button className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Edit
              </button>
              {!addr.isDefault && (
                <>
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="text-xs text-gray-500 hover:text-white font-medium transition-colors"
                  >
                    Set Default
                  </button>
                  <button
                    onClick={() => remove(addr.id)}
                    className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Add new CTA card */}
        <button className="rounded-2xl border-2 border-dashed border-white/10 p-5 flex flex-col items-center justify-center gap-3 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group min-h-[160px]">
          <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-violet-500/10 flex items-center justify-center transition-colors">
            <Plus size={18} className="text-gray-500 group-hover:text-violet-400" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-violet-400 font-medium transition-colors">
            Add New Address
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Section: Order History ───────────────────────────────────────────────────

function OrdersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Order History</h2>
        <span className="text-xs text-gray-500">{ORDERS.length} orders</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Total Orders", value: ORDERS.length },
          { icon: Check, label: "Delivered", value: ORDERS.filter((o) => o.status === "delivered").length },
          { icon: Clock, label: "In Transit", value: ORDERS.filter((o) => o.status === "shipped" || o.status === "processing").length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#14121C] border border-white/5 p-4 flex flex-col items-center text-center">
            <s.icon size={18} className="text-violet-400 mb-2" />
            <div className="text-2xl font-extrabold text-white">{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {ORDERS.map((order) => {
          const status = STATUS_STYLE[order.status];
          return (
            <div
              key={order.id}
              className="group rounded-2xl bg-[#14121C] border border-white/5 hover:border-violet-500/20 p-4 flex items-center gap-4 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1C1828] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                {order.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-400">{order.id}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5 truncate">
                  {order.productName}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                  <span>{order.date}</span>
                  <span>·</span>
                  <span>{order.items} item{order.items > 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-extrabold text-white">
                  ${order.total.toLocaleString()}
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-violet-400 mt-1 ml-auto transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section: Wishlist ────────────────────────────────────────────────────────

function WishlistSection() {
  const [items, setItems] = useState<WishlistItem[]>(WISHLIST);
  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Wishlist</h2>
        <span className="text-xs text-gray-500">{items.length} items saved</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-[#14121C] border border-white/5">
          <Heart size={40} className="text-gray-700 mb-4" />
          <div className="text-sm font-semibold text-gray-400">Your wishlist is empty</div>
          <div className="text-xs text-gray-600 mt-1">Save items you love to buy later</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 rounded-2xl bg-[#14121C] border border-white/5 hover:border-violet-500/20 p-4 transition-all"
            >
              <div
                className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-3xl"
                style={{
                  background: `linear-gradient(135deg, ${item.bgFrom}, ${item.bgTo})`,
                }}
              >
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-semibold text-white line-clamp-2 group-hover:text-violet-100 transition-colors leading-snug">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-violet-400">
                      ${item.price.toLocaleString()}
                    </span>
                    {item.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        ${item.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {!item.inStock && (
                    <span className="mt-1 inline-block text-[10px] text-red-400 font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {item.inStock && (
                    <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all">
                      <ShoppingBag size={12} /> Add to Cart
                    </button>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-400/30 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection() {
  const [twoFA, setTwoFA] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [notifs, setNotifs] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Security & Privacy</h2>

      {/* Change Password */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock size={14} className="text-violet-400" /> Change Password
        </h3>
        {[
          { label: "Current Password", placeholder: "Enter current password" },
          { label: "New Password", placeholder: "Enter new password" },
          { label: "Confirm New Password", placeholder: "Confirm new password" },
        ].map((f) => (
          <div key={f.label}>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              {f.label}
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-violet-500/60 px-4 py-2.5 transition-colors">
              <input
                type={showPass ? "text" : "password"}
                placeholder={f.placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40">
            Update Password
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 divide-y divide-white/5 overflow-hidden">
        {[
          {
            icon: Smartphone,
            title: "Two-Factor Authentication",
            desc: "Add an extra layer of security to your account",
            value: twoFA,
            set: setTwoFA,
          },
          {
            icon: Bell,
            title: "Login Notifications",
            desc: "Get notified when someone logs in to your account",
            value: notifs,
            set: setNotifs,
          },
        ].map((row) => (
          <div key={row.title} className="flex items-center gap-4 p-5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <row.icon size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{row.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{row.desc}</div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => row.set(!row.value)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                row.value ? "bg-violet-600" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                  row.value ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600">
        🔒 Your data is secured with bank-level encryption. We never share your personal information.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const [section, setSection] = useState<Section>("profile");

  const NAV: {
    id: Section;
    icon: React.FC<{ size?: number; className?: string }>;
    label: string;
  }[] = [
    { id: "profile", icon: User, label: "Profile Info" },
    { id: "address", icon: MapPin, label: "Address Book" },
    { id: "orders", icon: ShoppingBag, label: "Order History" },
    { id: "wishlist", icon: Heart, label: "Wishlist" },
    { id: "security", icon: Shield, label: "Security" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-10">

        {/* Page breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <span className="hover:text-violet-400 cursor-pointer transition-colors">Home</span>
          <ChevronRight size={12} />
          <span className="text-gray-300">My Account</span>
        </div>

        <div className="flex gap-8 items-start">
          {/* ─── Sidebar ─── */}
          <aside className="w-56 shrink-0 sticky top-24 space-y-1">
            {/* User pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#14121C] border border-white/5 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-sm font-extrabold text-white shrink-0">
                {USER.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{USER.name}</div>
                <div className="text-[10px] text-violet-400">{USER.tier}</div>
              </div>
            </div>

            {/* Nav */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 p-2 space-y-0.5">
              {NAV.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={section === item.id}
                  onClick={() => setSection(item.id)}
                />
              ))}
            </div>

            <div className="rounded-2xl bg-[#14121C] border border-white/5 p-2 mt-2">
              <NavItem
                icon={LogOut}
                label="Sign Out"
                onClick={() => {}}
                danger
              />
            </div>
          </aside>

          {/* ─── Content ─── */}
          <main className="flex-1 min-w-0">
            {section === "profile" && <ProfileSection />}
            {section === "address" && <AddressSection />}
            {section === "orders" && <OrdersSection />}
            {section === "wishlist" && <WishlistSection />}
            {section === "security" && <SecuritySection />}
          </main>
        </div>
      </div>
    </div>
  );
}
