"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  Store,
  Server,
  Download,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Shield,
  Package,
  ExternalLink,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertSeverity = "critical" | "warning" | "info";
type TxnStatus = "success" | "pending" | "declined";

// ─── Data ────────────────────────────────────────────────────────────────────

const SYSTEM_ALERTS: {
  title: string;
  desc: string;
  time: string;
  severity: AlertSeverity;
  icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  {
    title: "Flagged Vendor: TechNexus Ltd",
    desc: "High volume of chargebacks detected. Risk score 88/100. Manual review required.",
    time: "2 min ago",
    severity: "critical",
    icon: AlertCircle,
  },
  {
    title: "Low-Stock Warning: Global Electronics",
    desc: 'Tier-1 partner "Global Electronics" has 12 items below safety threshold.',
    time: "45 min ago",
    severity: "warning",
    icon: Package,
  },
  {
    title: "Security Patch v4.2 Deployment",
    desc: "Maintenance window scheduled for UTC 02:00. Estimated downtime: 4 minutes.",
    time: "2 hours ago",
    severity: "info",
    icon: Shield,
  },
];

const ALERT_STYLE: Record<AlertSeverity, { bg: string; border: string; icon: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/20", icon: "text-red-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400" },
};

const TRANSACTIONS: {
  id: string;
  vendor: string;
  customer: string;
  amount: number;
  status: TxnStatus;
  node: string;
}[] = [
  { id: "TXN-9421-XB", vendor: "Urban Loft Styles", customer: "Sarah Jenkins", amount: 452.0, status: "success", node: "US-EAST-1" },
  { id: "TXN-8810-QC", vendor: "Pixel Perfect Gear", customer: "Michael Ross", amount: 1299.99, status: "success", node: "EU-WEST-2" },
  { id: "TXN-7254-LY", vendor: "Home Bloom Inc", customer: "Elena Gilbert", amount: 89.5, status: "pending", node: "AP-SOUTH-1" },
  { id: "TXN-1102-PP", vendor: "Swift Auto Parts", customer: "David Gahan", amount: 234.12, status: "declined", node: "US-WEST-2" },
  { id: "TXN-6633-MK", vendor: "NovaTech Hub", customer: "Lisa Chen", amount: 1875.0, status: "success", node: "US-EAST-1" },
  { id: "TXN-5501-RT", vendor: "Artisan Crafts Co", customer: "James Park", amount: 67.25, status: "success", node: "EU-WEST-1" },
];

