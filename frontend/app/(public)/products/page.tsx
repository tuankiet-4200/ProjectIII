"use client";

import { useState, useEffect } from "react";
import { formatVnd } from "@/lib/currency";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Star,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  brand: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sold: number;
  badge?: string;
  badgeColor?: string;
  discount?: number;
  bgFrom: string;
  bgTo: string;
  emoji: string;
  viewOnly?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "SonicMaster Elite Wireless Headphones",
    brand: "Aura Sound",
    location: "London",
    price: 1299,
    originalPrice: 1549,
    rating: 4.9,
    sold: 124,
    badge: "GỢI Ý SANG XỊN",
    badgeColor: "bg-violet-500",
    discount: -11,
    bgFrom: "#1a1a2e",
    bgTo: "#16213e",
    emoji: "🎧",
  },
  {
    id: 2,
    name: "Vintage Walnut Turntable Pro",
    brand: "Heritage HiFi",
    location: "Berlin",
    price: 2850,
    rating: 5.0,
    sold: 56,
    badge: "HÀNG MỚI VỀ",
    badgeColor: "bg-emerald-500",
    bgFrom: "#2d1b0e",
    bgTo: "#4a2c0a",
    emoji: "🎵",
    viewOnly: true,
  },
  {
    id: 3,
    name: "Reference Series 5 Monitor Speaker",
    brand: "Studio Pro",
    location: "Tokyo",
    price: 4200,
    rating: 4.8,
    sold: 96,
    badge: "SỐ LƯỢNG CÓ HẠN",
    badgeColor: "bg-red-500",
    bgFrom: "#f8f8f5",
    bgTo: "#e8e8e0",
    emoji: "🔊",
  },
  {
    id: 4,
    name: "Velvet Vocal C-99 Condenser Mic",
    brand: "AudioTech",
    location: "San Francisco",
    price: 850,
    rating: 4.7,
    sold: 2100,
    bgFrom: "#1a1a1a",
    bgTo: "#2d2d2d",
    emoji: "🎤",
  },
  {
    id: 5,
    name: "Acoustic Sphere Portable Speaker",
    brand: "Vibe Store",
    location: "New York",
    price: 349,
    rating: 4.9,
    sold: 5400,
    badge: "BÁN CHẠY NHẤT",
    badgeColor: "bg-amber-500",
    bgFrom: "#f5f0e8",
    bgTo: "#e8dcc8",
    emoji: "📻",
  },
  {
    id: 6,
    name: "Golden Era Tube Amplifier",
    brand: "Tube Haven",
    location: "Paris",
    price: 12500,
    rating: 5.0,
    sold: 12,
    badge: "KHUYÊN DÙNG",
    badgeColor: "bg-yellow-600",
    bgFrom: "#1c1209",
    bgTo: "#2d1a08",
    emoji: "🔆",
    viewOnly: true,
  },
  {
    id: 7,
    name: "Crystalline IEM Reference Earphones",
    brand: "AcousticLab",
    location: "Seoul",
    price: 680,
    rating: 4.6,
    sold: 890,
    bgFrom: "#0d1b2a",
    bgTo: "#1b2838",
    emoji: "🎶",
  },
  {
    id: 8,
    name: "NanoFi Wireless DAC/AMP Combo",
    brand: "TechPure",
    location: "Munich",
    price: 420,
    rating: 4.8,
    sold: 3200,
    badge: "ĐÁNH GIÁ CAO",
    badgeColor: "bg-purple-500",
    bgFrom: "#120824",
    bgTo: "#1e0f3c",
    emoji: "⚡",
  },
  {
    id: 9,
    name: "OakWood Vinyl Record Player",
    brand: "Craftsman Audio",
    location: "Oslo",
    price: 1750,
    rating: 4.9,
    sold: 445,
    bgFrom: "#1a0e06",
    bgTo: "#2d1a0a",
    emoji: "💿",
  },
];

const CATEGORIES = [
  { name: "Tất cả sản phẩm", count: 1246 },
  { name: "Âm thanh cao cấp", count: 412 },
  { name: "Đồng hồ cao cấp", count: 324 },
  { name: "Phụ kiện luxury", count: 512 },
];

