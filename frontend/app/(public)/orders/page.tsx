"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Package,
  Truck,
  Clock,
  Check,
  XCircle,
  MapPin,
  Navigation,
  Phone,
  Star,
  ChevronRight,
  ChevronDown,
  Filter,
  Plus,
  Minus,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "in_transit" | "pending" | "shipping" | "delivered" | "cancelled";
type HistoryTab = "active" | "all";

interface TrackingEvent {
  id: number;
  title: string;
  location: string;
  time: string;
  date: string;
  done: boolean;
  current?: boolean;
}

interface Order {
  id: string;
  shortId: string;
  productName: string;
  variant: string;
  price: number;
  qty: number;
  emoji: string;
  status: OrderStatus;
  statusLabel: string;
  estimate: string;
  shopName: string;
  carrier: string;
  shippingService: string;
  weight: string;
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  driver?: {
    name: string;
    rating: number;
    vehicle: string;
    avatar: string;
  };
  events: TrackingEvent[];
  date: string;
  total: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ORDERS: Order[] = [
  {
    id: "#ORD-0921-A",
    shortId: "0921-A",
    productName: "MacBook Pro 16\" — Space Black",
    variant: "M3 Max, 48GB RAM, 1TB SSD",
    price: 3499,
    qty: 1,
    emoji: "💻",
    status: "in_transit",
    statusLabel: "IN TRANSIT",
    estimate: "Today, 4:00 PM",
    shopName: "Apple Premium Reseller",
    carrier: "FedEx Intl",
    shippingService: "Express Priority",
    weight: "2.4 kg",
    destination: {
      name: "Jane Doe",
      address: "215 Market Street, Suite 300",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    driver: {
      name: "David Thompson",
      rating: 4.9,
      vehicle: "Van #209",
      avatar: "DT",
    },
    events: [
      {
        id: 1,
        title: "Out for Delivery",
        location: "San Francisco Distribution Center",
        time: "08:50 AM",
        date: "Today",
        done: false,
        current: true,
      },
      {
        id: 2,
        title: "Arrived at Local Facility",
        location: "San Francisco, CA",
        time: "08:15 AM",
        date: "Today",
        done: true,
      },
      {
        id: 3,
        title: "Package Picked Up",
        location: "Warehouse Hub",
        time: "04:10 PM",
        date: "Yesterday",
        done: true,
      },
      {
        id: 4,
        title: "Order Packed",
        location: "Inventory Section B",
        time: "11:00 AM",
        date: "Yesterday",
        done: true,
      },
    ],
    date: "Mar 20, 2026",
    total: 3499,
  },
  {
    id: "#ORD-0833-B",
    shortId: "0833-B",
    productName: "Sony WH-1000XM5 Headphones",
    variant: "Midnight Black",
    price: 349,
    qty: 1,
    emoji: "🎧",
    status: "pending",
    statusLabel: "PENDING",
    estimate: "Awaiting warehouse pickup",
    shopName: "AudioTech Store",
    carrier: "DHL Express",
    shippingService: "Standard",
    weight: "0.8 kg",
    destination: {
      name: "Jane Doe",
      address: "215 Market Street, Suite 300",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    events: [
      {
        id: 1,
        title: "Order Confirmed",
        location: "AudioTech Warehouse",
        time: "09:00 AM",
        date: "Today",
        done: true,
      },
      {
        id: 2,
        title: "Awaiting Pickup",
        location: "Inventory",
        time: "—",
        date: "Pending",
        done: false,
        current: true,
      },
    ],
    date: "Mar 20, 2026",
    total: 349,
  },
  {
    id: "#ORD-7742-B",
    shortId: "7742-B",
    productName: "Logitech MX Master 3S",
    variant: "Space Grey",
    price: 99,
    qty: 1,
    emoji: "🖱️",
    status: "shipping",
    statusLabel: "SHIPPING",
    estimate: "Expected in 2 days",
    shopName: "TechHub Official",
    carrier: "UPS",
    shippingService: "Ground",
    weight: "0.4 kg",
    destination: {
      name: "Jane Doe",
      address: "215 Market Street, Suite 300",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    events: [
      {
        id: 1,
        title: "In Transit to Hub",
        location: "Los Angeles Sorting Facility",
        time: "02:30 PM",
        date: "Yesterday",
        done: false,
        current: true,
      },
      {
        id: 2,
        title: "Shipped from Warehouse",
        location: "TechHub Warehouse, LA",
        time: "10:00 AM",
        date: "Yesterday",
        done: true,
      },
      {
        id: 3,
        title: "Order Packed",
        location: "Fulfillment Center",
        time: "08:00 AM",
        date: "2 days ago",
        done: true,
      },
    ],
    date: "Mar 19, 2026",
    total: 99,
  },
  {
    id: "#ORD-6610-C",
    shortId: "6610-C",
    productName: "Vintage Walnut Turntable Pro",
    variant: "Walnut Brown",
    price: 2850,
    qty: 1,
    emoji: "🎵",
    status: "delivered",
    statusLabel: "DELIVERED",
    estimate: "Delivered Mar 15, 2026",
    shopName: "Heritage HiFi",
    carrier: "FedEx",
    shippingService: "Priority Overnight",
    weight: "5.2 kg",
    destination: {
      name: "Jane Doe",
      address: "215 Market Street, Suite 300",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    events: [
      {
        id: 1,
        title: "Delivered",
        location: "Front Door",
        time: "01:45 PM",
        date: "Mar 15",
        done: true,
      },
      {
        id: 2,
        title: "Out for Delivery",
        location: "SF Distribution Center",
        time: "08:00 AM",
        date: "Mar 15",
        done: true,
      },
      {
        id: 3,
        title: "Arrived at Facility",
        location: "San Francisco, CA",
        time: "04:00 AM",
        date: "Mar 15",
        done: true,
      },
    ],
    date: "Mar 10, 2026",
    total: 2850,
  },
  {
    id: "#ORD-5528-D",
    shortId: "5528-D",
    productName: "Velocita Performance Pro Sneaker",
    variant: "Crimson Red, US 10",
    price: 155,
    qty: 1,
    emoji: "👟",
    status: "cancelled",
    statusLabel: "CANCELLED",
    estimate: "Cancelled by user",
    shopName: "LUXE Footwear",
    carrier: "—",
    shippingService: "—",
    weight: "0.9 kg",
    destination: {
      name: "Jane Doe",
      address: "215 Market Street, Suite 300",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "United States",
    },
    events: [
      {
        id: 1,
        title: "Order Cancelled",
        location: "System",
        time: "11:30 AM",
        date: "Mar 12",
        done: true,
      },
    ],
    date: "Mar 11, 2026",
    total: 155,
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<
  OrderStatus,
  { label: string; cls: string; dot: string; icon: React.FC<{ size?: number; className?: string }> }
> = {
  in_transit: {
    label: "IN TRANSIT",
    cls: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    dot: "bg-violet-400",
    icon: Truck,
  },
  pending: {
    label: "PENDING",
    cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    icon: Clock,
  },
  shipping: {
    label: "SHIPPING",
    cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
    icon: Package,
  },
  delivered: {
    label: "DELIVERED",
    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    icon: Check,
  },
  cancelled: {
    label: "CANCELLED",
    cls: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-400",
    icon: XCircle,
  },
};

// ─── Mock Map ─────────────────────────────────────────────────────────────────

function MockMap({ order }: { order: Order }) {
  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-[#111827] border border-white/5">
      {/* Grid lines mimicking map tiles */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4B5563" strokeWidth="0.5" />
          </pattern>
          <pattern id="bigGrid" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="url(#grid)" />
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#6B7280" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bigGrid)" />
        {/* Road lines */}
        <line x1="0" y1="80" x2="100%" y2="80" stroke="#374151" strokeWidth="4" />
        <line x1="0" y1="140" x2="100%" y2="140" stroke="#374151" strokeWidth="3" />
        <line x1="200" y1="0" x2="200" y2="100%" stroke="#374151" strokeWidth="4" />
        <line x1="380" y1="0" x2="380" y2="100%" stroke="#374151" strokeWidth="3" />
        <line x1="100" y1="0" x2="100" y2="100%" stroke="#374151" strokeWidth="2" />
        {/* Road highlights */}
        <line x1="0" y1="80" x2="100%" y2="80" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="8 4" />
      </svg>

      {/* Route path */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
          </linearGradient>
        </defs>
        <polyline
          points="50,140 100,140 100,80 200,80 280,80 380,80 380,50 450,50"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 3"
        />
      </svg>

      {/* Start marker */}
      <div className="absolute top-[60px] left-[44px] flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-500/50" />
        <span className="text-[9px] text-emerald-400 mt-0.5 whitespace-nowrap font-bold">WAREHOUSE</span>
      </div>

      {/* Vehicle marker */}
      {order.driver && (
        <div className="absolute top-[60px] left-[255px] flex flex-col items-center -translate-x-1/2">
          <div className="w-8 h-8 rounded-full bg-violet-600 border-2 border-white shadow-xl shadow-violet-500/50 flex items-center justify-center">
            <Truck size={14} className="text-white" />
          </div>
          <div className="mt-1 bg-[#1C1828] border border-violet-500/40 rounded-lg px-2 py-0.5 text-[9px] text-violet-300 whitespace-nowrap font-semibold shadow-lg">
            {order.driver.vehicle} · Out for delivery
          </div>
        </div>
      )}

      {/* Destination marker */}
      <div className="absolute top-[22px] right-[58px] flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-white shadow-lg shadow-red-500/50" />
        <span className="text-[9px] text-red-400 mt-0.5 whitespace-nowrap font-bold">DESTINATION</span>
      </div>

      {/* Map controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button className="w-7 h-7 rounded-lg bg-[#1C1828]/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <Plus size={12} />
        </button>
        <button className="w-7 h-7 rounded-lg bg-[#1C1828]/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <Minus size={12} />
        </button>
      </div>

      {/* Map label */}
      <div className="absolute bottom-3 left-3 text-[10px] text-gray-600 font-medium">
        🗺 Live Tracking · {order.carrier}
      </div>
    </div>
  );
}

// ─── Tracking Timeline ────────────────────────────────────────────────────────

function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 ${
                event.current
                  ? "border-violet-400 bg-violet-400 shadow-md shadow-violet-500/50"
                  : event.done
                  ? "border-emerald-400 bg-emerald-400"
                  : "border-gray-600 bg-transparent"
              }`}
            />
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-white/10 my-1 min-h-[24px]" />
            )}
          </div>
          {/* Content */}
          <div className="pb-5 min-w-0">
            <div
              className={`text-sm font-semibold ${
                event.current ? "text-violet-300" : event.done ? "text-white" : "text-gray-500"
              }`}
            >
              {event.title}
              {event.current && (
                <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                  CURRENT
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {event.location} · {event.date}, {event.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [selected, setSelected] = useState<Order>(ORDERS[0]);
  const [tab, setTab] = useState<HistoryTab>("active");
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState(false); // mobile toggle

  const activeOrders = ORDERS.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const allOrders = ORDERS;

  const displayOrders = (tab === "active" ? activeOrders : allOrders).filter(
    (o) =>
      search === "" ||
      o.productName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  const runningCount = activeOrders.length;

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white flex flex-col">

      {/* ─── Top bar ─── */}
      <div className="border-b border-white/5 bg-[#0F0D1A]/80 backdrop-blur-md sticky top-16 z-30">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 h-12 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-violet-400">
            <Navigation size={14} />
            <span>SwiftTrack</span>
          </div>
          {/* Search */}
          <div className="flex-1 max-w-xs flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 focus-within:border-violet-500/40 transition-colors">
            <Search size={12} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative text-gray-500 hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 border border-[#0F0D1A] text-[7px] flex items-center justify-center font-bold">
                {runningCount}
              </span>
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-[11px] font-bold text-white">
              JD
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-5 min-h-0">

        {/* ─── Left: Order List ─── */}
        <div className={`w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-4 ${showDetail ? "hidden md:flex" : "flex"}`}>
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white flex-1">
              Active Orders
              <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white">
                {runningCount} Running
              </span>
            </h2>
            <button className="text-gray-500 hover:text-violet-400 transition-colors">
              <Filter size={13} />
            </button>
          </div>

          <div className="flex rounded-xl bg-white/5 border border-white/5 p-1 gap-1">
            {(["active", "all"] as HistoryTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  tab === t ? "bg-violet-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "active" ? "Active" : "All History"}
              </button>
            ))}
          </div>

          {/* Order cards */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {displayOrders.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-600">No orders found</div>
            ) : (
              displayOrders.map((order) => {
                const s = STATUS[order.status];
                const isSelected = selected.id === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelected(order);
                      setShowDetail(true);
                    }}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-violet-500/50 bg-[#1C1828] shadow-lg shadow-violet-900/20"
                        : "border-white/5 bg-[#14121C] hover:border-white/10 hover:bg-[#181624]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-500 font-mono">{order.id}</span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{order.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate leading-tight">
                          {order.productName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                          <s.icon size={9} />
                          {order.estimate}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Link
            href="#"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors mt-1"
          >
            View All Order History <ChevronRight size={12} />
          </Link>
        </div>

        {/* ─── Right: Tracking Detail ─── */}
        <div className={`flex-1 min-w-0 space-y-4 ${!showDetail ? "hidden md:block" : "block"}`}>

          {/* Mobile back */}
          <button
            onClick={() => setShowDetail(false)}
            className="md:hidden flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mb-2"
          >
            <ArrowLeft size={13} /> Back to orders
          </button>

          {/* Map */}
          <MockMap order={selected} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ─── Tracking Events ─── */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Navigation size={14} className="text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Tracking Events</h3>
                <button className="ml-auto text-gray-500 hover:text-violet-400 transition-colors">
                  <RefreshCw size={12} />
                </button>
              </div>
              <TrackingTimeline events={selected.events} />
            </div>

            {/* ─── Right panels ─── */}
            <div className="space-y-4">

              {/* Driver info (if in transit) */}
              {selected.driver && selected.status === "in_transit" && (
                <div className="rounded-2xl bg-[#14121C] border border-white/5 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {selected.driver.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">
                      Driver Information
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{selected.driver.name}</span>
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400 font-bold">
                        <Star size={10} className="fill-yellow-400" />
                        {selected.driver.rating}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{selected.driver.vehicle}</div>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shrink-0">
                    <Phone size={11} /> Contact
                  </button>
                </div>
              )}

              {/* Order Details */}
              <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Clock size={14} className="text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Order Details</h3>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "Shipping Service", value: selected.shippingService },
                    { label: "Weight", value: selected.weight },
                    { label: "Carrier", value: selected.carrier },
                    { label: "Order Date", value: selected.date },
                    { label: "Order Total", value: `${selected.total.toLocaleString('vi-VN')}₫` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">{row.label}</span>
                      <span className="text-xs font-semibold text-white text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <MapPin size={14} className="text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Destination</h3>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed">
                  <div className="font-semibold text-white mb-1">
                    {selected.destination.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selected.destination.address}
                    <br />
                    {selected.destination.city}, {selected.destination.state}{" "}
                    {selected.destination.zip}
                    <br />
                    {selected.destination.country}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selected.status !== "delivered" && selected.status !== "cancelled" && (
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all">
                    Cancel Order
                  </button>
                )}
                {selected.status === "delivered" && (
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 transition-all">
                    <Star size={12} /> Leave Review
                  </button>
                )}
                <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/40">
                  <ShieldCheck size={12} /> Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
