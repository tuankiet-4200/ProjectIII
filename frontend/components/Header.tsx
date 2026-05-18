"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Grid, Store, ChevronRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { shopsService } from "@/services/shops.service";
import { categoriesService } from "@/services/categories.service";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { Category } from "@/types";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const totalItems = useCartStore((state) => state.totalItems);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const [mounted, setMounted] = useState(false);
  const [hasShop, setHasShop] = useState<boolean | null>(null); // null = loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    let isActive = true;
    categoriesService.getAll()
      .then((data) => {
        if (!isActive) return;
        setCategories(data || []);
        if (data?.length) setActiveCategoryId(data[0].id);
      })
      .catch(() => {
        if (!isActive) return;
        setCategories([]);
        setActiveCategoryId(null);
      });
    return () => {
      isActive = false;
    };
  }, []);

  // Check if the logged-in customer already owns a shop
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasShop(null);
      return;
    }
    // ADMINs always have "shop access"
    if (user.role === "ADMIN") {
      setHasShop(true);
      return;
    }
    shopsService.getMyShop()
      .then(() => setHasShop(true))
      .catch(() => setHasShop(false));
  }, [isAuthenticated, user]);

  const showAuthenticatedUI = mounted && isAuthenticated && !!user;
  const activeCategory = categories.find((cat) => cat.id === activeCategoryId) || categories[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">ProjectIII</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex max-w-2xl">
          <div className="flex h-10 w-full items-center rounded-full border border-card-border bg-card/65 px-4 text-sm shadow-sm transition-all focus-within:border-purple-400/60 focus-within:ring-2 focus-within:ring-purple-400/20">
            <div className="relative group flex shrink-0 items-center border-r border-card-border pr-4">
              <button className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-foreground">
                <Grid size={16} />
                <span>Categories</span>
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-3 w-190 rounded-2xl border border-card-border bg-background shadow-2xl opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-[220px_1fr] gap-4 p-4">
                  <div className="rounded-xl border border-card-border bg-card/70 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-2">Danh mục</div>
                    <ul className="space-y-1.5">
                      {categories.length ? categories.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/categories/${item.slug}`}
                            onMouseEnter={() => setActiveCategoryId(item.id)}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                              activeCategory?.id === item.id
                                ? "bg-purple-500/10 text-foreground"
                                : "text-slate-600 dark:text-gray-300 hover:bg-purple-500/10 hover:text-foreground"
                            }`}
                          >
                            <Grid size={15} className="text-purple-500" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      )) : (
                        <li className="px-2.5 py-2 text-xs text-slate-400 dark:text-gray-500">Chưa có danh mục</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-card-border bg-card/60 p-4 min-h-60">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3">
                      {activeCategory?.name || "Danh mục con"}
                    </div>
                    {activeCategory?.children?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {activeCategory.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-purple-500/40 hover:text-foreground transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-gray-500">Không có danh mục con</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search premium products..."
              className="flex-1 bg-transparent px-4 py-2 text-foreground placeholder:text-gray-500 focus:outline-none"
            />
            <button className="shrink-0 text-slate-500 dark:text-gray-400 hover:text-foreground">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          <Link href="/cart" className="relative text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors">
            <ShoppingCart size={22} />
            {mounted && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-sm animate-in fade-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </Link>

          {/* ─── Vendor / Seller CTA ─────────────────────────── */}
          {showAuthenticatedUI && user.role !== "ADMIN" && user.role !== "SHIPPER" && (
            hasShop === true ? (
              // Already a vendor → "My Store" button
              <Link
                href="/vendor/dashboard"
                className="group hidden sm:flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20 hover:border-purple-500/50"
              >
                <Store size={13} className="shrink-0" />
                <span>My Store</span>
                <ChevronRight size={11} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : hasShop === false ? (
              // Not a vendor yet → "Become a Seller" CTA
              <Link
                href="/seller/register"
                className="group hidden sm:flex items-center gap-2 rounded-full bg-linear-to-r from-orange-500 to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-95"
              >
                <Sparkles size={12} className="shrink-0" />
                <span>Sell on ProjectIII</span>
              </Link>
            ) : null
          )}

          {showAuthenticatedUI ? (
            <>
              <Link href="/profile" className="flex items-center gap-3 rounded-full border border-card-border bg-card py-1 pl-1 pr-3 shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-purple-600 text-xs font-bold text-white">
                  {(user.full_name || user.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden flex-col items-start text-xs sm:flex">
                  <span className="font-semibold text-foreground">{user.full_name}</span>
                  <span className="text-slate-500 dark:text-gray-400">{user.role}</span>
                </div>
              </Link>
              <Link
                href="/logout"
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
              >
                Logout
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-card-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:opacity-80"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500"
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
