"use client";

import { useState, useMemo, useEffect } from "react";
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
import QRCode from "react-qr-code";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "preparing" | "ready_for_pickup" | "shipping" | "delivered" | "cancelled";

type OrderItem = {
  name: string;
  variant?: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  displayId: string;
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
  ready_for_pickup: { label: "Wait for Shipper", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Clock },
  shipping: { label: "Shipping", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
};

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Wait for Shipper" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
];

import { toast } from "sonner";
import { ordersService } from "@/services/orders.service";
import { trackingService } from "@/services/tracking.service";
import { formatVnd } from "@/lib/currency";

const ITEMS_PER_PAGE = 8;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorOrders() {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { shopsService } = await import('@/services/shops.service');
      const shop = await shopsService.getMyShop();
      if (shop?.id) {
        const result = await ordersService.getShopOrders(shop.id, 1, 50);
        const orderList = result?.data || (result as any)?.orders || [];
        if (orderList.length > 0) {
          const AVATAR_BGS = ['from-violet-500 to-violet-700', 'from-emerald-500 to-emerald-700', 'from-blue-500 to-blue-700', 'from-rose-500 to-rose-700', 'from-amber-500 to-amber-700'];
          const mapped: Order[] = orderList.map((o: any, i: number) => ({
            id: o.id,
            displayId: `#ORD-${String(i + 9000).padStart(4, '0')}`,
            customer: o.parent_order?.user?.full_name || `Customer ${i + 1}`,
            email: o.parent_order?.user?.email || '',
            phone: o.parent_order?.user?.phone || '',
            avatar: (o.parent_order?.user?.full_name || 'U').slice(0, 2).toUpperCase(),
            avatarBg: AVATAR_BGS[i % AVATAR_BGS.length],
            items: (o.order_items || []).map((item: any) => ({
              name: item.product?.name || 'Product',
              qty: item.quantity,
              price: Number(item.price_at_purchase) || 0,
            })),
            totalItems: o.order_items?.length || 0,
            totalAmount: o.order_items?.reduce((sum: number, item: any) => sum + Number(item.price_at_purchase) * item.quantity, 0) || 0,
            status: (o.status || 'pending').toLowerCase() as any,
            date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            address: o.parent_order?.shipping_address || '',
            paymentMethod: o.parent_order?.payment_method || 'COD',
          }));
          setOrders(mapped);
          if (mapped.length > 0) setSelectedOrder(mapped[0]);
        } else {
          setOrders([]);
          setSelectedOrder(null);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleTrackingEvent = async (orderId: string, eventType: string) => {
    try {
      await trackingService.createEvent(orderId, {
        event_type: eventType,
        location: trackingLocation || "Sorting Facility",
      });
      toast.success('Tracking updated and status synced!');
      setTrackingLocation("");
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update tracking');
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (activeTab !== "all") {
      filtered = filtered.filter((o) => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeTab, searchQuery, orders]);

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
        return { label: "Pack Order", icon: PackageCheck, eventType: "order_packed" };
      case "preparing":
        return { label: "Handover to Shipper", icon: Truck, eventType: "ready_for_pickup" };
      case "shipping":
        return { label: "Mark as Delivered", icon: CheckCircle2, eventType: "delivered" };
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
                              {order.displayId}
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
                              {formatVnd(order.totalAmount)}
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
                        {selectedOrder.displayId}
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

                {/* QR Code for Shipper */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">
                    Mã Vận Đơn (Shipper Scan QR)
                  </h4>
                  <div className="bg-white p-2 rounded-lg">
                    <QRCode
                      value={selectedOrder.id}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-2 text-center font-mono break-all px-2">
                    {selectedOrder.id}
                  </p>
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
                          {formatVnd(item.price)}
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
                      {formatVnd(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-white font-semibold">{formatVnd(0)}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-sm">
                    <span className="text-gray-400 font-semibold">Total</span>
                    <span className="text-violet-400 font-extrabold">
                      {formatVnd(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-4 border-t border-white/5 space-y-3 shrink-0">
                {(() => {
                  const nextAction = getNextAction(selectedOrder.status);
                  if (!nextAction) return null;
                  return (
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Current Location (Optional)"
                          value={trackingLocation}
                          onChange={(e) => setTrackingLocation(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-violet-500/40 text-white transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => handleTrackingEvent(selectedOrder.id, nextAction.eventType)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40"
                      >
                        <nextAction.icon size={14} />
                        {nextAction.label}
                      </button>
                    </div>
                  );
                })()}

                {selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" && (
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to cancel this order?')) {
                          try {
                            await ordersService.updateShopOrderStatus(selectedOrder.id, "CANCELLED");
                            toast.success('Order cancelled');
                            loadOrders();
                          } catch (e: any) {
                            toast.error(e.response?.data?.message || 'Failed to cancel');
                          }
                        }
                      }}
                      className="w-full text-center text-xs font-semibold text-red-400 hover:text-red-300 transition-colors py-1.5"
                    >
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
