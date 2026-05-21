"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { shopsService } from "@/services/shops.service";
import { getPublicImageUrl } from "@/lib/images";
import { formatVnd } from "@/lib/currency";
import Link from "next/link";
import {
  Star,
  Users,
  BadgeCheck,
  Share2,
  MessageSquare,
  ShoppingCart,
  Heart,
  MoreHorizontal,
  MapPin,
  Package,
  TrendingUp,
  Award,
  ChevronRight,
  Search,
  Mail,
  Globe,
  Loader2,
  Store,
  Tag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "home" | "products" | "reviews" | "about";

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-foreground/10 text-foreground/10"
          }
        />
      ))}
    </div>
  );
}

// ─── Real Product Card ────────────────────────────────────────────────────────

function ProductCard({ product }: { product: any }) {
  const [wished, setWished] = useState(false);
  const imageUrl = getPublicImageUrl(product.images?.[0]);

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-violet-500/30 hover:shadow-[0_0_24px_rgba(139,92,246,0.08)] transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/3] flex items-center justify-center bg-slate-100 dark:bg-white/5 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package size={40} className="text-slate-300 dark:text-white/20" />
        )}
        <button
          onClick={(e) => { e.preventDefault(); setWished(!wished); }}
          className={`absolute top-2 right-2 z-10 h-7 w-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            wished ? "bg-rose-500 text-white" : "bg-black/20 text-slate-600 dark:text-gray-300 hover:text-white"
          }`}
        >
          <Heart size={12} fill={wished ? "currentColor" : "none"} />
        </button>
        {product.category?.name && (
          <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-violet-600 text-white">
            {product.category.name}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-violet-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-extrabold text-violet-500">
            {formatVnd(Number(product.price))}
          </span>
          <button
            onClick={(e) => e.preventDefault()}
            className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/50"
          >
            <ShoppingCart size={12} className="text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────

function HomeTab({ shop }: { shop: any }) {
  const products = shop?.products || [];
  const featured = products.slice(0, 8);

  // Group products by category
  const categoryMap = new Map<string, number>();
  products.forEach((p: any) => {
    const cat = p.category?.name || "Khác";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-10">
      {/* Featured Items */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Sản phẩm nổi bật</h2>
          <button
            onClick={() => {}}
            className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 font-medium transition-colors"
          >
            Xem tất cả <ChevronRight size={13} />
          </button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-card-border p-10 text-center text-sm text-slate-400 dark:text-gray-500">
            Cửa hàng chưa có sản phẩm nào.
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-5">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center gap-3 rounded-xl bg-card border border-card-border p-4 hover:border-violet-500/40 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shrink-0">
                  <Tag size={16} className="text-violet-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500">{cat.count} sản phẩm</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Sản phẩm", value: `${shop?._count?.products || 0}` },
          { icon: Star, label: "Đánh giá TB", value: Number(shop?.rating || 0).toFixed(1) },
          { icon: Award, label: "Trạng thái", value: shop?.status === "ACTIVE" ? "Đang hoạt động" : shop?.status || "—" },
          { icon: TrendingUp, label: "Tham gia từ", value: shop?.created_at ? new Date(shop.created_at).toLocaleDateString("vi-VN") : "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-card-border py-6 px-4 text-center"
          >
            <stat.icon size={22} className="text-violet-500" />
            <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
            <div className="text-xs text-slate-400 dark:text-gray-500">{stat.label}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProductsTab({ shop }: { shop: any }) {
  const [search, setSearch] = useState("");
  const products: any[] = shop?.products || [];
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-card border border-card-border rounded-xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
          <Search size={14} className="text-slate-400 dark:text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Tìm sản phẩm trong cửa hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-gray-500 shrink-0">{filtered.length} sản phẩm</span>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-card-border p-10 text-center text-sm text-slate-400 dark:text-gray-500">
          {search ? "Không tìm thấy sản phẩm phù hợp." : "Cửa hàng chưa có sản phẩm."}
        </div>
      )}
    </div>
  );
}

function ReviewsTab({ shopId }: { shopId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; avgRating: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api")}/reviews/shop/${shopId}`
        );
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setStats({ total: data.total || 0, avgRating: data.avgRating || 0 });
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const avgRating = stats?.avgRating || 0;
  const total = stats?.total || 0;
  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    pct: total > 0
      ? Math.round((reviews.filter((r) => r.rating === s).length / total) * 100)
      : 0,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-8 rounded-2xl bg-card border border-card-border p-6">
        <div className="flex flex-col items-center justify-center text-center md:w-40 shrink-0">
          <div className="text-6xl font-black text-foreground mb-1">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
          <StarRating rating={avgRating} size={16} />
          <div className="text-xs text-slate-400 dark:text-gray-500 mt-2">{total.toLocaleString()} đánh giá</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-gray-500 w-6 text-right">{stars}</span>
              <Star size={11} className="fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-gray-500 w-8">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-card border border-card-border p-10 text-center text-sm text-slate-400 dark:text-gray-500">
          Chưa có đánh giá nào cho cửa hàng này.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="rounded-2xl bg-card border border-card-border p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {review.user?.full_name?.slice(0, 2).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{review.user?.full_name || "Ẩn danh"}</span>
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <BadgeCheck size={9} /> VERIFIED
                    </span>
                    <span className="text-xs text-slate-400 dark:text-gray-500 ml-auto">
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} />
                    {review.product?.name && (
                      <>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500">cho</span>
                        <span className="text-[10px] text-violet-500 font-medium truncate">{review.product.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutTab({ shop }: { shop: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border border-card-border p-6">
        <h3 className="text-base font-bold text-foreground mb-3">Về Cửa Hàng</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
          {shop?.description || "Cửa hàng này chưa có mô tả."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: MapPin, label: "Địa điểm", value: "Việt Nam" },
          {
            icon: Package,
            label: "Thành viên từ",
            value: shop?.created_at
              ? new Date(shop.created_at).toLocaleDateString("vi-VN")
              : "—",
          },
          { icon: MessageSquare, label: "Phản hồi", value: "< 2 giờ" },
          {
            icon: TrendingUp,
            label: "Sản phẩm",
            value: `${shop?._count?.products || 0} sản phẩm`,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl bg-card border border-card-border p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-violet-500" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-gray-500 font-semibold">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-card-border p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Liên hệ</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-500 transition-all">
            <Globe size={14} /> Website
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-500 transition-all">
            <Mail size={14} /> Email
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-500 transition-all">
            <MessageSquare size={14} /> Nhắn tin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopProfilePage() {
  const params = useParams();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        const shopId = params?.id as string;
        if (!shopId) return;
        const data = await shopsService.getById(shopId);
        setShop(data);
      } catch (err) {
        console.error("Failed to load shop", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [params?.id]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "home", label: "Cửa hàng" },
    { id: "products", label: `Sản phẩm${shop?._count?.products ? ` (${shop._count.products})` : ""}` },
    { id: "reviews", label: "Đánh giá" },
    { id: "about", label: "Giới thiệu" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="animate-spin text-violet-500 mb-2" size={32} />
        <span className="text-sm text-slate-400 dark:text-gray-400">Đang tải thông tin cửa hàng...</span>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <span className="text-sm text-slate-400 dark:text-gray-400">Không tìm thấy thông tin cửa hàng.</span>
        <Link href="/" className="mt-4 text-xs font-bold text-violet-500 hover:underline">Về Trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* ─── Banner (Scrolls away) ─── */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#1a0533] via-[#2d0a4e] to-[#0d001a]">
        {/* Decorative glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-48 rounded-full bg-violet-500/15 blur-[80px]" />
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60 shadow-[0_0_40px_15px_rgba(255,255,255,0.2)] pointer-events-none" />

        {/* Top-right actions */}
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <button className="h-8 w-8 rounded-full backdrop-blur-md bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/50 transition-all">
            <Share2 size={14} />
          </button>
          <button className="h-8 w-8 rounded-full backdrop-blur-md bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/50 transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Empty banner space */}
        <div className="h-20 md:h-32" />
      </div>

      {/* ─── Shop Info Bar & Tabs (Sticky) ─── */}
      <div className="sticky top-16 z-30">
        {/* Shop info row — dark background to blend with banner when at top */}
        <div className="relative bg-[#0d001a]/95 backdrop-blur-md border-t border-white/5">
          <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-3">
            <div className="flex items-center gap-4">
              {/* Avatar — circle, no border, blends into dark bg */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center overflow-hidden shadow-lg">
                  {shop.logo_url ? (
                    <img
                      src={getPublicImageUrl(shop.logo_url)}
                      className="w-full h-full object-cover"
                      alt={shop.name}
                    />
                  ) : (
                    <Store size={28} className="text-white/70" />
                  )}
                </div>
                {/* Online badge */}
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#1a0533]" />
              </div>

              {/* Name, stats, CTAs */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base md:text-lg font-extrabold text-white leading-tight">{shop.name}</h1>
                  <BadgeCheck size={15} className="text-violet-400 shrink-0" />
                  {shop.status === "ACTIVE" && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-violet-600 text-white shrink-0">
                      Chính hãng
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                    <Star size={10} className="fill-yellow-400" />
                    {Number(shop.rating || 0).toFixed(1)}
                  </div>
                  <span className="text-white/30 text-xs">|</span>
                  <span className="text-xs text-white/60">
                    {shop._count?.products || 0} sản phẩm
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setFollowed(!followed)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-95 border ${
                    followed
                      ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                      : "bg-white border-white text-violet-900 hover:bg-white/90"
                  }`}
                >
                  <Users size={12} />
                  {followed ? "Đang theo dõi" : "Theo dõi"}
                </button>
                <button className="h-8 w-8 rounded-lg border border-white/20 bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all">
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs bar (on card bg, below banner) ─── */}
        <div className="bg-card/95 backdrop-blur-md border-b border-card-border shadow-sm">
          <div className="container mx-auto max-w-7xl px-4 lg:px-6">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-500"
                      : "border-transparent text-slate-400 dark:text-gray-500 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {activeTab === "home" && <HomeTab shop={shop} />}
        {activeTab === "products" && <ProductsTab shop={shop} />}
        {activeTab === "reviews" && <ReviewsTab shopId={shop.id} />}
        {activeTab === "about" && <AboutTab shop={shop} />}
      </div>
    </div>
  );
}
