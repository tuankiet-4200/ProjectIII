"use client";

import { usePathname } from "next/navigation";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  href: string;
};

// ─── Navigation Data ─────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/vendor/orders" },
  { id: "products", label: "Products", icon: Package, href: "/vendor/products" },
  { id: "customers", label: "Customers", icon: Users, href: "/vendor/customers" },
  { id: "analytics", label: "Analytics", icon: BarChart2, href: "/vendor/analytics" },
];

function getActiveNavId(pathname: string): string {
  if (pathname.startsWith("/vendor/orders")) return "orders";
  if (pathname.startsWith("/vendor/products")) return "products";
  if (pathname.startsWith("/vendor/customers")) return "customers";
  if (pathname.startsWith("/vendor/analytics")) return "analytics";
  if (pathname.startsWith("/vendor/dashboard")) return "dashboard";
  return "dashboard";
}

function getBreadcrumbLabel(pathname: string): string {
  if (pathname.startsWith("/vendor/orders")) return "Orders";
  if (pathname.startsWith("/vendor/products")) return "Products";
  if (pathname.startsWith("/vendor/customers")) return "Customers";
  if (pathname.startsWith("/vendor/analytics")) return "Analytics";
  if (pathname.startsWith("/vendor/dashboard")) return "Dashboard";
  return "Dashboard";
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);
  const breadcrumbLabel = getBreadcrumbLabel(pathname);

  return (
    <div className="flex h-screen bg-[#0B0A10] text-white overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-[#0F0D1A]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Star size={14} className="text-white fill-white" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white">LuxeMarket</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
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
              AS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Alex Sterling</div>
              <div className="text-[10px] text-violet-400">Premium Merchant</div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <Settings size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
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
            <button className="relative text-gray-500 hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border border-[#0F0D1A] text-[8px] flex items-center justify-center font-bold">
                5
              </span>
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
