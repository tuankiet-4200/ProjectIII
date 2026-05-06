"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Store,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  FileText,
  X,
  RefreshCw,
} from "lucide-react";
import { shopsService } from "@/services/shops.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { Shop, ShopStatus } from "@/types";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShopTab = "PENDING" | "ACTIVE" | "REJECTED";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERIFICATION_STYLE: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "Pending",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  ACTIVE:   { label: "Active",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Rejected", cls: "bg-red-500/15 text-red-400 border-red-500/20" },
  BANNED:   { label: "Banned",   cls: "bg-gray-500/15 text-gray-400 border-gray-500/20" },
};

const SHOP_ICON_BG = [
  "from-violet-600/30 to-violet-800/30",
  "from-blue-600/30 to-blue-800/30",
  "from-emerald-600/30 to-emerald-800/30",
  "from-amber-600/30 to-amber-800/30",
  "from-rose-600/30 to-rose-800/30",
  "from-sky-600/30 to-sky-800/30",
  "from-orange-600/30 to-orange-800/30",
  "from-cyan-600/30 to-cyan-800/30",
  "from-indigo-600/30 to-indigo-800/30",
  "from-purple-600/30 to-purple-800/30",
];

const SHOP_ICONS = ["🏪", "🛒", "🏬", "💼", "🎁", "📦", "🛍️", "🎯", "⭐", "💎"];

