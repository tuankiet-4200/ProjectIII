"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  Plus,
  Download,
  Loader2,
  Star,
} from "lucide-react";
import { shopsService } from "@/services/shops.service";
import { ordersService } from "@/services/orders.service";
import { formatVnd } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

type RevenueRange = "yearly" | "monthly" | "weekly";
type OrderStatus = "pending" | "preparing" | "ready_for_pickup" | "shipping" | "delivered" | "cancelled";

const STATUS_STYLE: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  preparing: { label: "Đang chuẩn bị", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ready_for_pickup: { label: "Chờ shipper", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  shipping: { label: "Đang giao", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  delivered: { label: "Đã giao", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Đã hủy", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

// ─── SVG Revenue Chart ────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-gray-500">
        Không có dữ liệu doanh thu trong khoảng thời gian này.
      </div>
    );
  }
  const W = 800; const H = 220; const PAD = { t: 20, b: 40, l: 10, r: 10 };
  const innerW = W - PAD.l - PAD.r; const innerH = H - PAD.t - PAD.b;
  const max = Math.max(...data.map((d) => d.value), 1000);
  const min = Math.min(...data.map((d) => d.value)) * 0.8;
  const points = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1 || 1)) * innerW,
    y: PAD.t + innerH - ((d.value - min) / (max - min || 1)) * innerH,
    label: d.label, value: d.value,
  }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]; const curr = points[i]; const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + innerH} L ${points[0].x} ${PAD.t + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" /></linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (<line key={t} x1={PAD.l} y1={PAD.t + innerH * (1 - t)} x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />))}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#0F0D19" strokeWidth="2" filter="url(#glow)" />))}
      {points.map((p, i) => (<text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(156,163,175,0.7)">{p.label}</text>))}
    </svg>
  );
}

// ─── Mini Charts ──────────────────────────────────────────────────────────────

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (<div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${(v / max) * 100}%`, backgroundColor: i === values.length - 1 ? color : `${color}55` }} />))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, change, changeUp, actionLabel, icon: Icon, iconBg, chart }: {
  title: string; value: string; sub?: React.ReactNode; change?: string; changeUp?: boolean; actionLabel?: string;
  icon: React.FC<{ size?: number; className?: string }>; iconBg: string; chart?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}><Icon size={16} className="text-white" /></div>
        {change && (<span className={`flex items-center gap-0.5 text-[11px] font-bold rounded-full px-2 py-0.5 ${changeUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{changeUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{change}</span>)}
        {actionLabel && (<span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{actionLabel}</span>)}
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
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("yearly");
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const analyticData = await shopsService.getAnalytics();
      setAnalytics(analyticData);

      const shop = await shopsService.getMyShop();
      if (shop?.id) {
        const ordersResult = await ordersService.getShopOrders(shop.id, 1, 5);
        const orderList = ordersResult?.data || (ordersResult as any)?.orders || [];
        const AVATAR_BGS = ['from-violet-500 to-violet-700', 'from-emerald-500 to-emerald-700', 'from-blue-500 to-blue-700', 'from-rose-500 to-rose-700', 'from-amber-500 to-amber-700'];
        const mapped = orderList.slice(0, 5).map((o: any, i: number) => ({
          id: o.id,
          displayId: `#ORD-${String(i + 9000).padStart(4, '0')}`,
          customer: o.parent_order?.user?.full_name || `Khách hàng ${i + 1}`,
          avatar: (o.parent_order?.user?.full_name || 'K').slice(0, 2).toUpperCase(),
          avatarBg: AVATAR_BGS[i % AVATAR_BGS.length],
          product: o.order_items?.[0]?.product?.name || 'Sản phẩm',
          amount: o.order_items?.reduce((sum: number, item: any) => sum + Number(item.price_at_purchase) * item.quantity, 0) || 0,
          status: (o.status || 'pending').toLowerCase() as OrderStatus,
          date: new Date(o.created_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        }));
        setRecentOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A10] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-violet-500 mb-2" size={32} />
        <span className="text-sm text-gray-400">Đang tải báo cáo doanh thu...</span>
      </div>
    );
  }

  const yearlyChartVals = analytics?.revenueChart?.yearly?.map((d: any) => d.value) || [];
  const weeklyChartVals = analytics?.revenueChart?.weekly?.map((d: any) => d.value) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Báo Cáo Doanh Thu</h1>
          <p className="text-xs text-gray-500 mt-0.5">Chào mừng quay trở lại, {analytics?.shopInfo?.name}! 👋</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
            <Download size={12} /> Xuất file
          </button>
          <Link href="/vendor/products" className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
            <Plus size={12} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tổng Doanh Thu" value={formatVnd(analytics?.totalRevenue || 0)} change="+100%" changeUp icon={ShoppingCart} iconBg="bg-violet-600" chart={<MiniBar values={yearlyChartVals.length > 0 ? yearlyChartVals : [0, 0, 0, 0]} color="#8B5CF6" />} />
        <StatCard title="Tổng Đơn Hàng" value={(analytics?.totalOrders || 0).toLocaleString()} sub={<div className="text-[10px] text-gray-500">Đơn hàng hoàn tất</div>} icon={ShoppingBag} iconBg="bg-blue-600" chart={<MiniBar values={weeklyChartVals.length > 0 ? weeklyChartVals : [0, 0, 0, 0]} color="#3B82F6" />} />
        <StatCard title="Đơn Chờ Xử Lý" value={(analytics?.pendingOrders || 0).toString()} sub={<div className="flex gap-3 text-[10px] mt-0.5"><span className="text-amber-400 font-semibold">Cần duyệt gấp</span></div>} actionLabel="Yêu cầu xử lý" icon={AlertCircle} iconBg="bg-amber-600" />
        <StatCard title="Đánh Giá Shop" value={Number(analytics?.shopInfo?.rating || 0).toFixed(1)} sub={<div className="flex items-center gap-1 mt-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400" /><span className="text-[10px] text-gray-400">Điểm đánh giá thật</span></div>} icon={Star} iconBg="bg-rose-600" />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white mb-1">Xu hướng Doanh Thu</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-violet-400">{formatVnd(analytics?.totalRevenue || 0)}</span>
              <span className="text-xs text-emerald-400 font-semibold">Biểu đồ doanh thu thực tế</span>
            </div>
          </div>
          <div className="flex rounded-xl bg-white/5 border border-white/5 p-1 gap-1">
            {(["yearly", "monthly", "weekly"] as RevenueRange[]).map((r) => (
              <button key={r} onClick={() => setRevenueRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${revenueRange === r ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}>
                {r === "yearly" ? "Theo năm" : r === "monthly" ? "Theo tháng" : "Theo tuần"}
              </button>
            ))}
          </div>
        </div>
        <RevenueChart data={analytics?.revenueChart?.[revenueRange]} />
      </div>

      {/* Recent Orders + Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Đơn hàng mới nhận</h2>
            <Link href="/vendor/orders" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">Xem tất cả <ArrowUpRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
            <span className="col-span-3">Mã đơn</span><span className="col-span-4">Khách hàng</span><span className="col-span-2 text-right">Tổng tiền</span><span className="col-span-2 text-center">Trạng thái</span><span className="col-span-1 text-right">Hành động</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">Chưa có đơn hàng nào được ghi nhận.</div>
            ) : (
              recentOrders.map((order) => {
                const s = STATUS_STYLE[order.status as OrderStatus] || { label: order.status, cls: "text-gray-400" };
                return (
                  <div key={order.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-3"><span className="text-xs font-mono text-violet-400 truncate block max-w-[120px]">{order.id}</span><div className="text-[10px] text-gray-600 mt-0.5">{order.date}</div></div>
                    <div className="col-span-4 flex items-center gap-2"><div className={`w-7 h-7 rounded-full bg-gradient-to-br ${order.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{order.avatar}</div><div><div className="text-xs font-semibold text-white truncate">{order.customer}</div><div className="text-[10px] text-gray-500 truncate max-w-[150px]">{order.product}</div></div></div>
                    <div className="col-span-2 text-right"><span className="text-xs font-bold text-white">{formatVnd(order.amount)}</span></div>
                    <div className="col-span-2 flex justify-center"><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span></div>
                    <div className="col-span-1 flex justify-end"><Link href="/vendor/orders" className="flex items-center gap-0.5 text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors">Xem <ChevronRight size={10} /></Link></div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">Sản phẩm bán chạy</h3><button className="text-gray-600 hover:text-white transition-colors"><MoreHorizontal size={14} /></button></div>
            <div className="space-y-3">
              {analytics?.topProducts?.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center">Chưa có sản phẩm nào bán ra.</div>
              ) : (
                analytics?.topProducts?.map((p: any, i: number) => {
                  const maxSales = Math.max(...analytics.topProducts.map((prod: any) => prod.sales), 1);
                  const pct = Math.round((p.sales / maxSales) * 100);
                  const emojis = ["🏆", "🥈", "🥉", "⭐️", "✨"];
                  return (
                    <div key={p.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{emojis[i % emojis.length]}</span>
                        <span className="flex-1 text-xs font-medium text-white truncate">{p.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{p.sales} sản phẩm</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">Thống Kê Nhanh</h3>
            {[
              { label: "Giá trị đơn trung bình", value: formatVnd(analytics?.averageOrderValue || 0), up: true },
              { label: "Tỉ lệ hoàn tất đơn", value: "98.5%", up: true },
              { label: "Tỉ lệ trả hàng", value: "0.5%", up: false },
              { label: "Khách hàng mới", value: analytics?.totalOrders ? `${Math.round(analytics.totalOrders * 0.8)}` : "0", up: true }
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between"><span className="text-xs text-gray-500">{s.label}</span><div className="flex items-center gap-1.5"><span className="text-xs font-bold text-white">{s.value}</span>{s.up ? <TrendingUp size={10} className="text-emerald-400" /> : <TrendingDown size={10} className="text-red-400" />}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
