"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShopStatus = "pending" | "approved" | "rejected";
type VerificationStatus = "unverified" | "ready" | "verified";
type ShopTab = "pending" | "approved" | "rejected";

type ShopApplication = {
  id: string;
  businessName: string;
  businessType: string;
  businessIcon: string;
  businessIconBg: string;
  ownerName: string;
  verification: VerificationStatus;
  dateApplied: string;
  status: ShopStatus;
  email: string;
  phone: string;
  address: string;
  description: string;
  documents: string[];
};

// ─── Data ────────────────────────────────────────────────────────────────────

const VERIFICATION_STYLE: Record<VerificationStatus, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  ready: { label: "Ready", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  verified: { label: "Verified", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};

const MOCK_SHOPS: ShopApplication[] = [
  { id: "SHOP-001", businessName: "Urban Threads", businessType: "Clothing & Apparel", businessIcon: "👕", businessIconBg: "from-violet-600/30 to-violet-800/30", ownerName: "John D. Richardson", verification: "unverified", dateApplied: "Oct 24, 2023", status: "pending", email: "john@urbanthreads.com", phone: "+1 (555) 234-5678", address: "456 Fashion Ave, New York, NY 10018", description: "Premium streetwear and casual clothing brand focused on sustainable materials.", documents: ["Business License", "Tax Certificate"] },
  { id: "SHOP-002", businessName: "Tech Haven", businessType: "Electronics", businessIcon: "💻", businessIconBg: "from-blue-600/30 to-blue-800/30", ownerName: "Sarah Jenkins", verification: "ready", dateApplied: "Oct 25, 2023", status: "pending", email: "sarah@techhaven.io", phone: "+1 (555) 876-5432", address: "789 Silicon Way, San Jose, CA 95110", description: "Consumer electronics and smart home devices retailer.", documents: ["Business License", "Tax Certificate", "Insurance"] },
  { id: "SHOP-003", businessName: "Green Leaf Organics", businessType: "Food & Grocery", businessIcon: "🌿", businessIconBg: "from-emerald-600/30 to-emerald-800/30", ownerName: "Maria Santos", verification: "unverified", dateApplied: "Oct 26, 2023", status: "pending", email: "maria@greenleaf.co", phone: "+1 (555) 345-6789", address: "123 Organic Blvd, Portland, OR 97201", description: "Organic produce, health foods, and eco-friendly household products.", documents: ["Business License", "Health Certificate"] },
  { id: "SHOP-004", businessName: "Luxe Home Décor", businessType: "Home & Living", businessIcon: "🏠", businessIconBg: "from-amber-600/30 to-amber-800/30", ownerName: "David Chen", verification: "ready", dateApplied: "Oct 22, 2023", status: "pending", email: "david@luxehome.com", phone: "+1 (555) 987-1234", address: "567 Interior Dr, Chicago, IL 60601", description: "Curated collection of premium home furniture and décor accessories.", documents: ["Business License", "Tax Certificate", "Insurance"] },
  { id: "SHOP-005", businessName: "Artisan Crafts", businessType: "Handmade Goods", businessIcon: "🎨", businessIconBg: "from-rose-600/30 to-rose-800/30", ownerName: "Emily Watson", verification: "unverified", dateApplied: "Oct 21, 2023", status: "pending", email: "emily@artisancrafts.shop", phone: "+1 (555) 456-7890", address: "890 Craft Lane, Austin, TX 78701", description: "Handcrafted jewelry, pottery, and custom art pieces.", documents: ["Business License"] },
  { id: "SHOP-006", businessName: "CloudByte Solutions", businessType: "Software & SaaS", businessIcon: "☁️", businessIconBg: "from-sky-600/30 to-sky-800/30", ownerName: "Priya Sharma", verification: "ready", dateApplied: "Oct 27, 2023", status: "pending", email: "priya@cloudbyte.dev", phone: "+1 (555) 901-2345", address: "1200 Tech Park, Seattle, WA 98101", description: "Cloud-based productivity tools and SaaS solutions.", documents: ["Business License", "Tax Certificate", "Insurance", "SOC2 Certificate"] },
  { id: "SHOP-007", businessName: "Pet Paradise", businessType: "Pet Supplies", businessIcon: "🐾", businessIconBg: "from-orange-600/30 to-orange-800/30", ownerName: "Lisa Morgan", verification: "unverified", dateApplied: "Oct 28, 2023", status: "pending", email: "lisa@petparadise.shop", phone: "+1 (555) 012-3456", address: "345 Paw Avenue, San Diego, CA 92101", description: "Premium pet food, toys, and accessories for all animals.", documents: ["Business License", "Health Certificate"] },
  { id: "SHOP-008", businessName: "FitGear Pro", businessType: "Sports & Fitness", businessIcon: "🏋️", businessIconBg: "from-cyan-600/30 to-cyan-800/30", ownerName: "Mike Thompson", verification: "verified", dateApplied: "Oct 18, 2023", status: "approved", email: "mike@fitgearpro.com", phone: "+1 (555) 567-8901", address: "234 Athletic Way, Denver, CO 80201", description: "Professional fitness equipment and workout accessories.", documents: ["Business License", "Tax Certificate", "Insurance"] },
  { id: "SHOP-009", businessName: "Pixel Perfect Gear", businessType: "Photography", businessIcon: "📷", businessIconBg: "from-indigo-600/30 to-indigo-800/30", ownerName: "Anna Lee", verification: "verified", dateApplied: "Oct 15, 2023", status: "approved", email: "anna@pixelperfect.cam", phone: "+1 (555) 678-9012", address: "345 Shutter St, Los Angeles, CA 90001", description: "Professional cameras, lenses, and photography accessories.", documents: ["Business License", "Tax Certificate"] },
  { id: "SHOP-010", businessName: "QuickMart Express", businessType: "General Store", businessIcon: "🏪", businessIconBg: "from-gray-600/30 to-gray-800/30", ownerName: "Robert Kim", verification: "unverified", dateApplied: "Oct 20, 2023", status: "rejected", email: "robert@quickmart.biz", phone: "+1 (555) 789-0123", address: "678 Commerce Rd, Miami, FL 33101", description: "General merchandise and convenience items.", documents: ["Business License"] },
  { id: "SHOP-011", businessName: "Neon Nights Audio", businessType: "Audio Equipment", businessIcon: "🎧", businessIconBg: "from-purple-600/30 to-purple-800/30", ownerName: "James Park", verification: "unverified", dateApplied: "Oct 19, 2023", status: "rejected", email: "james@neonnights.audio", phone: "+1 (555) 890-1234", address: "901 Sound Ave, Nashville, TN 37201", description: "Professional audio equipment and DJ gear.", documents: ["Business License"] },
  { id: "SHOP-012", businessName: "Vintage Vault", businessType: "Antiques & Collectibles", businessIcon: "🏺", businessIconBg: "from-yellow-600/30 to-yellow-800/30", ownerName: "Thomas Brooks", verification: "ready", dateApplied: "Oct 29, 2023", status: "pending", email: "thomas@vintagevault.co", phone: "+1 (555) 123-4567", address: "678 Heritage Rd, Boston, MA 02101", description: "Curated antiques, vintage collectibles, and rare finds.", documents: ["Business License", "Tax Certificate"] },
];

const SECURITY_LOG = [
  { text: 'Shop "QuickMart Express" was rejected', by: "Alex S.", time: "5m ago", color: "bg-red-400" },
  { text: 'New Shop "CloudByte Solutions" Applied', by: "System", time: "1h ago", color: "bg-emerald-400" },
  { text: 'Shop "FitGear Pro" Approved', by: "Alex S.", time: "3h ago", color: "bg-emerald-400" },
];

const ITEMS_PER_PAGE = 5;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminShopGovernance() {
  const [activeTab, setActiveTab] = useState<ShopTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState<ShopApplication | null>(null);

  const filteredShops = useMemo(() => {
    let shops = MOCK_SHOPS.filter((s) => s.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      shops = shops.filter((s) => s.businessName.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    return shops;
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / ITEMS_PER_PAGE));
  const paginatedShops = filteredShops.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pendingCount = MOCK_SHOPS.filter((s) => s.status === "pending").length;
  const approvedCount = MOCK_SHOPS.filter((s) => s.status === "approved").length;
  const rejectedCount = MOCK_SHOPS.filter((s) => s.status === "rejected").length;

  const tabs: { key: ShopTab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
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
          <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
            <Download size={12} /> Export Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === tab.key ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"}`}>
              {tab.label}
              <span className={`text-[9px] font-bold ${activeTab === tab.key ? "text-violet-200" : "text-gray-600"}`}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-violet-500/40 transition-colors max-w-md">
            <Search size={13} className="text-gray-500 shrink-0" />
            <input type="text" placeholder="Search by business name, owner..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none" />
          </div>
          <span className="text-xs text-gray-500">Total: <span className="text-white font-bold">{filteredShops.length}</span> applications</span>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
            <span className="col-span-3">Business Details</span><span className="col-span-2">Owner Name</span><span className="col-span-2 text-center">ID Verification</span><span className="col-span-2 text-center">Date Applied</span><span className="col-span-3 text-center">Actions</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {paginatedShops.length === 0 ? (
              <div className="py-16 text-center"><Store size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">No applications found</p></div>
            ) : (
              paginatedShops.map((shop) => {
                const v = VERIFICATION_STYLE[shop.verification];
                return (
                  <div key={shop.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shop.businessIconBg} border border-white/5 flex items-center justify-center text-lg shrink-0`}>{shop.businessIcon}</div>
                      <div><div className="text-xs font-bold text-white">{shop.businessName}</div><div className="text-[10px] text-gray-500">{shop.businessType}</div></div>
                    </div>
                    <div className="col-span-2"><span className="text-xs text-gray-300">{shop.ownerName}</span></div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center"><UserCheck size={12} className="text-violet-400" /></div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${v.cls}`}>{v.label}</span>
                    </div>
                    <div className="col-span-2 text-center"><span className="text-xs text-gray-400">{shop.dateApplied}</span></div>
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      {shop.status === "pending" ? (
                        <>
                          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"><CheckCircle2 size={10} /> Approve</button>
                          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-[10px] font-bold text-red-400 hover:bg-red-500/25 transition-all"><XCircle size={10} /> Reject</button>
                        </>
                      ) : shop.status === "approved" ? (
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
          <span className="text-xs text-gray-600">Showing {paginatedShops.length} of {filteredShops.length} applications</span>
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

        {/* Bottom: Security Log + Guidelines */}
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4"><Shield size={13} className="text-violet-400" /><h3 className="text-xs font-bold text-white uppercase tracking-wider">Security Log</h3></div>
            <div className="space-y-3">
              {SECURITY_LOG.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5"><span className={`w-2 h-2 rounded-full ${log.color} mt-1.5 shrink-0`} /><div className="flex-1"><p className="text-xs text-white font-medium">{log.text}</p><p className="text-[10px] text-gray-600">By {log.by} · {log.time}</p></div></div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 relative overflow-hidden">
            <h3 className="text-base font-bold text-white mb-2">Review Guidelines</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">Remember: All shop approvals are fully audited. Verify business documents, check ID verification status, and review business descriptions before approving.</p>
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/10 transition-colors"><FileText size={11} /> Read Protocol</button>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03]"><Shield size={120} /></div>
          </div>
        </div>
      </div>

      {/* Shop Detail Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedShop(null)} />
          <div className="relative bg-[#14121C] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-black/50 animate-modal">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedShop.businessIconBg} border border-white/5 flex items-center justify-center text-xl`}>{selectedShop.businessIcon}</div>
                <div><h2 className="text-base font-bold text-white">{selectedShop.businessName}</h2><p className="text-[10px] text-gray-500">{selectedShop.businessType} · {selectedShop.id}</p></div>
              </div>
              <button onClick={() => setSelectedShop(null)} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Owner</span><span className="text-xs text-white font-medium">{selectedShop.ownerName}</span></div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Verification</span><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${VERIFICATION_STYLE[selectedShop.verification].cls}`}>{VERIFICATION_STYLE[selectedShop.verification].label}</span></div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Description</span><p className="text-xs text-gray-300 leading-relaxed">{selectedShop.description}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Email</span><span className="text-xs text-violet-400">{selectedShop.email}</span></div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Phone</span><span className="text-xs text-white">{selectedShop.phone}</span></div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3"><span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Address</span><span className="text-xs text-gray-300">{selectedShop.address}</span></div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Documents</span>
                <div className="flex flex-wrap gap-1.5 mt-1">{selectedShop.documents.map((doc) => (<span key={doc} className="text-[9px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md">{doc}</span>))}</div>
              </div>
            </div>
            {selectedShop.status === "pending" && (
              <div className="flex gap-2 mt-6">
                <button onClick={() => setSelectedShop(null)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white hover:bg-emerald-500 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/40"><CheckCircle2 size={13} /> Approve</button>
                <button onClick={() => setSelectedShop(null)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-semibold text-white hover:bg-red-500 transition-all active:scale-[0.98] shadow-lg shadow-red-900/40"><XCircle size={13} /> Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal { animation: modalIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
