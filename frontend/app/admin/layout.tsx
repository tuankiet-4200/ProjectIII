"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderTree,
  Store,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  ShieldCheck,
  Wifi,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  href: string;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ─── Navigation Data ─────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Management",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/analytics" },
      { id: "categories", label: "Categories", icon: FolderTree, href: "/admin/categories" },
      { id: "shops", label: "Shop Reviews", icon: Store, href: "/admin/shops", badge: 12 },
      { id: "users", label: "User Governance", icon: Users, href: "/admin/users" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
      { id: "logout", label: "Logout", icon: LogOut, href: "/logout" },
    ],
  },
];

// Map path prefixes to nav IDs
function getActiveNavId(pathname: string): string {
  if (pathname.startsWith("/admin/shops")) return "shops";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/analytics")) return "dashboard";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}

// Map path to breadcrumb label
function getBreadcrumbLabel(pathname: string): string {
  if (pathname.startsWith("/admin/shops")) return "Shop Reviews";
  if (pathname.startsWith("/admin/users")) return "User Governance";
  if (pathname.startsWith("/admin/categories")) return "Categories";
  if (pathname.startsWith("/admin/analytics")) return "Dashboard";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Dashboard";
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);
  const breadcrumbLabel = getBreadcrumbLabel(pathname);

  return (
    <div className="flex h-screen bg-[#0B0A10] text-white overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/5 bg-[#0F0D1A]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white block leading-tight">
              Admin Console
            </span>
            <span className="text-[9px] font-bold text-emerald-400 tracking-widest">
              GOVERNANCE V2.4
            </span>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[9px] uppercase tracking-[0.2em] font-bold text-gray-600">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeNavId === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon size={15} className="shrink-0" />
                      <span className="flex-1 text-xs">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-violet-500 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User pill */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Alex Sterling</div>
              <div className="text-[10px] text-emerald-400">Super Admin</div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <Settings size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-white/5 bg-[#0F0D1A]/60 backdrop-blur-md shrink-0">
          <h2 className="text-sm font-bold text-white">Admin Console</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span>Management</span>
            <span>/</span>
            <span className="text-violet-400">{breadcrumbLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-colors max-w-xs">
              <Search size={13} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Global search..."
                className="bg-transparent text-xs text-white placeholder:text-gray-600 outline-none w-40"
              />
            </div>
            <button className="relative text-gray-500 hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-[#0F0D1A] text-[8px] flex items-center justify-center font-bold">
                7
              </span>
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <Wifi size={11} /> System Online
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
