"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Download,
  Filter,
  Package,
  RefreshCw,
  Server,
  Store,
  Users,
} from "lucide-react";
import api from "@/lib/axios";

type AlertSeverity = "critical" | "warning" | "info";

type AnalyticsResponse = {
  totals: {
    users: number;
    customers: number;
    admins: number;
    shops: number;
    activeShops: number;
    pendingShops: number;
    products: number;
    orders: number;
    gmv: number;
  };
  shopGrowth: { label: string; value: number }[];
  userGrowth: { label: string; value: number }[];
  categoryDistribution: { label: string; value: number; pct: number }[];
  recentOrders: {
    id: string;
    customer: string;
    shop: string;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
  }[];
  alerts: { severity: AlertSeverity; title: string; desc: string }[];
  system: { status: string };
};

const ALERT_STYLE: Record<AlertSeverity, { bg: string; border: string; icon: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400" },
};

const DONUT_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#6B7280"];

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatVnd(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 420;
  const H = 180;
  const PAD = { t: 10, b: 30, l: 10, r: 10 };
  const values = data.length ? data.map((item) => item.value) : [0];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const xScale = (i: number) => PAD.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v: number) => PAD.t + innerH - ((v - min) / Math.max(max - min, 1)) * innerH;
  const points = data.map((item, i) => ({ x: xScale(i), y: yScale(item.value) }));
  const pathD = points.length
    ? points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + point.x) / 2;
        return `${path} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`;
      }, "")
    : "";
  const areaD = points.length ? `${pathD} L ${points[points.length - 1].x} ${PAD.t + innerH} L ${points[0].x} ${PAD.t + innerH} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      <defs>
        <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD.l} y1={PAD.t + innerH * (1 - t)} x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {areaD && <path d={areaD} fill="url(#analyticsAreaGrad)" />}
      {pathD && <path d={pathD} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#8B5CF6" stroke="#0F0D19" strokeWidth="2" />
      ))}
      {data.map((item, i) => (
        <text key={item.label} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(156,163,175,0.65)">
          {item.label}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 420;
  const H = 180;
  const PAD = { t: 10, b: 30, l: 20, r: 20 };
  const max = Math.max(...data.map((item) => item.value), 1);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const gap = innerW / Math.max(data.length, 1);
  const barW = gap * 0.5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      <defs>
        <linearGradient id="analyticsBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD.l} y1={PAD.t + innerH * (1 - t)} x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {data.map((item, i) => {
        const barH = (item.value / max) * innerH;
        const x = PAD.l + gap * i + (gap - barW) / 2;
        const y = PAD.t + innerH - barH;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#analyticsBarGrad)" />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="rgba(156,163,175,0.65)">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, total }: { data: { label: string; value: number; pct: number }[]; total: number }) {
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative w-[180px] h-[180px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        {data.map((item, i) => {
          const dashLength = (item.pct / 100) * circumference;
          const dashOffset = -(accumulated / 100) * circumference;
          accumulated += item.pct;
          return (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">{formatNumber(total)}</span>
        <span className="text-[9px] text-gray-500 font-medium tracking-wider">SẢN PHẨM</span>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const response = await api.get<AnalyticsResponse>("/admin/analytics");
      setAnalytics(response.data);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics().catch(() => setLoading(false));
  }, []);

  const statCards = useMemo(() => {
    const totals = analytics?.totals;
    return [
      {
        label: "TỔNG NGƯỜI DÙNG",
        value: formatNumber(totals?.users || 0),
        sub: `${formatNumber(totals?.customers || 0)} khách hàng · ${formatNumber(totals?.admins || 0)} quản trị viên`,
        icon: Users,
        iconBg: "bg-violet-600/20",
        iconColor: "text-violet-400",
      },
      {
        label: "TỔNG GMV",
        value: formatVnd(totals?.gmv || 0),
        sub: `${formatNumber(totals?.orders || 0)} đơn hàng đã tạo`,
        icon: Activity,
        iconBg: "bg-emerald-600/20",
        iconColor: "text-emerald-400",
      },
      {
        label: "CỬA HÀNG HOẠT ĐỘNG",
        value: formatNumber(totals?.activeShops || 0),
        sub: `${formatNumber(totals?.pendingShops || 0)} cửa hàng chờ duyệt`,
        icon: Store,
        iconBg: "bg-blue-600/20",
        iconColor: "text-blue-400",
      },
      {
        label: "TRẠNG THÁI API",
        value: analytics?.system.status || "Đang kiểm tra",
        sub: "Dữ liệu lấy trực tiếp từ backend",
        icon: Server,
        iconBg: "bg-emerald-600/20",
        iconColor: "text-emerald-400",
        isStatus: true,
      },
    ];
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-[#14121C] border border-white/5 p-10 text-center">
          <RefreshCw size={28} className="text-violet-400 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-400">Đang tải dữ liệu analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-[#14121C] border border-red-500/20 p-10 text-center">
          <AlertCircle size={30} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm text-gray-300">Không tải được dữ liệu analytics.</p>
          <button onClick={fetchAnalytics} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-xs text-gray-500 mt-0.5">Số liệu thật từ người dùng, cửa hàng, sản phẩm và đơn hàng.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
            <Download size={12} /> Xuất báo cáo
          </button>
          <button onClick={fetchAnalytics} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-[#14121C] border border-white/5 p-5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-violet-400/70 mb-1">{card.label}</div>
            <div className={`text-2xl font-extrabold ${card.isStatus ? "text-emerald-400" : "text-white"}`}>{card.value}</div>
            <div className="text-[10px] text-gray-600 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-white">Cửa hàng mới</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">7 ngày gần nhất</p>
            </div>
            <div className="text-xl font-extrabold text-violet-400">{formatNumber(analytics.shopGrowth.reduce((sum, item) => sum + item.value, 0))}</div>
          </div>
          <LineChart data={analytics.shopGrowth} />
        </div>
        <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-white">Người dùng mới</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">4 tuần gần nhất</p>
            </div>
            <div className="text-xl font-extrabold text-violet-400">{formatNumber(analytics.userGrowth.reduce((sum, item) => sum + item.value, 0))}</div>
          </div>
          <BarChart data={analytics.userGrowth} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-2xl bg-[#14121C] border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={14} className="text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Cảnh báo vận hành</h2>
          </div>
          <div className="space-y-3">
            {analytics.alerts.length === 0 ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-300">Không có cảnh báo cần xử lý.</div>
            ) : analytics.alerts.map((alert) => {
              const style = ALERT_STYLE[alert.severity];
              const Icon = alert.severity === "warning" ? AlertTriangle : alert.severity === "info" ? Package : AlertCircle;
              return (
                <div key={alert.title} className={`flex items-start gap-3 p-4 rounded-xl ${style.bg} border ${style.border}`}>
                  <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={style.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{alert.title}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-2xl bg-[#14121C] border border-white/5 p-5">
          <h2 className="text-sm font-bold text-white mb-5">Phân bổ danh mục</h2>
          <div className="flex flex-col items-center">
            <DonutChart data={analytics.categoryDistribution} total={analytics.totals.products} />
            <div className="w-full mt-5 space-y-2.5">
              {analytics.categoryDistribution.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Đơn hàng gần đây</h2>
          <button className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <Filter size={13} />
          </button>
        </div>
        <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
          <span className="col-span-3">Mã đơn</span>
          <span className="col-span-2">Cửa hàng</span>
          <span className="col-span-2">Khách hàng</span>
          <span className="col-span-2 text-right">Giá trị</span>
          <span className="col-span-1 text-center">Thanh toán</span>
          <span className="col-span-2 text-right">Thời gian</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {analytics.recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-gray-500">Chưa có đơn hàng.</div>
          ) : analytics.recentOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3"><span className="text-xs font-mono text-violet-400 font-semibold">{order.id.slice(0, 8)}</span></div>
              <div className="col-span-2"><span className="text-xs text-white font-medium">{order.shop}</span></div>
              <div className="col-span-2"><span className="text-xs text-gray-400">{order.customer}</span></div>
              <div className="col-span-2 text-right"><span className="text-xs font-bold text-white">{formatVnd(order.amount)}</span></div>
              <div className="col-span-1 text-center"><span className="text-[9px] font-bold uppercase text-emerald-400">{order.paymentMethod}</span></div>
              <div className="col-span-2 text-right"><span className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