const SORT_OPTIONS = [
  "Mới nhất",
  "Giá: Thấp đến Cao",
  "Giá: Cao đến Thấp",
  "Đánh giá tốt nhất",
  "Bán chạy nhất",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          className={
            s <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-white/10 text-foreground/10"
          }
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  wished,
  onToggleWish,
}: {
  product: Product;
  wished: boolean;
  onToggleWish: () => void;
}) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative rounded-2xl overflow-hidden border border-card-border bg-card hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)] transition-all duration-300 flex flex-col"
    >
      {/* Image area */}
      <div
        className="relative aspect-4/3 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.bgFrom}, ${product.bgTo})`,
        }}
      >
        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute top-3 left-3 z-10 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm text-foreground ${product.badgeColor}`}
          >
            {product.badge}
          </span>
        )}

        {/* Discount */}
        {product.discount && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-sm mt-6">
            GIẢM {Math.abs(product.discount)}%
          </span>
        )}

        {/* Wish button */}
        <button
          onClick={(event) => {
            event.preventDefault();
            onToggleWish();
          }}
          className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
            wished
              ? "bg-rose-500 text-white"
              : "bg-black/30 text-slate-600 dark:text-gray-300 hover:bg-black/50 hover:text-white"
          }`}
        >
          <Heart size={14} fill={wished ? "currentColor" : "none"} />
        </button>

        {/* Product visual */}
        <span className="text-6xl select-none group-hover:scale-110 transition-transform duration-300">
          {product.emoji}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1 mb-1">
          <MapPin size={9} />
          {product.brand} · {product.location}
        </p>
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-3 group-hover:text-violet-100 transition-colors">
          {product.name}
        </h3>

        {/* Rating & sold */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={product.rating} />
          <span className="text-[10px] text-yellow-400 font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 dark:text-gray-500">Đã bán {product.sold.toLocaleString()}</span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-extrabold text-violet-400">
              {formatVnd(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-[10px] text-slate-400 dark:text-gray-500 line-through">
                {formatVnd(product.originalPrice)}
              </div>
            )}
          </div>
          {product.viewOnly ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-xs font-semibold text-foreground shrink-0">
              Xem chi tiết
            </span>
          ) : (
            <button
              onClick={(event) => event.preventDefault()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-foreground hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-900/40 shrink-0"
            >
              <ShoppingCart size={13} />
              Thêm vào giỏ
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  activeCategory,
  setActiveCategory,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  verifiedOnly,
  setVerifiedOnly,
}: {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  priceRange: number;
  setPriceRange: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
}) {
  return (
    <aside className="w-64 shrink-0 space-y-6">
      {/* Categories */}
      <div className="rounded-2xl bg-card border border-card-border p-5">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 tracking-widest mb-4 flex items-center gap-2">
          <SlidersHorizontal size={13} />
          Danh mục sản phẩm
        </h3>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => (
            <li key={cat.name}>
              <button
                onClick={() => setActiveCategory(cat.name)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                  activeCategory === cat.name
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:bg-white/5 hover:text-foreground"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 font-mono ${
                    activeCategory === cat.name
                      ? "bg-white/20 text-foreground"
                      : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500"
                  }`}
                >
                  {cat.count.toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div className="rounded-2xl bg-card border border-card-border p-5">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 tracking-widest mb-4">
          💰 Khoảng giá
        </h3>
        <input
          type="range"
          min={0}
          max={15000000}
          step={500000}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-violet-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mt-2">
          <span>{formatVnd(0)}</span>
          <span className="text-violet-400 font-semibold">
            Tối đa {formatVnd(priceRange)}
          </span>
          <span>{formatVnd(15000000)}+</span>
        </div>
      </div>

      {/* Rating */}
      <div className="rounded-2xl bg-card border border-card-border p-5">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 tracking-widest mb-4">
          ⭐ Đánh giá khách hàng
        </h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => setMinRating(r)}
                className="accent-violet-500"
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={
                      s <= r
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-white/10 text-foreground/10"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 dark:text-gray-400 group-hover:text-foreground transition-colors">
                Trở lên
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Shop Type */}
      <div className="rounded-2xl bg-card border border-card-border p-5">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 tracking-widest mb-4">
          🏪 Loại cửa hàng
        </h3>
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <div
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
              verifiedOnly ? "border-violet-500 bg-violet-500" : "border-gray-600"
            }`}
          >
            {verifiedOnly && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <span className="text-sm text-slate-600 dark:text-gray-300">Shop đã xác minh</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
          <span className="text-sm text-slate-600 dark:text-gray-300">Chính hãng từ thương hiệu</span>
        </label>
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả sản phẩm");
  const [priceRange, setPriceRange] = useState(15000000);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortBy, setSortBy] = useState("Mới nhất");
  const [sortOpen, setSortOpen] = useState(false);
  const [wished, setWished] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const defaultSearch = searchParams.get('search') || "";
  const [search, setSearch] = useState(defaultSearch);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const TOTAL_PAGES = 52;

  // Try to load products from API with fallback to mock data
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { productsService } = await import('@/services/products.service');
        const queryParams: any = { page: 1, limit: 20 };
        if (defaultSearch) queryParams.search = defaultSearch;
        const result = await productsService.getAll(queryParams);
        if (result?.data?.length) {
          const EMOJI_MAP = ['🎧', '🎵', '🔊', '🎤', '📻', '🔆', '🎶', '⚡', '💿', '👜'];
          const BG_MAP = [
            { from: '#1a1a2e', to: '#16213e' }, { from: '#2d1b0e', to: '#4a2c0a' },
            { from: '#f8f8f5', to: '#e8e8e0' }, { from: '#1a1a1a', to: '#2d2d2d' },
            { from: '#f5f0e8', to: '#e8dcc8' }, { from: '#1c1209', to: '#2d1a08' },
            { from: '#0d1b2a', to: '#1b2838' }, { from: '#120824', to: '#1e0f3c' },
            { from: '#1a0e06', to: '#2d1a0a' }, { from: '#1a1a2e', to: '#16213e' },
          ];
          const mapped: Product[] = result.data.map((p: any, i: number) => ({
            id: i + 100,
            name: p.name,
            brand: p.shop?.name || 'LuxeMarket',
            location: 'Global',
            price: p.price,
            rating: 4.5 + Math.random() * 0.5,
            sold: p.sales_count || Math.floor(Math.random() * 500),
            bgFrom: BG_MAP[i % BG_MAP.length].from,
            bgTo: BG_MAP[i % BG_MAP.length].to,
            emoji: EMOJI_MAP[i % EMOJI_MAP.length],
          }));
          setApiProducts(mapped);
        }
      } catch {
        // Fallback to mock data silently
      }
    };
    loadProducts();
  }, []);

  const toggleWish = (id: number) => {
    setWished((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Use API products if available, otherwise fallback to mock
  const sourceProducts = apiProducts.length > 0 ? apiProducts : ALL_PRODUCTS;

  const filteredProducts = sourceProducts.filter(
    (p) =>
      p.price <= priceRange &&
      (minRating === 0 || p.rating >= minRating) &&
      (search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* ─── Page Header ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 mb-3">
            <Link href="/" className="hover:text-violet-400 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-gray-300">Cửa hàng</span>
            <span>/</span>
            <span className="text-violet-400">{activeCategory}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">{activeCategory}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Hiển thị 1–{filteredProducts.length} trong số{" "}
            <span className="text-foreground font-medium">1,246</span> kết quả
          </p>
        </div>

        <div className="flex gap-8">
          {/* ─── Desktop Sidebar ─── */}
          <div className="hidden lg:block">
            <Sidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              minRating={minRating}
              setMinRating={setMinRating}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={setVerifiedOnly}
            />
          </div>

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Search */}
              <div className="flex-1 min-w-48 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-card-border px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
                <Search size={14} className="text-slate-400 dark:text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-slate-400 dark:text-gray-600 focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X size={13} className="text-slate-400 dark:text-gray-500 hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-card-border px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 hover:text-foreground transition-colors"
              >
                <SlidersHorizontal size={14} />
                Bộ lọc
              </button>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-card-border px-4 py-2.5 text-sm text-slate-600 dark:text-gray-300 hover:text-foreground transition-colors"
                >
                  <span className="font-medium text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide">
                    Sắp xếp
                  </span>
                  <span className="text-foreground font-semibold">{sortBy}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl bg-[#1C1828] border border-border dark:border-white/10 shadow-2xl overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          sortBy === opt
                            ? "text-violet-400 bg-violet-500/10"
                            : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View mode */}
              <div className="flex rounded-xl border border-card-border bg-slate-100 dark:bg-white/5 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 dark:text-gray-500 hover:text-foreground"
                  }`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 dark:text-gray-500 hover:text-foreground"
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Mobile sidebar slidedown */}
            {showMobileSidebar && (
              <div className="lg:hidden mb-6">
                <Sidebar
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  verifiedOnly={verifiedOnly}
                  setVerifiedOnly={setVerifiedOnly}
                />
              </div>
            )}

            {/* Active filters chips */}
            {(minRating > 0 || priceRange < 15000000 || search) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {minRating > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs px-3 py-1">
                    ⭐ {minRating}+ sao
                    <button onClick={() => setMinRating(0)}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {priceRange < 15000000 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs px-3 py-1">
                    💰 Tối đa {formatVnd(priceRange)}
                    <button onClick={() => setPriceRange(15000000)}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {search && (
                  <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs px-3 py-1">
                    🔍 "{search}"
                    <button onClick={() => setSearch("")}>
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="text-5xl mb-4">🔍</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-sm text-slate-400 dark:text-gray-500">
                  Hãy thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                    : "flex flex-col gap-4"
                }
              >
                {filteredProducts.map((product) =>
                  viewMode === "grid" ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      wished={wished.has(product.id)}
                      onToggleWish={() => toggleWish(product.id)}
                    />
                  ) : (
                    /* List view */
                    <div
                      key={product.id}
                      className="group flex gap-4 rounded-2xl bg-card border border-card-border hover:border-violet-500/30 transition-all overflow-hidden p-4"
                    >
                      <div
                        className="w-28 h-28 rounded-xl shrink-0 flex items-center justify-center text-4xl"
                        style={{
                          background: `linear-gradient(135deg, ${product.bgFrom}, ${product.bgTo})`,
                        }}
                      >
                        {product.emoji}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <MapPin size={9} />
                            {product.brand} · {product.location}
                          </p>
                          <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-violet-100">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={product.rating} />
                            <span className="text-[10px] text-yellow-400 font-bold">
                              {product.rating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500">
                              Đã bán {product.sold.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-base font-extrabold text-violet-400">
                            {formatVnd(product.price)}
                            {product.originalPrice && (
                              <span className="ml-2 text-xs text-slate-400 dark:text-gray-500 line-through font-normal">
                                {formatVnd(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleWish(product.id)}
                              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                                wished.has(product.id)
                                  ? "bg-rose-500 border-rose-500 text-white"
                                  : "border-border dark:border-white/10 text-slate-400 dark:text-gray-500 hover:text-foreground hover:border-white/30"
                              }`}
                            >
                              <Heart
                                size={13}
                                fill={wished.has(product.id) ? "currentColor" : "none"}
                              />
                            </button>
                            {product.viewOnly ? (
                              <Link
                                href={`/products/${product.id}`}
                                className="text-xs rounded-lg bg-slate-100 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-1.5 font-semibold hover:bg-white/10 transition-colors"
                              >
                                Xem chi tiết
                              </Link>
                            ) : (
                              <button className="flex items-center gap-1 text-xs rounded-lg bg-violet-600 px-3 py-1.5 font-semibold hover:bg-violet-500 transition-colors">
                                <ShoppingCart size={12} /> Thêm vào giỏ
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ─── Pagination ─── */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 rounded-lg flex items-center justify-center border border-border dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-violet-500/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                    currentPage === p
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                      : "border border-border dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-violet-500/50 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}

              <span className="text-slate-400 dark:text-gray-600 px-1">...</span>

              <button
                onClick={() => setCurrentPage(TOTAL_PAGES)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                  currentPage === TOTAL_PAGES
                    ? "bg-violet-600 text-white"
                    : "border border-border dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-violet-500/50 hover:text-foreground"
                }`}
              >
                {TOTAL_PAGES}
              </button>

              <button
                onClick={() => setCurrentPage(Math.min(TOTAL_PAGES, currentPage + 1))}
                disabled={currentPage === TOTAL_PAGES}
                className="h-9 w-9 rounded-lg flex items-center justify-center border border-border dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-violet-500/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
