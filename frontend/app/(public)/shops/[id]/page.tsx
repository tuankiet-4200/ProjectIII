"use client";

import { useState } from "react";
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
  Watch,
  Headphones,
  Shirt,
  Smartphone,
  Briefcase,
  MoreHorizontal,
  MapPin,
  Package,
  TrendingUp,
  Award,
  ChevronRight,
  Search,
  Mail,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "home" | "products" | "categories" | "reviews" | "about";

interface FeaturedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  badge?: string;
  badgeColor?: string;
  isHot?: boolean;
}

interface ShopCategory {
  icon: React.FC<{ size?: number; className?: string }>;
  name: string;
  count: number;
}

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  productName: string;
  verified: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SHOP = {
  name: "Luxe Essentials",
  handle: "@luxe.essentials",
  rating: 4.9,
  totalReviews: 2847,
  followers: "12.5k",
  following: 84,
  products: 412,
  badge: "Top Rated Vendor",
  location: "New York, USA",
  joined: "March 2021",
  description:
    "Curated selection of the world's most sought-after audio equipment, watches, and premium tech accessories. Each product hand-verified by our expert team for authenticity and quality.",
  bannerGradient: "from-[#1a0533] via-[#2d0a4e] to-[#0d001a]",
  logoEmoji: "💎",
  responseTime: "< 2 hours",
  shipped: "10k+",
};

const FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    id: 1,
    name: "Lunar Series Minimalist Watch",
    category: "TECH & ACCESSORIES",
    price: 249,
    emoji: "⌚",
    bgFrom: "#f8f8f8",
    bgTo: "#e0e0e0",
    badge: "NEW ARRIVAL",
    badgeColor: "bg-emerald-500",
  },
  {
    id: 2,
    name: "Sonic‑X Noise Cancelling Headphones",
    category: "AUDIO",
    price: 189,
    originalPrice: 249,
    emoji: "🎧",
    bgFrom: "#1a1a1a",
    bgTo: "#2d2d2d",
  },
  {
    id: 3,
    name: "Velocita Performance Pro Sneaker",
    category: "FOOTWEAR",
    price: 155,
    emoji: "👟",
    bgFrom: "#fff0f0",
    bgTo: "#ffd6d6",
    isHot: true,
  },
  {
    id: 4,
    name: "Retrospect 35mm Analog Camera",
    category: "PHOTOGRAPHY",
    price: 420,
    emoji: "📷",
    bgFrom: "#1a1209",
    bgTo: "#2d1f0a",
  },
];

