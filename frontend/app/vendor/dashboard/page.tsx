"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Star,
  ArrowUpRight,
  Wifi,
  Plus,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.FC<{ size?: number; className?: string }>; href: string };
type RevenueRange = "yearly" | "monthly" | "weekly";
type OrderStatus = "completed" | "processing" | "shipped" | "cancelled";

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/vendor/orders" },
  { id: "products", label: "Products", icon: Package, href: "/vendor/products" },
  { id: "customers", label: "Customers", icon: Users, href: "/vendor/customers" },
  { id: "analytics", label: "Analytics", icon: BarChart2, href: "/vendor/analytics" },
];

const RECENT_ORDERS = [
  { id: "#ORD-7829", customer: "Sarah Jenkins", avatar: "SJ", avatarBg: "from-violet-500 to-violet-700", amount: 1250, status: "completed" as OrderStatus, product: "MacBook Pro 16\"", date: "Mar 20, 2026" },
  { id: "#ORD-7828", customer: "Marcus Lin", avatar: "ML", avatarBg: "from-blue-500 to-blue-700", amount: 349, status: "processing" as OrderStatus, product: "Sony WH-1000XM5", date: "Mar 20, 2026" },
  { id: "#ORD-7827", customer: "Elena Rossi", avatar: "ER", avatarBg: "from-rose-500 to-rose-700", amount: 4200, status: "shipped" as OrderStatus, product: "Reference Monitor Speaker", date: "Mar 19, 2026" },
  { id: "#ORD-7826", customer: "Tom Archer", avatar: "TA", avatarBg: "from-amber-500 to-amber-700", amount: 99, status: "completed" as OrderStatus, product: "Logitech MX Master 3S", date: "Mar 19, 2026" },
  { id: "#ORD-7825", customer: "Priya Mehta", avatar: "PM", avatarBg: "from-emerald-500 to-emerald-700", amount: 680, status: "cancelled" as OrderStatus, product: "Crystalline IEM", date: "Mar 18, 2026" },
];

