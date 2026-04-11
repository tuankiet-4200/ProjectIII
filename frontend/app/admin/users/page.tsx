"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  UserCheck,
  LogIn,
  Ban,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "merchant" | "customer" | "admin";
type UserStatus = "active" | "banned" | "suspended" | "inactive";
type StatusFilter = "all" | UserStatus;

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarBg: string;
  accountType: AccountType;
  lastActivity: string;
  status: UserStatus;
  isBanned: boolean;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_STYLE: Record<AccountType, { label: string; cls: string }> = {
  merchant: { label: "Merchant", cls: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  customer: { label: "Customer", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  admin: { label: "Admin", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

const USER_STATUS_STYLE: Record<UserStatus, { label: string; color: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-400", dot: "bg-emerald-400" },
  banned: { label: "Banned", color: "text-red-400", dot: "bg-red-400" },
  suspended: { label: "Suspended", color: "text-amber-400", dot: "bg-amber-400" },
  inactive: { label: "Inactive", color: "text-gray-400", dot: "bg-gray-400" },
};

const MOCK_USERS: UserRecord[] = [
  { id: "USR-8932", name: "Marco Valenzuela", email: "marco.v@cloudcorp.io", avatar: "MV", avatarBg: "from-violet-500 to-violet-700", accountType: "merchant", lastActivity: "2 mins ago", status: "active", isBanned: false },
  { id: "USR-7721", name: "Evelyn Harper", email: "evie_98@gmail.com", avatar: "EH", avatarBg: "from-emerald-500 to-emerald-700", accountType: "customer", lastActivity: "3 days ago", status: "banned", isBanned: true },
  { id: "USR-6650", name: "Liam Peterson", email: "liam.peterson@webdev.me", avatar: "LP", avatarBg: "from-blue-500 to-blue-700", accountType: "merchant", lastActivity: "Just now", status: "active", isBanned: false },
  { id: "USR-5539", name: "Sofia Rodriguez", email: "sofia.r@designhub.co", avatar: "SR", avatarBg: "from-rose-500 to-rose-700", accountType: "merchant", lastActivity: "1 hour ago", status: "active", isBanned: false },
  { id: "USR-4428", name: "Jason Wu", email: "jason.wu@techmail.com", avatar: "JW", avatarBg: "from-amber-500 to-amber-700", accountType: "customer", lastActivity: "5 hours ago", status: "active", isBanned: false },
  { id: "USR-3317", name: "Chloe Bennett", email: "chloe.b@shopify.fan", avatar: "CB", avatarBg: "from-cyan-500 to-cyan-700", accountType: "customer", lastActivity: "2 weeks ago", status: "suspended", isBanned: false },
  { id: "USR-2206", name: "Daniel Kim", email: "d.kim@enterprise.io", avatar: "DK", avatarBg: "from-indigo-500 to-indigo-700", accountType: "merchant", lastActivity: "30 mins ago", status: "active", isBanned: false },
  { id: "USR-1195", name: "Rachel Green", email: "rachel.g@fashion.co", avatar: "RG", avatarBg: "from-pink-500 to-pink-700", accountType: "customer", lastActivity: "1 month ago", status: "inactive", isBanned: false },
  { id: "USR-0084", name: "Nathan Brooks", email: "n.brooks@gamerzone.net", avatar: "NB", avatarBg: "from-orange-500 to-orange-700", accountType: "customer", lastActivity: "1 day ago", status: "banned", isBanned: true },
  { id: "USR-9903", name: "Aria Patel", email: "aria.patel@luxe.shop", avatar: "AP", avatarBg: "from-teal-500 to-teal-700", accountType: "merchant", lastActivity: "10 mins ago", status: "active", isBanned: false },
  { id: "USR-8812", name: "Tyler Johnson", email: "tyler.j@email.com", avatar: "TJ", avatarBg: "from-lime-500 to-lime-700", accountType: "customer", lastActivity: "4 days ago", status: "active", isBanned: false },
  { id: "USR-7701", name: "Maya Chen", email: "maya.chen@art.studio", avatar: "MC", avatarBg: "from-fuchsia-500 to-fuchsia-700", accountType: "merchant", lastActivity: "45 mins ago", status: "active", isBanned: false },
];

const SECURITY_LOG = [
  { text: "User #8932 was banned", by: "Alex S.", time: "10m ago", color: "bg-red-400" },
  { text: 'New Shop "Style Co" Approved', by: "Alex S.", time: "2h ago", color: "bg-emerald-400" },
  { text: "Suspicious login attempt blocked", by: "System", time: "4h ago", color: "bg-amber-400" },
  { text: "User #3317 suspended for review", by: "Alex S.", time: "6h ago", color: "bg-amber-400" },
];

const TOTAL_USERS = 14209;
const ITEMS_PER_PAGE = 5;

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-gray-700"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUserGovernance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState(MOCK_USERS);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (statusFilter !== "all") filtered = filtered.filter((u) => u.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    return filtered;
  }, [users, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleBan = (userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: !u.isBanned, status: u.isBanned ? ("active" as UserStatus) : ("banned" as UserStatus) } : u));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">User Governance</h1>
          <p className="text-xs text-gray-500 mt-0.5">Audit user behavior, manage account statuses, and troubleshoot via Safe Mode impersonation.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
          <Download size={12} /> Export Report
        </button>
      </div>

      {/* Search + Filter + Total */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-violet-500/40 transition-colors max-w-md">
          <Search size={13} className="text-gray-500 shrink-0" />
          <input type="text" placeholder="Search by name, email or ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }} className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-violet-500/40 transition-colors appearance-none cursor-pointer">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="ml-auto text-xs text-gray-500">Total Users: <span className="text-white font-bold">{TOTAL_USERS.toLocaleString()}</span></div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
          <span className="col-span-3">User</span><span className="col-span-2 text-center">Account Type</span><span className="col-span-2 text-center">Last Activity</span><span className="col-span-1 text-center">Status</span><span className="col-span-4 text-center">Administrative Actions</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {paginatedUsers.length === 0 ? (
            <div className="py-16 text-center"><Users size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">No users found</p></div>
          ) : (
            paginatedUsers.map((user) => {
              const typeStyle = ACCOUNT_TYPE_STYLE[user.accountType];
              const statusStyle = USER_STATUS_STYLE[user.status];
              return (
                <div key={user.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{user.avatar}</div>
                    <div><div className="text-xs font-bold text-white">{user.name}</div><div className="text-[10px] text-gray-500">{user.email}</div></div>
                  </div>
                  <div className="col-span-2 flex justify-center"><span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${typeStyle.cls}`}>{typeStyle.label}</span></div>
                  <div className="col-span-2 text-center"><span className="text-xs text-gray-400">{user.lastActivity}</span></div>
                  <div className="col-span-1 flex items-center justify-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} /><span className={`text-[10px] font-bold uppercase ${statusStyle.color}`}>{statusStyle.label}</span></div>
                  <div className="col-span-4 flex items-center justify-center gap-3">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"><LogIn size={9} /> Safe Mode Log-in</button>
                    <Toggle enabled={!user.isBanned} onChange={() => toggleBan(user.id)} />
                    <button onClick={() => toggleBan(user.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${user.isBanned ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"}`}>
                      {user.isBanned ? <><UserCheck size={9} /> Unban</> : <><Ban size={9} /> Banned</>}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Showing {paginatedUsers.length} of {TOTAL_USERS.toLocaleString()} users</span>
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

      {/* Bottom: Security Log + Safe Mode Guidelines */}
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
          <h3 className="text-base font-bold text-white mb-2">Safe Mode Guidelines</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">Remember: Safe Mode impersonation is fully audited. Any sensitive actions taken while acting as a user will be flagged for review.</p>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/10 transition-colors"><FileText size={11} /> Read Protocol</button>
          <div className="absolute -bottom-4 -right-4 opacity-[0.03]"><ShieldCheck size={120} /></div>
        </div>
      </div>
    </div>
  );
}
