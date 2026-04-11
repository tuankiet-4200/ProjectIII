"use client";

import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  PackageCheck,
  Truck,
  Copy,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "preparing" | "shipping" | "delivered" | "cancelled";

type OrderItem = {
  name: string;
  variant?: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  avatar: string;
  avatarBg: string;
  items: OrderItem[];
  totalItems: number;
  totalAmount: number;
  status: OrderStatus;
  date: string;
  address: string;
  paymentMethod: string;
};

type StatusTab = "all" | OrderStatus;

const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  preparing: { label: "Preparing", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Loader2 },
  shipping: { label: "Shipping", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
};

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
];

// ── Mock Orders ────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: "#ORD-9913",
    customer: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 184-7292",
    avatar: "AR",
    avatarBg: "from-violet-500 to-violet-700",
    items: [
      { name: "Pro Wireless Headphones", variant: "Midnight Black", qty: 1, price: 45 },
      { name: "USB-C Charging Dock", qty: 1, price: 35 },
      { name: "Audio Cable 3.5mm", qty: 1, price: 24 },
    ],
    totalItems: 3,
    totalAmount: 104.0,
    status: "pending",
    date: "Oct 24, 2023",
    address: "842 Evergreen Terrace, Springfield, IL 62704",
    paymentMethod: "Visa •••• 4242",
  },
  {
    id: "#ORD-9914",
    customer: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 384-1044",
    avatar: "SC",
    avatarBg: "from-emerald-500 to-emerald-700",
    items: [{ name: "Pro Wireless Headphones", variant: "Pearl White", qty: 1, price: 45 }],
    totalItems: 1,
    totalAmount: 45.0,
    status: "pending",
    date: "Oct 23, 2023",
    address: "1200 Market St, San Francisco, CA 94103",
    paymentMethod: "Mastercard •••• 8821",
  },
  {
    id: "#ORD-9915",
    customer: "Marco V",
    email: "marco.v@example.com",
    phone: "+1 (555) 209-3387",
    avatar: "MV",
    avatarBg: "from-blue-500 to-blue-700",
    items: [
      { name: "Studio Monitor Speakers", qty: 1, price: 220 },
      { name: "XLR Cable 10ft", qty: 2, price: 24 },
      { name: "Pop Filter", qty: 1, price: 44.2 },
    ],
    totalItems: 3,
    totalAmount: 312.2,
    status: "shipping",
    date: "Oct 23, 2023",
    address: "485 Sunset Blvd, Los Angeles, CA 90028",
    paymentMethod: "PayPal",
  },
  {
    id: "#ORD-9916",
    customer: "Elena Smith",
    email: "elena.smith@example.com",
    phone: "+1 (555) 772-0101",
    avatar: "ES",
    avatarBg: "from-rose-500 to-rose-700",
    items: [
      { name: "Noise Cancelling Buds", qty: 1, price: 68 },
      { name: "Silicone Tips Set", qty: 1, price: 20 },
    ],
    totalItems: 2,
    totalAmount: 88.0,
    status: "delivered",
    date: "Oct 22, 2023",
    address: "300 Peachtree Rd NE, Atlanta, GA 30308",
    paymentMethod: "Apple Pay",
  },
  {
    id: "#ORD-9917",
    customer: "James Wong",
    email: "james.wong@example.com",
    phone: "+1 (555) 610-8823",
    avatar: "JW",
    avatarBg: "from-amber-500 to-amber-700",
    items: [
      { name: "Mechanical Keyboard", variant: "TKL", qty: 1, price: 189 },
      { name: "Wrist Rest", qty: 1, price: 29 },
    ],
    totalItems: 2,
    totalAmount: 218.0,
    status: "preparing",
    date: "Oct 22, 2023",
    address: "77 Massachusetts Ave, Cambridge, MA 02139",
    paymentMethod: "Visa •••• 1155",
  },
  {
    id: "#ORD-9918",
    customer: "Lily Park",
    email: "lily.park@example.com",
    phone: "+1 (555) 331-4457",
    avatar: "LP",
    avatarBg: "from-cyan-500 to-cyan-700",
    items: [{ name: "USB Microphone Pro", qty: 1, price: 149 }],
    totalItems: 1,
    totalAmount: 149.0,
    status: "shipping",
    date: "Oct 21, 2023",
    address: "5th Ave & W 34th St, New York, NY 10118",
    paymentMethod: "Mastercard •••• 3209",
  },
  {
    id: "#ORD-9919",
    customer: "David Kim",
    email: "david.kim@example.com",
    phone: "+1 (555) 887-2290",
    avatar: "DK",
    avatarBg: "from-indigo-500 to-indigo-700",
    items: [
      { name: "Webcam 4K Ultra", qty: 1, price: 199 },
      { name: "Ring Light 12\"", qty: 1, price: 79 },
      { name: "Tripod Mount", qty: 1, price: 45 },
    ],
    totalItems: 3,
    totalAmount: 323.0,
    status: "delivered",
    date: "Oct 21, 2023",
    address: "200 E Randolph St, Chicago, IL 60601",
    paymentMethod: "PayPal",
  },
  {
    id: "#ORD-9920",
    customer: "Ana Morales",
    email: "ana.morales@example.com",
    phone: "+1 (555) 442-6678",
    avatar: "AM",
    avatarBg: "from-pink-500 to-pink-700",
    items: [{ name: "Portable Charger 20000mAh", qty: 2, price: 45 }],
    totalItems: 2,
    totalAmount: 90.0,
    status: "cancelled",
    date: "Oct 20, 2023",
    address: "600 Navarro St, San Antonio, TX 78205",
    paymentMethod: "Visa •••• 9903",
  },
  {
    id: "#ORD-9921",
    customer: "Tom Baker",
    email: "tom.baker@example.com",
    phone: "+1 (555) 119-5501",
    avatar: "TB",
    avatarBg: "from-teal-500 to-teal-700",
    items: [
      { name: "Wireless Mouse", qty: 1, price: 79 },
      { name: "Mouse Pad XL", qty: 1, price: 25 },
    ],
    totalItems: 2,
    totalAmount: 104.0,
    status: "pending",
    date: "Oct 20, 2023",
    address: "1401 Constitution Ave NW, Washington, DC 20560",
    paymentMethod: "Apple Pay",
  },
  {
    id: "#ORD-9922",
    customer: "Nina Patel",
    email: "nina.patel@example.com",
    phone: "+1 (555) 223-4490",
    avatar: "NP",
    avatarBg: "from-fuchsia-500 to-fuchsia-700",
    items: [
      { name: "Smart Watch Pro", variant: "Rose Gold", qty: 1, price: 399 },
    ],
    totalItems: 1,
    totalAmount: 399.0,
    status: "preparing",
    date: "Oct 19, 2023",
    address: "700 Clark Ave, St. Louis, MO 63102",
    paymentMethod: "Mastercard •••• 5567",
  },
  {
    id: "#ORD-9923",
    customer: "Chris Hall",
    email: "chris.hall@example.com",
    phone: "+1 (555) 880-3321",
    avatar: "CH",
    avatarBg: "from-lime-500 to-lime-700",
    items: [
      { name: "Gaming Headset RGB", qty: 1, price: 129 },
      { name: "Audio Mixer", qty: 1, price: 259 },
    ],
    totalItems: 2,
    totalAmount: 388.0,
    status: "delivered",
    date: "Oct 19, 2023",
    address: "400 Broad St, Seattle, WA 98109",
    paymentMethod: "Visa •••• 2277",
  },
  {
    id: "#ORD-9924",
    customer: "Yuki Tanaka",
    email: "yuki.tanaka@example.com",
    phone: "+1 (555) 556-7712",
    avatar: "YT",
    avatarBg: "from-orange-500 to-orange-700",
    items: [
      { name: "Laptop Stand Aluminum", qty: 1, price: 89 },
    ],
    totalItems: 1,
    totalAmount: 89.0,
    status: "shipping",
    date: "Oct 18, 2023",
    address: "1 Infinite Loop, Cupertino, CA 95014",
    paymentMethod: "PayPal",
  },
];

