"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  Settings,
  Search,
  Bell,
  Star,
  Wifi,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
  LogOut,
  Home,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { shopsService } from "@/services/shops.service";
import type { Shop } from "@/types";

// ─── Nav ──────────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.FC<{ size?: number; className?: string }>; href: string };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { id: "orders",    label: "Orders",    icon: ShoppingBag,    href: "/vendor/orders"    },
  { id: "products",  label: "Products",  icon: Package,        href: "/vendor/products"  },
  { id: "customers", label: "Customers", icon: Users,          href: "/vendor/customers" },
  { id: "coupons",   label: "Coupons",   icon: Ticket,         href: "/vendor/coupons"   },
  { id: "chat",      label: "Chat Inbox",icon: MessageCircle,  href: "/vendor/chat"      },
  { id: "analytics", label: "Analytics", icon: BarChart2,      href: "/vendor/analytics" },
];

function getActiveNavId(pathname: string) {
  if (pathname.startsWith("/vendor/orders"))    return "orders";
  if (pathname.startsWith("/vendor/products"))  return "products";
  if (pathname.startsWith("/vendor/customers")) return "customers";
  if (pathname.startsWith("/vendor/coupons"))   return "coupons";
  if (pathname.startsWith("/vendor/chat"))      return "chat";
  if (pathname.startsWith("/vendor/analytics")) return "analytics";
  return "dashboard";
}

function getBreadcrumbLabel(pathname: string) {
  if (pathname.startsWith("/vendor/orders"))    return "Orders";
  if (pathname.startsWith("/vendor/products"))  return "Products";
  if (pathname.startsWith("/vendor/customers")) return "Customers";
  if (pathname.startsWith("/vendor/coupons"))   return "Coupons";
  if (pathname.startsWith("/vendor/chat"))      return "Chat Inbox";
  if (pathname.startsWith("/vendor/analytics")) return "Analytics";
  return "Dashboard";
}

// ─── Gate States ──────────────────────────────────────────────────────────────

type GateState = "loading" | "allowed" | "no_shop" | "pending" | "rejected" | "banned";

// ─── Pending / Rejected / Banned Screens ─────────────────────────────────────

function FullScreenMessage({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  desc,
  action,
}: {
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0A10] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-6`}>
          <Icon size={36} className={iconColor} />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">{title}</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">{desc}</p>
        {action}
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [gateState, setGateState] = useState<GateState>("loading");
  const [shop, setShop] = useState<Shop | null>(null);
  const [mounted, setMounted] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Step 1: wait one render cycle for Zustand to rehydrate from localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeNavId   = getActiveNavId(pathname);
  const breadcrumbLabel = getBreadcrumbLabel(pathname);

  useEffect(() => {
    // Don't run until Zustand has rehydrated from localStorage
    if (!mounted) return;
    // Not logged in → redirect
    if (!isAuthenticated || !user) {
      router.replace("/login?redirect=/vendor/dashboard&reason=unauthenticated");
      return;
    }

    // ADMIN and SHIPPER → redirect to their own portal
    if (user.role === "ADMIN") {
      router.replace("/admin/analytics");
      return;
    }

    if (user.role === "SHIPPER") {
      router.replace("/login?reason=forbidden");
      return;
    }

    // CUSTOMER → check if they have a shop
    const checkShop = async () => {
      try {
        const myShop = await shopsService.getMyShop();
        setShop(myShop);
        switch (myShop.status) {
          case "ACTIVE":   setGateState("allowed");  break;
          case "PENDING":  setGateState("pending");  break;
          case "REJECTED": setGateState("rejected"); break;
          case "BANNED":   setGateState("banned");   break;
          default:         setGateState("no_shop");  break;
        }
      } catch {
        // 404 or no shop → show register CTA
        setGateState("no_shop");
      }
    };

    checkShop();
  }, [mounted, isAuthenticated, user, router]);

  // ── Loading ──
  if (gateState === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0A10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500">Verifying shop access...</p>
        </div>
      </div>
    );
  }

  // ── No shop registered ──
  if (gateState === "no_shop") {
    return (
      <FullScreenMessage
        icon={Star}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-400"
        title="You don't have a shop yet"
        desc="Register your shop to start selling on ProjectIII. It's free and takes less than 2 minutes to get started."
        action={
          <div className="flex flex-col gap-3">
            <Link
              href="/seller/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all"
            >
              <Star size={14} /> Register Your Shop
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Back to store
            </Link>
          </div>
        }
      />
    );
  }

  // ── Shop pending review ──
  if (gateState === "pending") {
    return (
      <FullScreenMessage
        icon={Clock}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-400"
        title="Your shop is under review"
        desc={`"${shop?.name}" has been submitted and is being reviewed by our team. This usually takes 1–3 business days. We'll notify you by email once approved.`}
        action={
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300 leading-relaxed">
                You will receive an email notification once your shop is approved or if additional information is required.
              </p>
            </div>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to store
            </Link>
          </div>
        }
      />
    );
  }

  // ── Shop rejected ──
  if (gateState === "rejected") {
    return (
      <FullScreenMessage
        icon={XCircle}
        iconBg="bg-red-500/10"
        iconColor="text-red-400"
        title="Shop application rejected"
        desc={`Unfortunately, "${shop?.name}" was not approved. Please contact our support team for more details or apply again with updated information.`}
        action={
          <div className="flex flex-col gap-3">
            <Link
              href="/seller/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-all"
            >
              Apply Again
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Back to store
            </Link>
          </div>
        }
      />
    );
  }

  // ── Shop banned ──
  if (gateState === "banned") {
    return (
      <FullScreenMessage
        icon={XCircle}
        iconBg="bg-red-500/10"
        iconColor="text-red-400"
        title="Your shop has been suspended"
        desc={`"${shop?.name}" has been suspended due to a policy violation. Please contact our support team at support@projectiii.com for assistance.`}
        action={
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all">
            Back to store
          </Link>
        }
      />
    );
  }

  // ── ALLOWED: render full vendor portal ──
  return (
    <div className="flex h-screen bg-[#0B0A10] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-[#0F0D1A]">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Star size={14} className="text-white fill-white" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white">LuxeMarket</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User pill */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(user?.full_name || user?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.full_name || "Vendor"}</div>
              <div className="text-[10px] text-violet-400 truncate">{shop?.name || "My Store"}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="Settings">
                <Settings size={13} />
              </button>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-white/5 bg-[#0F0D1A]/60 backdrop-blur-md shrink-0">
          <h2 className="text-sm font-bold text-white">Vendor Portal</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span>Management</span>
            <span>/</span>
            <span className="text-violet-400">{breadcrumbLabel}</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-colors max-w-xs ml-4">
            <Search size={13} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search orders, products..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <Home size={12} />
              Shopping
            </Link>
            <button className="relative text-gray-500 hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border border-[#0F0D1A] text-[8px] flex items-center justify-center font-bold">5</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <Wifi size={11} /> Store Online
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
