"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { usersService } from "@/services/users.service";
import { ordersService } from "@/services/orders.service";
import type { UserAddress, ParentOrder } from "@/types";
import { wishlistService, WishlistProduct } from "@/services/wishlist.service";
import { useCartStore } from "@/store/useCartStore";
import { getPublicImageUrl } from "@/lib/images";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  Camera,
  Bell,
  LogOut,
  Lock,
  Smartphone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "profile" | "address" | "orders" | "wishlist" | "security";

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Dummy data wrapper function logic
const getAvatar = (name: string) => {
  return name ? name.slice(0, 2).toUpperCase() : "JD";
};

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "Recently";
  const str = String(dateString);
  const d = new Date(str);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
          ? "bg-violet-600 text-foreground shadow-lg shadow-violet-900/40"
          : "text-gray-400 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ─── Section: Profile Info ────────────────────────────────────────────────────

function ProfileSection() {
  const user = useAuthStore((state) => state.user);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Profile Information</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Pencil size={12} />
          {editing ? "Cancel" : "Edit Details"}
        </button>
      </div>

      <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-6">
        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-2xl font-extrabold text-foreground shadow-lg">
              {getAvatar(user.full_name || user.email)}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-[#14121C] flex items-center justify-center hover:bg-violet-500 transition-colors">
              <Camera size={11} className="text-foreground" />
            </button>
          </div>
          <div>
            <div className="text-base font-bold text-foreground">{user.full_name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-violet-400 font-semibold bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                {user.role} Member
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                <BadgeCheck size={10} /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "FULL NAME", field: "name" as const, value: form.name, type: "text" },
            { label: "EMAIL ADDRESS", field: "email" as const, value: form.email, type: "email" },
            { label: "PHONE NUMBER", field: "phone" as const, value: form.phone, type: "tel" },
            { label: "MEMBER SINCE", value: formatDate(user.created_at), type: "text", readonly: true },
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
                  className="w-full rounded-xl bg-foreground/5 border border-white/10 focus:border-violet-500/60 text-foreground text-sm px-4 py-2.5 outline-none transition-colors"
                />
              ) : (
                <div className="text-sm font-semibold text-foreground py-2.5 px-4 rounded-xl bg-foreground/[0.03] border border-transparent">
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
            <div className="py-2.5 px-4 rounded-xl bg-foreground/[0.03] border border-transparent">
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
              className="px-5 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-5 py-2 rounded-xl bg-violet-600 text-sm font-semibold text-foreground hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40"
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
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddr, setNewAddr] = useState({ address_line: "", ward: "", district: "", city: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersService.getAddresses().then(data => {
      setAddresses(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setDefault = async (id: string) => {
    try {
      await usersService.updateAddress(id, { is_default: true });
      const data = await usersService.getAddresses();
      setAddresses(data);
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      await usersService.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {}
  };

  const submitNewAddress = async () => {
    if (!newAddr.address_line || !newAddr.city) return;
    try {
      setSaving(true);
      const addr = await usersService.createAddress({
        ...newAddr,
        is_default: addresses.length === 0
      });
      setAddresses([...addresses, addr]);
      setIsAdding(false);
      setNewAddr({ address_line: "", ward: "", district: "", city: "" });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Address Book</h2>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-foreground hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40">
          <Plus size={13} /> Add New Address
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-card-border bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Add New Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Address Line (e.g. 123 Main St)"
              value={newAddr.address_line}
              onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })}
              className="bg-foreground/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/60 text-foreground transition-colors"
            />
            <input
              type="text"
              placeholder="Ward"
              value={newAddr.ward}
              onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
              className="bg-foreground/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/60 text-foreground transition-colors"
            />
            <input
              type="text"
              placeholder="District"
              value={newAddr.district}
              onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
              className="bg-foreground/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/60 text-foreground transition-colors"
            />
            <input
              type="text"
              placeholder="City"
              value={newAddr.city}
              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
              className="bg-foreground/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/60 text-foreground transition-colors"
            />
          </div>
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-card-border">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-foreground">Cancel</button>
            <button onClick={submitNewAddress} disabled={saving} className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-foreground hover:bg-violet-500 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div className="text-sm text-gray-500 p-4">Loading addresses...</div>}
        {!loading && addresses.length === 0 && <div className="text-sm text-gray-500 p-4 col-span-2 text-center border border-dashed border-card-border rounded-xl py-10">No addresses configued yet. Click 'Add New Address'.</div>}

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-2xl bg-card transition-colors duration-300 border p-5 transition-all ${
              addr.is_default ? "border-violet-500/40" : "border-card-border"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <MapPin size={14} className="text-violet-400" />
                </div>
                <span className="text-sm font-bold text-foreground">{addr.city} Location</span>
              </div>
              {addr.is_default && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-full border border-violet-500/25">
                  <Check size={9} /> DEFAULT
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {addr.address_line}
              <br />
              {addr.ward}, {addr.district}
              <br />
              {addr.city}
            </p>
            <div className="flex gap-3 mt-4 pt-4 border-t border-card-border">
              <button className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Edit
              </button>
              {!addr.is_default && (
                <>
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="text-xs text-gray-500 hover:text-foreground font-medium transition-colors"
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
      </div>
    </div>
  );
}

// ─── Section: Order History ───────────────────────────────────────────────────

function OrdersSection() {
  const router = useRouter();
  const [orders, setOrders] = useState<ParentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    ordersService.getMyOrders().then(res => {
      setOrders(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSelectOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    try {
      await ordersService.getOrderDetail(orderId);
      router.push(`/orders/${orderId}`);
    } catch {
      toast.error("Không thể mở chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Order History</h2>
        <span className="text-xs text-gray-500">{orders.length} orders</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Total Orders", value: orders.length },
          { icon: Check, label: "Paid", value: orders.filter((o) => o.payment_status === "PAID").length },
          { icon: Clock, label: "Unpaid", value: orders.filter((o) => o.payment_status === "UNPAID").length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-4 flex flex-col items-center text-center">
            <s.icon size={18} className="text-violet-400 mb-2" />
            <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {loading ? <div className="text-xs text-gray-500 p-4">Loading your orders...</div> : 
          orders.length === 0 ? <div className="text-sm p-4 text-center border-dashed border border-card-border rounded-xl">No orders found.</div> :
        orders.map((order) => {
          return (
            <div
              key={order.id}
              onClick={() => handleSelectOrder(order.id)}
              className={`group rounded-2xl bg-card transition-colors duration-300 border border-card-border hover:border-violet-500/20 p-4 flex items-center gap-4 transition-all cursor-pointer ${
                selectedOrderId === order.id ? "ring-1 ring-violet-500/30" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#1C1828] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-400">#{order.id.slice(0,8).toUpperCase()}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20`}
                  >
                    {order.payment_status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5 truncate">
                  {order.payment_method} Payment
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                  <span>{formatDate(order.created_at as unknown as string)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-extrabold text-foreground">
                  {Number(order.total_payment).toLocaleString('vi-VN')}₫
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-violet-400 mt-1 ml-auto transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrderId && detailLoading && (
        <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-5">
          <div className="text-sm text-gray-500">Opening order details...</div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Wishlist ────────────────────────────────────────────────────────

function WishlistSection() {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItemToCart = useCartStore((s) => s.addItem);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setItems(data);
    } catch (err) {
      console.error("Failed to load wishlist", err);
      toast.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistService.toggleWishlist(productId);
      setItems((prev) => prev.filter((i) => i.id !== productId));
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } catch {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    try {
      await addItemToCart(product.id, 1);
      toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể thêm vào giỏ hàng");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-violet-500 mb-2" />
        <span className="text-xs text-gray-400">Đang tải danh sách yêu thích...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Sản phẩm yêu thích</h2>
        <span className="text-xs text-gray-500">{items.length} sản phẩm</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-card transition-colors duration-300 border border-card-border">
          <Heart size={40} className="text-gray-700 mb-4" />
          <div className="text-sm font-semibold text-gray-400">Danh sách yêu thích trống</div>
          <div className="text-xs text-gray-600 mt-1">Hãy lưu sản phẩm bạn thích để mua sau</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 rounded-2xl bg-card transition-colors duration-300 border border-card-border hover:border-violet-500/20 p-4 transition-all"
            >
              <Link
                href={`/products/${item.slug}`}
                className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center bg-white border border-card-border overflow-hidden"
              >
                {item.images?.[0] ? (
                  <img
                    src={getPublicImageUrl(item.images[0])}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </Link>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-sm font-semibold text-foreground line-clamp-2 hover:text-violet-500 transition-colors leading-snug"
                  >
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-violet-400">
                      {Number(item.price).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  {item.stock_quantity <= 0 && (
                    <span className="mt-1 inline-block text-[10px] text-red-400 font-semibold">
                      Hết hàng
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {item.stock_quantity > 0 && (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all"
                    >
                      <ShoppingBag size={12} /> Thêm vào giỏ
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="h-7 w-7 rounded-lg border border-card-border flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-400/30 transition-all"
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
      <h2 className="text-lg font-bold text-foreground">Security & Privacy</h2>

      {/* Change Password */}
      <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
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
            <div className="flex items-center gap-2 rounded-xl bg-foreground/5 border border-white/10 focus-within:border-violet-500/60 px-4 py-2.5 transition-colors">
              <input
                type={showPass ? "text" : "password"}
                placeholder={f.placeholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-gray-600 outline-none [&:-webkit-autofill]:[transition-delay:9999s]"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="text-gray-500 hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40">
            Update Password
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border divide-y divide-white/5 overflow-hidden">
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
              <div className="text-sm font-semibold text-foreground">{row.title}</div>
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<Section>("profile");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login"); // enforce auth constraint
    } else {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setSection(tab as Section);
    }
  }, [isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background transition-colors duration-300 text-foreground">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-10">

        {/* Page breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-violet-400 cursor-pointer transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300">My Account</span>
        </div>

        <div className="flex gap-8 items-start">
          {/* ─── Sidebar ─── */}
          <aside className="w-56 shrink-0 sticky top-24 space-y-1">
            {/* User pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card transition-colors duration-300 border border-card-border mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-sm font-extrabold text-foreground shrink-0">
                {getAvatar(user.full_name || user.email)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground truncate">{user.full_name}</div>
                <div className="text-[10px] text-violet-400 capitalize">{user.role} Member</div>
              </div>
            </div>

            {/* Nav */}
            <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-2 space-y-0.5">
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

            <div className="rounded-2xl bg-card transition-colors duration-300 border border-card-border p-2 mt-2">
              <NavItem
                icon={LogOut}
                label="Sign Out"
                onClick={() => router.push("/logout")}
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