function getShopIcon(id: string) {
  const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return {
    icon: SHOP_ICONS[hash % SHOP_ICONS.length],
    bg: SHOP_ICON_BG[hash % SHOP_ICON_BG.length],
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const ITEMS_PER_PAGE = 5;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminShopGovernance() {
  const [activeTab, setActiveTab] = useState<ShopTab>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Record<ShopTab, Shop[]>>({ PENDING: [], ACTIVE: [], REJECTED: [] });
  const [totals, setTotals] = useState<Record<ShopTab, number>>({ PENDING: 0, ACTIVE: 0, REJECTED: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const fetchTab = useCallback(async (tab: ShopTab) => {
    try {
      const res = await shopsService.adminGetAll(tab as ShopStatus, 1, 100);
      setShops((prev) => ({ ...prev, [tab]: res.shops }));
      setTotals((prev) => ({ ...prev, [tab]: res.total }));
    } catch {
      // silently fail per-tab
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTab("PENDING"), fetchTab("ACTIVE"), fetchTab("REJECTED")]);
    } finally {
      setLoading(false);
    }
  }, [fetchTab]);

  useEffect(() => {
    if (accessToken) fetchAll();
    else setLoading(false);
  }, [accessToken, fetchAll]);

  const currentShops = shops[activeTab];

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return currentShops;
    const q = searchQuery.toLowerCase();
    return currentShops.filter(
      (s) => s.name.toLowerCase().includes(q) || s.owner?.full_name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [currentShops, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / ITEMS_PER_PAGE));
  const paginatedShops = filteredShops.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleUpdateStatus = async (shopId: string, status: ShopStatus) => {
    setActionLoading(shopId);
    try {
      await shopsService.updateStatus(shopId, status);
      toast.success(`Shop ${status === "ACTIVE" ? "approved" : "rejected"} successfully`);
      if (selectedShop?.id === shopId) setSelectedShop(null);
      await fetchAll();
    } catch {
      toast.error("Failed to update shop status");
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: ShopTab; label: string }[] = [
    { key: "PENDING",  label: "Pending" },
    { key: "ACTIVE",   label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Shop Review Applications</h1>
            <p className="text-xs text-gray-500 mt-0.5">Review and manage pending merchant applications for the marketplace.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} disabled={loading} className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50 transition-all">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
              <Download size={12} /> Export Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); setSearchQuery(""); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === tab.key ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"}`}>
              {tab.label}
              <span className={`text-[9px] font-bold ${activeTab === tab.key ? "text-violet-200" : "text-gray-600"}`}>({totals[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-violet-500/40 transition-colors max-w-md">
            <Search size={13} className="text-gray-500 shrink-0" />
            <input type="text" placeholder="Search by shop name, owner..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none" />
          </div>
          <span className="text-xs text-gray-500">Total: <span className="text-white font-bold">{filteredShops.length}</span> shops</span>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
            <span className="col-span-4">Shop Details</span>
            <span className="col-span-2">Owner</span>
            <span className="col-span-2 text-center">Status</span>
            <span className="col-span-2 text-center">Registered</span>
            <span className="col-span-2 text-center">Actions</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw size={28} className="text-gray-600 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-500">Loading shops...</p>
              </div>
            ) : paginatedShops.length === 0 ? (
              <div className="py-16 text-center">
                <Store size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No shops found</p>
              </div>
            ) : (
              paginatedShops.map((shop) => {
                const { icon, bg } = getShopIcon(shop.id);
                const v = VERIFICATION_STYLE[shop.status] ?? VERIFICATION_STYLE.PENDING;
                const isActing = actionLoading === shop.id;
                return (
                  <div key={shop.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    {/* Shop */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} border border-white/5 flex items-center justify-center text-lg shrink-0`}>{icon}</div>
                      <div>
                        <div className="text-xs font-bold text-white">{shop.name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[160px]">{shop.description || "No description"}</div>
                        <div className="text-[9px] text-gray-600 font-mono mt-0.5">{shop.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                    {/* Owner */}
                    <div className="col-span-2">
                      <div className="text-xs text-gray-300 font-medium">{shop.owner?.full_name || "—"}</div>
                      <div className="text-[10px] text-gray-600">{shop.owner?.email || "—"}</div>
                    </div>
                    {/* Status */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
                        <UserCheck size={12} className="text-violet-400" />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${v.cls}`}>{v.label}</span>
                    </div>
                    {/* Date */}
                    <div className="col-span-2 text-center">
                      <span className="text-xs text-gray-400">{formatDate(shop.created_at)}</span>
                    </div>
                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {shop.status === "PENDING" ? (
                        <>
                          <button onClick={() => handleUpdateStatus(shop.id, "ACTIVE")} disabled={isActing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-50"><CheckCircle2 size={10} /> Approve</button>
                          <button onClick={() => handleUpdateStatus(shop.id, "REJECTED")} disabled={isActing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-[10px] font-bold text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50"><XCircle size={10} /> Reject</button>
                        </>
                      ) : shop.status === "ACTIVE" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"><CheckCircle2 size={11} /> Approved</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400"><XCircle size={11} /> Rejected</span>
                      )}
                      <button onClick={() => setSelectedShop(shop)} className="p-1.5 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all ml-1"><Eye size={12} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Showing {paginatedShops.length} of {filteredShops.length} shops</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-gray-500 hover:bg-white/5 hover:text-white"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>

        {/* Bottom: Guidelines */}
        <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-violet-400" />
            <h3 className="text-base font-bold text-white">Review Guidelines</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4 max-w-2xl">
            Remember: All shop approvals are fully audited. Verify owner information, check business descriptions before approving. Rejected shops can re-apply after addressing the issues.
          </p>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/10 transition-colors">
            <FileText size={11} /> Read Protocol
          </button>
          <div className="absolute -bottom-4 -right-4 opacity-[0.03]"><Shield size={120} /></div>
        </div>
      </div>

      {/* Shop Detail Modal */}
      {selectedShop && (() => {
        const { icon, bg } = getShopIcon(selectedShop.id);
        const v = VERIFICATION_STYLE[selectedShop.status] ?? VERIFICATION_STYLE.PENDING;
        const isActing = actionLoading === selectedShop.id;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedShop(null)} />
            <div className="relative bg-[#14121C] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-black/50 animate-modal">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} border border-white/5 flex items-center justify-center text-xl`}>{icon}</div>
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedShop.name}</h2>
                    <p className="text-[10px] text-gray-500">{selectedShop.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedShop(null)} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Owner</span><span className="text-xs text-white font-medium">{selectedShop.owner?.full_name || "—"}</span></div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Status</span><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${v.cls}`}>{v.label}</span></div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Description</span><p className="text-xs text-gray-300 leading-relaxed">{selectedShop.description || "No description provided."}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Email</span><span className="text-xs text-violet-400">{selectedShop.owner?.email || "—"}</span></div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Phone</span><span className="text-xs text-white">{selectedShop.owner?.phone || "—"}</span></div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Rating</span><span className="text-xs text-amber-400 font-bold">⭐ {Number(selectedShop.rating).toFixed(1)}</span></div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Registered</span><span className="text-xs text-gray-300">{formatDate(selectedShop.created_at)}</span></div>
              </div>
              {selectedShop.status === "PENDING" && (
                <div className="flex gap-2 mt-6">
                  <button onClick={() => handleUpdateStatus(selectedShop.id, "ACTIVE")} disabled={isActing} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/40 disabled:opacity-50"><CheckCircle2 size={13} /> {isActing ? "Processing..." : "Approve"}</button>
                  <button onClick={() => handleUpdateStatus(selectedShop.id, "REJECTED")} disabled={isActing} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-semibold text-white hover:bg-red-500 transition-all active:scale-[0.98] shadow-lg shadow-red-900/40 disabled:opacity-50"><XCircle size={13} /> {isActing ? "Processing..." : "Reject"}</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal { animation: modalIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