const TXN_STATUS_STYLE: Record<TxnStatus, { label: string; cls: string }> = {
  success: { label: "Success", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  declined: { label: "Declined", cls: "bg-red-500/15 text-red-400 border-red-500/20" },
};

const VENDOR_DISTRIBUTION = [
  { label: "Electronics", pct: 42, color: "#8B5CF6" },
  { label: "Fashion & Apparels", pct: 28, color: "#3B82F6" },
  { label: "Home & Living", pct: 15, color: "#F59E0B" },
  { label: "Other", pct: 15, color: "#6B7280" },
];

// ─── SVG Chart Components ─────────────────────────────────────────────────────

function ShopGrowthChart() {
  const data = [320, 380, 350, 420, 480, 410, 360];
  const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const W = 420; const H = 180;
  const PAD = { t: 10, b: 30, l: 10, r: 10 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = Math.max(...data);
  const min = Math.min(...data) * 0.85;
  const xScale = (i: number) => PAD.l + (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => PAD.t + innerH - ((v - min) / (max - min)) * innerH;
  const points = data.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]; const curr = points[i]; const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + innerH} L ${points[0].x} ${PAD.t + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      <defs>
        <linearGradient id="shopAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.20" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" /></linearGradient>
        <linearGradient id="shopLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
        <filter id="shopGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (<line key={t} x1={PAD.l} y1={PAD.t + innerH * (1 - t)} x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />))}
      <path d={areaD} fill="url(#shopAreaGrad)" />
      <path d={pathD} fill="none" stroke="url(#shopLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#shopGlow)" />
      {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#8B5CF6" stroke="#0F0D19" strokeWidth="2" filter="url(#shopGlow)" />))}
      {labels.map((label, i) => (<text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(156,163,175,0.5)">{label}</text>))}
    </svg>
  );
}

function RegisteredUsersChart() {
  const data = [580, 720, 810, 850];
  const labels = ["WEEK 1", "WEEK 2", "WEEK 3", "WEEK 4"];
  const W = 420; const H = 180;
  const PAD = { t: 10, b: 30, l: 20, r: 20 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = Math.max(...data) * 1.1;
  const barW = innerW / data.length * 0.5;
  const gap = innerW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" /><stop offset="100%" stopColor="#6D28D9" stopOpacity="0.4" /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (<line key={t} x1={PAD.l} y1={PAD.t + innerH * (1 - t)} x2={W - PAD.r} y2={PAD.t + innerH * (1 - t)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />))}
      {data.map((v, i) => {
        const barH = (v / max) * innerH; const x = PAD.l + gap * i + (gap - barW) / 2; const y = PAD.t + innerH - barH;
        return (<g key={i}><rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#barGrad)" /><text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="rgba(156,163,175,0.5)">{labels[i]}</text></g>);
      })}
    </svg>
  );
}

function DonutChart() {
  const size = 180; const strokeWidth = 22; const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius; const cx = size / 2; const cy = size / 2;
  let accumulated = 0;
  const segments = VENDOR_DISTRIBUTION.map((seg) => { const start = accumulated; accumulated += seg.pct; return { ...seg, start, end: accumulated }; });
  return (
    <div className="relative w-[180px] h-[180px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const dashLength = (seg.pct / 100) * circumference; const dashOffset = -(seg.start / 100) * circumference;
          return (<circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${dashLength} ${circumference - dashLength}`} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />);
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">12.1k</span>
        <span className="text-[9px] text-gray-500 font-medium tracking-wider">VENDORS</span>
      </div>
    </div>
  );
}

// ─── System Health ────────────────────────────────────────────────────────────

function SystemHealth() {
  return (
    <div className="fixed bottom-5 left-[240px] z-40">
      <div className="flex items-center gap-3 bg-[#14121C] border border-white/5 rounded-2xl px-4 py-3 shadow-xl shadow-black/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">System Health</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
        </div>
        <div className="border-l border-white/10 pl-3 ml-1">
          <p className="text-[10px] text-gray-500 leading-tight">All nodes operating within</p>
          <p className="text-[10px] text-gray-500 leading-tight">normal parameters.</p>
          <div className="mt-1.5 h-1 w-20 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-[92%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [syncing, setSyncing] = useState(false);
  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SYSTEM OVERVIEW</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real-time marketplace telemetry and global ecosystem health.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
              <Download size={12} /> Export Report
            </button>
            <button onClick={handleSync} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} /> Sync Data
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "TOTAL USERS", value: "862.000", sub: "850k Khách hàng · 12k Nhà bán", change: "+5.2%", icon: Users, iconBg: "bg-violet-600/20", iconColor: "text-violet-400" },
            { label: "TỔNG GMV", value: "31 tỷ ₫", sub: "Doanh thu ròng sau hoa hồng", change: "+12.8%", icon: Activity, iconBg: "bg-emerald-600/20", iconColor: "text-emerald-400" },
            { label: "ACTIVE SHOPS", value: "10,200", sub: null, change: "+3.1%", icon: Store, iconBg: "bg-blue-600/20", iconColor: "text-blue-400" },
            { label: "SERVER STATUS", value: "Healthy", sub: "Response: 42ms | Load: 12%", change: "100% UP", icon: Server, iconBg: "bg-emerald-600/20", iconColor: "text-emerald-400", isStatus: true },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl bg-[#14121C] border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}><card.icon size={18} className={card.iconColor} /></div>
                <span className="text-[11px] font-bold text-emerald-400">{card.change}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-violet-400/70 mb-1">{card.label}</div>
              <div className={`text-2xl font-extrabold ${'isStatus' in card && card.isStatus ? "text-emerald-400" : "text-white"}`}>{card.value}</div>
              {card.sub && <div className="text-[10px] text-gray-600 mt-1">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-start justify-between mb-1">
              <div><h2 className="text-sm font-bold text-white">New Shops Growth</h2><p className="text-[10px] text-gray-500 mt-0.5">Last 7 days performance</p></div>
              <div className="text-right"><div className="text-xl font-extrabold text-violet-400">1,240</div><span className="text-[10px] font-bold text-emerald-400">+8.4% WoW</span></div>
            </div>
            <ShopGrowthChart />
          </div>
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-start justify-between mb-1">
              <div><h2 className="text-sm font-bold text-white">Registered Users</h2><p className="text-[10px] text-gray-500 mt-0.5">Monthly scale overview</p></div>
              <div className="text-right"><div className="text-xl font-extrabold text-violet-400">850k</div><span className="text-[10px] font-bold text-emerald-400">+12.1% MoM</span></div>
            </div>
            <RegisteredUsersChart />
          </div>
        </div>

        {/* Alerts + Vendor Distribution */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /><h2 className="text-xs font-bold text-white uppercase tracking-wider">Critical System Alerts</h2></div>
              <button className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">View All Notifications <ExternalLink size={10} /></button>
            </div>
            <div className="space-y-3">
              {SYSTEM_ALERTS.map((alert, idx) => {
                const style = ALERT_STYLE[alert.severity];
                return (
                  <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl ${style.bg} border ${style.border} hover:border-opacity-40 transition-all cursor-pointer group`}>
                    <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}><alert.icon size={14} className={style.icon} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">{alert.title}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{alert.desc}</p>
                    </div>
                    <span className="text-[9px] text-gray-600 shrink-0 mt-1">{alert.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-span-5 rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <h2 className="text-sm font-bold text-white mb-5">Vendor Distribution</h2>
            <div className="flex flex-col items-center">
              <DonutChart />
              <div className="w-full mt-5 space-y-2.5">
                {VENDOR_DISTRIBUTION.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-gray-400">{item.label}</span></div>
                    <span className="text-xs font-bold text-white">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Transaction Log */}
        <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Global Transaction Log</h2>
            <button className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><Filter size={13} /></button>
          </div>
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
            <span className="col-span-2">Transaction ID</span><span className="col-span-3">Vendor</span><span className="col-span-2">Customer</span><span className="col-span-2 text-right">Amount</span><span className="col-span-1 text-center">Status</span><span className="col-span-2 text-right">Node</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {TRANSACTIONS.map((txn) => {
              const s = TXN_STATUS_STYLE[txn.status];
              return (
                <div key={txn.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="col-span-2"><span className="text-xs font-mono text-violet-400 font-semibold">{txn.id}</span></div>
                  <div className="col-span-3"><span className="text-xs text-white font-medium">{txn.vendor}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-400">{txn.customer}</span></div>
                  <div className="col-span-2 text-right"><span className="text-xs font-bold text-white">{txn.amount.toLocaleString('vi-VN')}₫</span></div>
                  <div className="col-span-1 flex justify-center"><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span></div>
                  <div className="col-span-2 text-right"><span className="text-[10px] font-mono text-gray-500">{txn.node}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SystemHealth />
    </>
  );
}