const STATUS_STYLE: Record<OrderStatus, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  processing: { label: "Processing", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  shipped: { label: "Shipped", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

// Revenue chart data (monthly values in $k)
const CHART_DATA: Record<RevenueRange, { label: string; value: number }[]> = {
  yearly: [
    { label: "Jan", value: 45 }, { label: "Feb", value: 52 }, { label: "Mar", value: 49 },
    { label: "Apr", value: 63 }, { label: "May", value: 58 }, { label: "Jun", value: 72 },
    { label: "Jul", value: 68 }, { label: "Aug", value: 85 }, { label: "Sep", value: 91 },
    { label: "Oct", value: 78 }, { label: "Nov", value: 95 }, { label: "Dec", value: 128 },
  ],
  monthly: [
    { label: "W1", value: 28 }, { label: "W2", value: 34 }, { label: "W3", value: 31 }, { label: "W4", value: 35 },
  ],
  weekly: [
    { label: "Mon", value: 12 }, { label: "Tue", value: 18 }, { label: "Wed", value: 14 },
    { label: "Thu", value: 21 }, { label: "Fri", value: 26 }, { label: "Sat", value: 19 }, { label: "Sun", value: 9 },
  ],
};

// ─── SVG Revenue Chart ────────────────────────────────────────────────────────

function RevenueChart({ range }: { range: RevenueRange }) {
  const data = CHART_DATA[range];
  const W = 800; const H = 220; const PAD = { t: 20, b: 40, l: 10, r: 10 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = 0;

  const xScale = (i: number) => PAD.l + (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => PAD.t + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.value), ...d }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + innerH} L ${points[0].x} ${PAD.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t}
          x1={PAD.l} y1={PAD.t + innerH * (1 - t)}
          x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#0B0A10" strokeWidth="2" filter="url(#glow)" />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(156,163,175,0.7)">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Mini Bar Sparkline ───────────────────────────────────────────────────────

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: i === values.length - 1 ? color : `${color}55`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Mini Line Sparkline ──────────────────────────────────────────────────────

function MiniLine({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const W = 100; const H = 32;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / (max - min + 1)) * H;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-24 h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  change,
  changeUp,
  actionLabel,
  icon: Icon,
  iconBg,
  chart,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  change?: string;
  changeUp?: boolean;
  actionLabel?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  chart?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className="text-white" />
        </div>
        {change && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold rounded-full px-2 py-0.5 ${changeUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {changeUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change}
          </span>
        )}
        {actionLabel && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {actionLabel}
          </span>
        )}
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-1">{title}</div>
        <div className="text-2xl font-extrabold text-white">{value}</div>
        {sub && <div className="mt-1">{sub}</div>}
      </div>

      {chart && <div>{chart}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("yearly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B0A10] text-white overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside className={`shrink-0 flex flex-col border-r border-white/5 bg-[#0F0D1A] transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-52"}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Star size={14} className="text-white fill-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-extrabold tracking-tight text-white">LuxeMarket</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeNav === item.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={16} className="shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User pill */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
              AS
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">Alex Sterling</div>
                <div className="text-[10px] text-violet-400">Premium Merchant</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button className="text-gray-500 hover:text-white transition-colors">
                <Settings size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-white/5 bg-[#0F0D1A]/60 backdrop-blur-md shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-500 hover:text-white transition-colors mr-1"
          >
            <LayoutDashboard size={16} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-colors max-w-xs">
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-white">Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Friday, March 20, 2026 · Welcome back, Alex! 👋</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
                <Download size={12} /> Export
              </button>
              <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
                <Plus size={12} /> Add Product
              </button>
            </div>
          </div>

          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Sales"
              value="$128,450"
              change="+12.5%"
              changeUp
              icon={ShoppingCart}
              iconBg="bg-violet-600"
              chart={<MiniBar values={[35, 42, 38, 55, 48, 60, 72, 65, 80, 70, 90, 128]} color="#8B5CF6" />}
            />
            <StatCard
              title="Total Orders"
              value="1,240"
              sub={<div className="text-[10px] text-gray-500">Monthly Target</div>}
              icon={ShoppingBag}
              iconBg="bg-blue-600"
              chart={<MiniBar values={[80, 95, 88, 105, 98, 120, 112, 130, 115, 125, 118, 128]} color="#3B82F6" />}
            />
            <StatCard
              title="Pending Orders"
              value="18"
              sub={
                <div className="flex gap-3 text-[10px] mt-0.5">
                  <span className="text-red-400 font-semibold">8 Priority</span>
                  <span className="text-gray-500">10 Regular</span>
                </div>
              }
              actionLabel="Action Required"
              icon={AlertCircle}
              iconBg="bg-amber-600"
            />
            <StatCard
              title="Store Views"
              value="45.2k"
              change="+18.3%"
              changeUp
              icon={Eye}
              iconBg="bg-rose-600"
              chart={<MiniLine values={[20, 28, 24, 32, 30, 38, 35, 42, 45]} color="#F43F5E" />}
            />
          </div>

          {/* ─── Revenue Chart ─── */}
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-sm font-bold text-white mb-1">Monthly Revenue</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-violet-400">$128,450.00</span>
                  <span className="text-xs text-emerald-400 font-semibold">+15.2% vs last year</span>
                </div>
              </div>
              <div className="flex rounded-xl bg-white/5 border border-white/5 p-1 gap-1">
                {(["yearly", "monthly", "weekly"] as RevenueRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRevenueRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      revenueRange === r ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <RevenueChart range={revenueRange} />
          </div>

          {/* ─── Recent Orders + Quick Stats row ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Recent Orders table */}
            <div className="xl:col-span-2 rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-white">Recent Orders</h2>
                <Link href="/vendor/orders" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  See all activity <ArrowUpRight size={12} />
                </Link>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
                <span className="col-span-3">Order ID</span>
                <span className="col-span-4">Customer</span>
                <span className="col-span-2 text-right">Amount</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-1 text-right">Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.03]">
                {RECENT_ORDERS.map((order) => {
                  const s = STATUS_STYLE[order.status];
                  return (
                    <div key={order.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-3">
                        <span className="text-xs font-mono text-violet-400">{order.id}</span>
                        <div className="text-[10px] text-gray-600 mt-0.5">{order.date}</div>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${order.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                          {order.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white truncate">{order.customer}</div>
                          <div className="text-[10px] text-gray-500 truncate">{order.product}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-white">${order.amount.toLocaleString()}.00</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button className="flex items-center gap-0.5 text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                          View <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column quick panels */}
            <div className="space-y-4">
              {/* Top Products */}
              <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Top Products</h3>
                  <button className="text-gray-600 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Eclipse Gen-2 Headphones", sales: 342, pct: 88, emoji: "🎧" },
                    { name: "Lunar Series Watch", sales: 218, pct: 64, emoji: "⌚" },
                    { name: "Velvet Vocal Mic C-99", sales: 176, pct: 52, emoji: "🎤" },
                    { name: "NanoFi Wireless DAC", sales: 134, pct: 38, emoji: "⚡" },
                  ].map((p, i) => (
                    <div key={p.name}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{p.emoji}</span>
                        <span className="flex-1 text-xs font-medium text-white truncate">{p.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{p.sales}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white mb-2">Quick Stats</h3>
                {[
                  { label: "Avg. Order Value", value: "$103.60", up: true },
                  { label: "Conversion Rate", value: "3.24%", up: true },
                  { label: "Return Rate", value: "1.8%", up: false },
                  { label: "New Customers", value: "284", up: true },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{s.value}</span>
                      {s.up ? (
                        <TrendingUp size={10} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={10} className="text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
