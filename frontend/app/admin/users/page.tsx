"use client";

import { useState, useMemo, useEffect } from "react";
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
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "MERCHANT" | "CUSTOMER" | "ADMIN";
type StatusFilter = "all" | "active" | "banned";

type UserRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: AccountType;
  is_banned: boolean;
  created_at: string;
  shops: { id: string; name: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_STYLE: Record<AccountType, { label: string; cls: string }> = {
  MERCHANT:  { label: "Merchant",  cls: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  CUSTOMER:  { label: "Customer",  cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  ADMIN:     { label: "Admin",     cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

function getAvatarBg(index: number) {
  const COLORS = [
    "from-violet-500 to-violet-700", "from-emerald-500 to-emerald-700",
    "from-blue-500 to-blue-700", "from-rose-500 to-rose-700",
    "from-amber-500 to-amber-700", "from-cyan-500 to-cyan-700",
    "from-indigo-500 to-indigo-700", "from-pink-500 to-pink-700",
    "from-orange-500 to-orange-700", "from-teal-500 to-teal-700",
  ];
  return COLORS[index % COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString();
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-gray-700"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function AdminUserGovernance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { users: data, total } = await usersService.getAll();
      setUsers(data);
      setTotalCount(total);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Wait for Zustand auth hydration before fetching
  // so the axios interceptor has the token available
  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    } else {
      // No token after hydration → stop loading state
      setLoading(false);
    }
  }, [accessToken]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (statusFilter === "banned") filtered = filtered.filter((u) => u.is_banned);
    if (statusFilter === "active") filtered = filtered.filter((u) => !u.is_banned);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [users, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleToggleBan = async (userId: string) => {
    setBanLoading(userId);
    try {
      const updated = await usersService.toggleBan(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: updated.is_banned } : u));
    } catch (err) {
      console.error("Failed to toggle ban:", err);
    } finally {
      setBanLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await usersService.create(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ full_name: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">User Governance</h1>
          <p className="text-xs text-gray-500 mt-0.5">Audit user behavior, manage account statuses, and troubleshoot via Safe Mode impersonation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40">
            <Plus size={14} /> Create User
          </button>
          <button onClick={fetchUsers} disabled={loading} className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50 transition-all">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all active:scale-95">
            <Download size={12} /> Export Report
          </button>
        </div>
      </div>

      {/* Search + Filter + Total */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-violet-500/40 transition-colors max-w-md">
          <Search size={13} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-violet-500/40 transition-colors cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <div className="ml-auto text-xs text-gray-500">
          Total Users: <span className="text-white font-bold">{totalCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
          <span className="col-span-4">User</span>
          <span className="col-span-2 text-center">Account Type</span>
          <span className="col-span-2 text-center">Joined</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-3 text-center">Actions</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw size={28} className="text-gray-600 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No users found</p>
            </div>
          ) : (
            paginatedUsers.map((user, idx) => {
              const typeStyle = ACCOUNT_TYPE_STYLE[user.role] ?? ACCOUNT_TYPE_STYLE.CUSTOMER;
              const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
              const isBanned = user.is_banned;
              const isBanLoading = banLoading === user.id;
              return (
                <div key={user.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarBg(globalIdx)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {getInitials(user.full_name)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{user.full_name}</div>
                      <div className="text-[10px] text-gray-500">{user.email}</div>
                      {user.shops?.length > 0 && (
                        <div className="text-[9px] text-violet-400 mt-0.5 truncate max-w-[160px]">🏪 {user.shops.map(s => s.name).join(", ")}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${typeStyle.cls}`}>{typeStyle.label}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-gray-400">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBanned ? "bg-red-400" : "bg-emerald-400"}`} />
                    <span className={`text-[10px] font-bold uppercase ${isBanned ? "text-red-400" : "text-emerald-400"}`}>
                      {isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-3">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
                      <LogIn size={9} /> Safe Mode
                    </button>
                    <Toggle enabled={!isBanned} onChange={() => handleToggleBan(user.id)} />
                    <button
                      onClick={() => handleToggleBan(user.id)}
                      disabled={isBanLoading}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                        isBanned
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {isBanned ? <><UserCheck size={9} /> Unban</> : <><Ban size={9} /> Ban</>}
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
        <span className="text-xs text-gray-600">Showing {paginatedUsers.length} of {filteredUsers.length} filtered ({totalCount.toLocaleString()} total)</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-gray-500 hover:bg-white/5 hover:text-white"}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom: Safe Mode Guidelines */}
      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-violet-400" />
          <h3 className="text-base font-bold text-white">Safe Mode Guidelines</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-4 max-w-2xl">
          Remember: Safe Mode impersonation is fully audited. Any sensitive actions taken while acting as a user will be flagged for review. Use the Ban toggle to restrict access without deleting user data.
        </p>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/10 transition-colors">
          <FileText size={11} /> Read Protocol
        </button>
        <div className="absolute -bottom-4 -right-4 opacity-[0.03]"><ShieldCheck size={120} /></div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14121C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input required type="text" value={createForm.full_name} onChange={e => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none transition-colors" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                <input required type="tel" value={createForm.phone} onChange={e => setCreateForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none transition-colors" placeholder="0987654321" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                <input required minLength={6} type="password" value={createForm.password} onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none transition-colors" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Account Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none transition-colors cursor-pointer appearance-none">
                  <option value="CUSTOMER">Customer</option>
                  <option value="SHIPPER">Shipper</option>
                  <option value="MERCHANT">Merchant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={createLoading} className="w-full flex justify-center items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40 disabled:opacity-50">
                  {createLoading ? <RefreshCw size={16} className="animate-spin" /> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