const ITEMS_PER_PAGE = 8;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorOrders() {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(MOCK_ORDERS[1]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let orders = MOCK_ORDERS;
    if (activeTab !== "all") {
      orders = orders.filter((o) => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
      );
    }
    return orders;
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle tab change
  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Next status actions
  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return { label: "Mark as Packing", icon: PackageCheck, action: "preparing" };
      case "preparing":
        return { label: "Handover to Shipper", icon: Truck, action: "shipping" };
      case "shipping":
        return { label: "Mark as Delivered", icon: CheckCircle2, action: "delivered" };
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex-1 flex overflow-hidden h-full">
          {/* ─── Orders List Panel ─── */}
          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${selectedOrder ? "mr-0" : ""}`}>
            {/* Page header */}
            <div className="px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-extrabold text-white">Order Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Handle your incoming orders and logistics status.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Filter size={12} /> Filters
                  </button>
                  <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>

              {/* Status tabs */}
              <div className="flex gap-1 border-b border-white/5">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`relative px-4 py-2.5 text-xs font-semibold transition-colors ${
                      activeTab === tab.key
                        ? "text-violet-400"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar within orders */}
            <div className="px-6 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-colors">
                <Search size={13} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
                  <span className="col-span-2">Order ID</span>
                  <span className="col-span-3">Customer Name</span>
                  <span className="col-span-2 text-center">Total Items</span>
                  <span className="col-span-2 text-right">Total Amount</span>
                  <span className="col-span-1 text-center">Date</span>
                  <span className="col-span-2 text-center">Status</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-white/[0.03]">
                  {paginatedOrders.length === 0 ? (
                    <div className="py-16 text-center">
                      <ShoppingBag size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No orders found</p>
                      <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    paginatedOrders.map((order) => {
                      const s = STATUS_CONFIG[order.status];
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full grid grid-cols-12 items-center px-5 py-4 transition-all text-left ${
                            isSelected
                              ? "bg-violet-500/5 border-l-2 border-l-violet-500"
                              : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                          }`}
                        >
                          <div className="col-span-2">
                            <span className="text-xs font-mono text-violet-400 font-semibold">
                              {order.id}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${order.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                            >
                              {order.avatar}
                            </div>
                            <span className="text-xs font-semibold text-white truncate">
                              {order.customer}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-xs text-gray-400">
                              {order.totalItems} {order.totalItems === 1 ? "item" : "items"}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs font-bold text-white">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-1 text-center">
                            <span className="text-[10px] text-gray-500 leading-tight">
                              {order.date}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}
                            >
                              <s.icon size={9} />
                              {s.label}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer info + Pagination */}
              <div className="flex items-center justify-between py-4 pb-6">
                <span className="text-xs text-gray-600">
                  Showing {paginatedOrders.length} of {filteredOrders.length} orders
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                    >
                      <ChevronLeft size={12} /> Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "text-gray-500 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Order Detail Side Panel ─── */}
          {selectedOrder && (
            <aside className="w-[380px] shrink-0 border-l border-white/5 bg-[#0F0D1A] flex flex-col overflow-hidden animate-in">
              {/* Panel header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedOrder.avatarBg} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                    >
                      {selectedOrder.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedOrder.customer}</h3>
                      <p className="text-[10px] text-gray-500">{selectedOrder.email}</p>
                      <p className="text-[10px] text-gray-500">{selectedOrder.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Quick actions for contact */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Phone size={10} /> Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Mail size={10} /> Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Edit3 size={10} /> Edit
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Order ID & Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-violet-400 font-bold">
                        {selectedOrder.id}
                      </span>
                      <button className="text-gray-600 hover:text-gray-400 transition-colors">
                        <Copy size={10} />
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500">{selectedOrder.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Status:
                    </span>
                    {(() => {
                      const s = STATUS_CONFIG[selectedOrder.status];
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}
                        >
                          <s.icon size={9} />
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Shipping Address
                  </h4>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <MapPin size={12} className="text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {selectedOrder.address}
                    </p>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Payment Method
                  </h4>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-6 h-6 rounded-md bg-violet-600/20 flex items-center justify-center">
                      <span className="text-[8px] text-violet-400 font-bold">💳</span>
                    </div>
                    <span className="text-xs text-gray-300">{selectedOrder.paymentMethod}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                          {item.variant && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{item.variant}</p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-0.5">Qty: {item.qty}</p>
                        </div>
                        <span className="text-xs font-bold text-white shrink-0 ml-3">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-white font-semibold">
                      ${selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-white font-semibold">$0.00</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-sm">
                    <span className="text-gray-400 font-semibold">Total</span>
                    <span className="text-violet-400 font-extrabold">
                      ${selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-4 border-t border-white/5 space-y-2 shrink-0">
                {(() => {
                  const nextAction = getNextAction(selectedOrder.status);
                  if (!nextAction) return null;
                  return (
                    <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40">
                      <nextAction.icon size={14} />
                      {nextAction.label}
                    </button>
                  );
                })()}

                {selectedOrder.status === "pending" && (
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all">
                    <Truck size={14} />
                    Handover to Shipper
                  </button>
                )}

                {selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" && (
                    <button className="w-full text-center text-xs font-semibold text-red-400 hover:text-red-300 transition-colors py-1.5">
                      Cancel Order
                    </button>
                  )}
              </div>
            </aside>
          )}
        </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-in { animation: slideIn 0.25s ease-out; }
      `}</style>
    </>
  );
}
