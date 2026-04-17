"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Heart, Grid } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAuthenticatedUI = mounted && isAuthenticated && !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/55 backdrop-blur-xl supports-backdrop-filter:bg-white/45 dark:border-white/10 dark:bg-[#0B0914]/65">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <span className="text-sm font-bold text-white">P3</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ProjectIII</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex max-w-2xl">
          <div className="flex h-10 w-full items-center rounded-full border border-black/10 bg-white/65 px-4 text-sm shadow-sm shadow-black/5 transition-all focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-400/20 dark:border-white/15 dark:bg-white/5">
            <button className="flex shrink-0 items-center gap-2 border-r border-black/10 pr-4 text-slate-500 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white">
              <Grid size={16} />
              <span>Categories</span>
            </button>
            <input
              type="text"
              placeholder="Search premium products..."
              className="flex-1 bg-transparent px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
            />
            <button className="shrink-0 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="relative text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <ShoppingCart size={22} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-sm">
              3
            </span>
          </button>
          <button className="text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <Heart size={22} />
          </button>

          {showAuthenticatedUI ? (
            <>
              <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white/60 py-1 pl-1 pr-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                  {(user.full_name || user.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden flex-col items-start text-xs sm:flex">
                  <span className="font-semibold text-slate-900 dark:text-white">{user.full_name}</span>
                  <span className="text-slate-500 dark:text-gray-400">{user.role}</span>
                </div>
              </div>
              <Link
                href="/logout"
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300"
              >
                Logout
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