const SHOP_CATEGORIES: ShopCategory[] = [
  { icon: Watch, name: "Watches", count: 64 },
  { icon: Headphones, name: "Audio", count: 89 },
  { icon: Shirt, name: "Apparel", count: 112 },
  { icon: Smartphone, name: "Gadgets", count: 78 },
  { icon: Briefcase, name: "Office", count: 43 },
  { icon: MoreHorizontal, name: "Others", count: 26 },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Marcus A.",
    avatar: "M",
    rating: 5,
    date: "March 12, 2026",
    comment:
      "Absolutely stunning watch — arrived in perfect condition with premium packaging. The quality far exceeded my expectations. Will definitely order again!",
    productName: "Lunar Series Minimalist Watch",
    verified: true,
  },
  {
    id: 2,
    name: "Sophie L.",
    avatar: "S",
    rating: 5,
    date: "March 8, 2026",
    comment:
      "Best audio shop on the platform. Fast shipping, responsive customer service, and the headphones sound incredible. 10/10.",
    productName: "Sonic‑X Noise Cancelling Headphones",
    verified: true,
  },
  {
    id: 3,
    name: "Ethan K.",
    avatar: "E",
    rating: 4,
    date: "February 28, 2026",
    comment:
      "Great camera, very authentic. Delivery took a bit longer than expected but the seller kept me updated throughout the process.",
    productName: "Retrospect 35mm Analog Camera",
    verified: true,
  },
  {
    id: 4,
    name: "Priya M.",
    avatar: "P",
    rating: 5,
    date: "February 20, 2026",
    comment:
      "Stunning sneakers — exactly as described. The shop is clearly passionate about quality. A genuine luxury experience.",
    productName: "Velocita Performance Pro Sneaker",
    verified: false,
  },
];

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
              : "fill-white/10 text-white/10"
          }
        />
      ))}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: FeaturedProduct }) {
  const [wished, setWished] = useState(false);
  return (
    <div className="group rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden hover:border-violet-500/30 hover:shadow-[0_0_24px_rgba(139,92,246,0.08)] transition-all duration-300 flex flex-col">
          <div
            className="relative aspect-4/3 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${product.bgFrom}, ${product.bgTo})`,
        }}
      >
        {product.badge && (
          <span
            className={`absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm text-white ${product.badgeColor}`}
          >
            {product.badge}
          </span>
        )}
        {product.isHot && (
          <span className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm text-white bg-red-500">
            HOT
          </span>
        )}
        <button
          onClick={() => setWished(!wished)}
          className={`absolute top-2 right-2 z-10 h-7 w-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            wished ? "bg-rose-500 text-white" : "bg-black/30 text-gray-300 hover:text-white"
          }`}
        >
          <Heart size={12} fill={wished ? "currentColor" : "none"} />
        </button>
        <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">
          {product.emoji}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400">
          {product.category}
        </p>
        <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-violet-100">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <div>
               <span className="text-sm font-extrabold text-violet-400">
                 {formatVnd(Number(product.price))}
            </span>
            {product.originalPrice && (
              <span className="ml-1.5 text-[10px] text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <button className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 active:scale-95 transition-all shadow shadow-violet-900/50">
            <ShoppingCart size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────

function HomeTab() {
  return (
    <div className="space-y-10">
      {/* Featured Items */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Featured Items</h2>
          <Link
            href="#"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            View All <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURED_PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Shop Categories */}
      <section>
        <h2 className="text-lg font-bold text-white mb-5">Shop Categories</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              className="group flex flex-col items-center gap-2 rounded-xl bg-[#1C1828] border border-white/5 p-4 hover:border-violet-500/40 hover:bg-[#231f33] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <cat.icon size={18} className="text-violet-400" />
              </div>
              <span className="text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                {cat.name}
              </span>
              <span className="text-[10px] text-gray-600">{cat.count} items</span>
            </button>
          ))}
        </div>
      </section>

      {/* Shop stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Products", value: SHOP.products + "+" },
          { icon: TrendingUp, label: "Items Shipped", value: SHOP.shipped },
          { icon: Star, label: "Avg Rating", value: SHOP.rating.toFixed(1) },
          { icon: Award, label: "Total Reviews", value: SHOP.totalReviews.toLocaleString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#14121C] border border-white/5 py-6 px-4 text-center"
          >
            <stat.icon size={22} className="text-violet-400" />
            <div className="text-2xl font-extrabold text-white">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState("");
  const products = [...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS.map((p) => ({ ...p, id: p.id + 10 }))];
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search in this shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{filtered.length} items</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SHOP_CATEGORIES.map((cat) => (
        <button
          key={cat.name}
          className="group flex items-center gap-4 rounded-2xl bg-[#14121C] border border-white/5 p-5 hover:border-violet-500/30 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shrink-0">
            <cat.icon size={22} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white group-hover:text-violet-100">
              {cat.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{cat.count} products available</div>
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
        </button>
      ))}
    </div>
  );
}

function ReviewsTab() {
  const avgRating = SHOP.rating;
  const ratingDist = [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 14 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-8 rounded-2xl bg-[#14121C] border border-white/5 p-6">
        <div className="flex flex-col items-center justify-center text-center md:w-40 shrink-0">
          <div className="text-6xl font-black text-white mb-1">{avgRating}</div>
          <StarRating rating={avgRating} size={16} />
          <div className="text-xs text-gray-500 mt-2">{SHOP.totalReviews.toLocaleString()} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-6 text-right">{stars}</span>
              <Star size={11} className="fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-600 to-violet-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {REVIEWS.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl bg-[#14121C] border border-white/5 p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{review.name}</span>
                  {review.verified && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <BadgeCheck size={9} /> VERIFIED
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">{review.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  <span className="text-[10px] text-gray-500">for</span>
                  <span className="text-[10px] text-violet-400 font-medium truncate">
                    {review.productName}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6">
        <h3 className="text-base font-bold text-white mb-3">About the Shop</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{SHOP.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: MapPin, label: "Location", value: SHOP.location },
          { icon: Package, label: "Member Since", value: SHOP.joined },
          { icon: MessageSquare, label: "Response Time", value: SHOP.responseTime },
          { icon: TrendingUp, label: "Orders Fulfilled", value: SHOP.shipped },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl bg-[#14121C] border border-white/5 p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-violet-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#14121C] border border-white/5 p-6">
        <h3 className="text-base font-bold text-white mb-4">Contact & Links</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="#"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all"
          >
            <Globe size={14} /> Official Website
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all"
          >
            <Mail size={14} /> Send Email
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all"
          >
            <MessageSquare size={14} /> Message Shop
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [followed, setFollowed] = useState(false);

  const TABS: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "products", label: "All Products" },
    { id: "categories", label: "Categories" },
    { id: "reviews", label: "Reviews" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white">

      {/* ─── Banner ─── */}
      <div className={`relative h-52 md:h-64 w-full bg-linear-to-r ${SHOP.bannerGradient} overflow-hidden`}>
        {/* Decorative glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full bg-violet-500/20 blur-[80px]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow-[0_0_60px_20px_rgba(255,255,255,0.3)] pointer-events-none" />

        {/* Actions overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button className="h-8 w-8 rounded-full backdrop-blur-md bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/50 transition-all">
            <Share2 size={14} />
          </button>
          <button className="h-8 w-8 rounded-full backdrop-blur-md bg-black/30 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/50 transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ─── Shop Info Bar ─── */}
      <div className="border-b border-white/5 bg-[#0F0D1A]/80 backdrop-blur-md sticky top-16 z-30">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          {/* Info row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 pb-4">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-violet-700 to-violet-900 border-2 border-white/10 shadow-2xl flex items-center justify-center text-3xl">
                {SHOP.logoEmoji}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-500 border-2 border-[#0F0D1A] flex items-center justify-center">
                <BadgeCheck size={11} className="text-white" />
              </div>
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-white">{SHOP.name}</h1>
                <BadgeCheck size={16} className="text-violet-400" />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                  <Star size={11} className="fill-yellow-400" />
                  {SHOP.rating} Rating
                </div>
                <span className="text-gray-600 text-xs">•</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users size={11} />
                  {SHOP.followers} Followers
                </div>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-xs text-violet-400 font-semibold">{SHOP.badge}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 pb-1 shrink-0">
              <button
                onClick={() => setFollowed(!followed)}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all active:scale-95 ${
                  followed
                    ? "bg-white/10 border border-white/10 text-white hover:bg-white/15"
                    : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/50"
                }`}
              >
                <Users size={14} />
                {followed ? "Following" : "Follow Shop"}
              </button>
              <button className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                <MessageSquare size={14} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "about" && <AboutTab />}
      </div>
    </div>
  );
}
