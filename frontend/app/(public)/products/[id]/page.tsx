"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Plus,
  Minus,
  Shield,
  Truck,
  RotateCcw,
  ChevronRight,
  Store,
  BadgeCheck,
  Share2,
  Check,
  ThumbsUp,
  MessageSquare,
  Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DetailTab = "details" | "specifications" | "reviews" | "shipping";

interface RelatedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  rating: number;
}

interface Review {
  id: number;
  name: string;
  avatar: string;
  avatarBg: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  verified: boolean;
}

// ─── Mock Product ─────────────────────────────────────────────────────────────

const PRODUCT = {
  id: 1,
  name: "Eclipse Gen-2 Wireless Studio",
  brand: "Lumina Audio",
  category: "Over-Ear Headphones",
  badge: "POPULAR CHOICE",
  rating: 4.9,
  reviewCount: 2489,
  price: 299,
  originalPrice: 349,
  discount: 15,
  inStock: true,
  stockCount: 14,
  description:
    "Experience uncompromised sound with hybrid active noise cancellation and 60-hour battery life. Crafted for creators and audiophiles.",
  longDescription:
    "Designed for those who hear every detail. The Eclipse Gen-2 features our proprietary 40mm liquid crystal polymer drivers, providing a frequency response that goes beyond human hearing. Whether you're mixing in a studio or commuting through the city, the active noise cancellation adapts in real-time to your surroundings.",
  features: [
    "Adaptive Active Noise Cancellation with Transparency Mode",
    "High-Resolution Audio via Bluetooth 5.3 LDAC Support",
    "Ergonomic vegan leather memory foam cushions",
    "Quad-microphone system for crystal-clear calls",
    "Fast charge: 10 mins = 5 hours of playback",
  ],
  specs: [
    { label: "Driver Size", value: "40mm Custom LCP" },
    { label: "Frequency Response", value: "4 Hz – 40,000 Hz" },
    { label: "Battery Life", value: "Up to 60 hours" },
    { label: "Bluetooth", value: "5.3 with LDAC & aptX" },
    { label: "Noise Cancellation", value: "Hybrid ANC (-42dB)" },
    { label: "Weight", value: "254g" },
    { label: "Charging", value: "USB-C, 10 min = 5 hrs" },
    { label: "Color Options", value: "Space Black, Silver, Midnight Blue" },
  ],
  colors: [
    { name: "Space Black", hex: "#1a1a1a" },
    { name: "Silver", hex: "#c0c0c0" },
    { name: "Midnight Blue", hex: "#1a2744" },
    { name: "+4", hex: "#2a1a3e" },
  ],
  thumbnails: ["🎧", "🔇", "🔋", "🎵"],
  shop: {
    name: "SonicStore Official",
    followers: "118k",
    rating: 4.8,
    verified: true,
  },
  perks: [
    { icon: Truck, label: "Free Express Shipping" },
    { icon: RotateCcw, label: "30-Day Free Returns" },
    { icon: Shield, label: "2-Year Warranty" },
    { icon: Package, label: "Original Sealed Box" },
  ],
};

const RELATED: RelatedProduct[] = [
  {
    id: 10,
    name: "Aura Minimalist Buds",
    category: "Audio Tech",
    price: 180,
    emoji: "🎵",
    bgFrom: "#e8e8e8",
    bgTo: "#d0d0d0",
    rating: 4.7,
  },
  {
    id: 11,
    name: "Retro Vinyl Player",
    category: "Heritage HiFi",
    price: 435,
    emoji: "💽",
    bgFrom: "#2d1b0e",
    bgTo: "#4a2c0a",
    rating: 4.9,
  },
  {
    id: 12,
    name: "Titan Port Speaker",
    category: "Vibe Store",
    price: 120,
    emoji: "🔊",
    bgFrom: "#f0f0f0",
    bgTo: "#e0e0e0",
    rating: 4.6,
  },
  {
    id: 13,
    name: "Glaze Pro In-Ear",
    category: "AcousticLab",
    price: 255,
    emoji: "🎶",
    bgFrom: "#0d1b2a",
    bgTo: "#1b2838",
    rating: 4.8,
  },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "James Wilson",
    avatar: "JW",
    avatarBg: "from-violet-600 to-violet-800",
    rating: 5,
    date: "March 14, 2026",
    comment:
      "The sound stage on these is absolutely incredible. I've used Bose and Sony for years, but the clarity in the mids here is on another level. Battery life actually exceeded the 60h claim in my tests.",
    helpful: 124,
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Chen",
    avatar: "SC",
    avatarBg: "from-rose-500 to-pink-700",
    rating: 4,
    date: "March 8, 2026",
    comment:
      "Beautiful design and very premium feel. The noise cancellation is just as solid as ANE. MXE 5 is very effective for airplane engine noise, though a bit heavy to wear for more than 2 hours straight.",
    helpful: 89,
    verified: true,
  },
  {
    id: 3,
    name: "Luca Ferrari",
    avatar: "LF",
    avatarBg: "from-amber-500 to-orange-700",
    rating: 5,
    date: "February 28, 2026",
    comment:
      "Worth every penny. The LDAC support makes a real difference when listening to hi-res files. I've been using these daily for studio monitoring and they're endlessly comfortable.",
    helpful: 67,
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

// ─── Related Card ─────────────────────────────────────────────────────────────

function RelatedCard({ product }: { product: RelatedProduct }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all"
    >
      <div
        className="aspect-[4/3] flex items-center justify-center text-4xl"
        style={{ background: `linear-gradient(135deg, ${product.bgFrom}, ${product.bgTo})` }}
      >
        <span className="group-hover:scale-110 transition-transform duration-300">
          {product.emoji}
        </span>
      </div>
      <div className="p-3">
        <div className="text-[9px] text-violet-400 font-bold uppercase tracking-widest mb-1">
          {product.category}
        </div>
        <div className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-violet-100 mb-2">
          {product.name}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-violet-400">
            ${product.price}
          </span>
          <div className="flex items-center gap-1">
            <Star size={9} className="fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-gray-400">{product.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function DetailsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-white mb-2">Precision Audio for Professionals</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          {PRODUCT.longDescription}
        </p>
        <ul className="space-y-2">
          {PRODUCT.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
              <Check size={14} className="text-violet-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SpecificationsTab() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/5">
      {PRODUCT.specs.map((spec, idx) => (
        <div
          key={spec.label}
          className={`flex items-center gap-4 px-5 py-3.5 text-sm ${
            idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
          }`}
        >
          <span className="text-gray-500 w-44 shrink-0">{spec.label}</span>
          <span className="text-white font-medium">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab() {
  const ratingDist = [
    { stars: 5, pct: 80 },
    { stars: 4, pct: 12 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-6 rounded-2xl bg-[#14121C] border border-white/5 p-5">
        <div className="flex flex-col items-center justify-center text-center md:w-36 shrink-0">
          <div className="text-5xl font-black text-white mb-1">{PRODUCT.rating}</div>
          <StarRating rating={PRODUCT.rating} size={16} />
          <div className="text-xs text-gray-500 mt-2">{PRODUCT.reviewCount.toLocaleString()} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-4 text-right">{stars}</span>
              <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-7">{pct}%</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-2 md:w-40 shrink-0">
          <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 active:scale-95 transition-all">
            <MessageSquare size={12} /> Write a Review
          </button>
        </div>
      </div>
      {/* Reviews */}
      <div className="space-y-4">
        {REVIEWS.map((review) => (
          <div key={review.id} className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.avatarBg} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{review.name}</span>
                  {review.verified && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <BadgeCheck size={9} /> VERIFIED
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-500">{review.date}</span>
                </div>
                <StarRating rating={review.rating} />
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{review.comment}</p>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-400 transition-colors">
              <ThumbsUp size={11} /> Helpful ({review.helpful})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingTab() {
  return (
    <div className="space-y-4">
      {[
        {
          icon: Truck,
          title: "Free Express Shipping",
          desc: "Orders over $200 ship free via FedEx Express. Estimated delivery: 2–3 business days.",
        },
        {
          icon: RotateCcw,
          title: "30-Day Free Returns",
          desc: "Not satisfied? Return for any reason within 30 days for a full refund, no questions asked.",
        },
        {
          icon: Shield,
          title: "2-Year Manufacturer Warranty",
          desc: "Covered against manufacturing defects. Extended care plans available at checkout.",
        },
        {
          icon: Package,
          title: "Original Sealed Packaging",
          desc: "All products are shipped in original, factory-sealed packaging with authenticity certificate.",
        },
      ].map((item) => (
        <div key={item.title} className="flex gap-4 rounded-2xl bg-[#14121C] border border-white/5 p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <item.icon size={18} className="text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">{item.title}</div>
            <div className="text-xs text-gray-400 leading-relaxed">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [tab, setTab] = useState<DetailTab>("details");
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "specifications", label: "Specifications" },
    { id: "reviews", label: `Reviews (${PRODUCT.reviewCount.toLocaleString()})` },
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-violet-400 transition-colors">Home</Link>
          <ChevronRight size={11} />
          <Link href="/products" className="hover:text-violet-400 transition-colors">Audio</Link>
          <ChevronRight size={11} />
          <Link href="/products" className="hover:text-violet-400 transition-colors">Over-Ear Headphones</Link>
          <ChevronRight size={11} />
          <span className="text-gray-400 truncate max-w-[200px]">{PRODUCT.name}</span>
        </div>

        {/* ─── Product Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center border border-white/5">
              <span className="text-[120px] select-none">{PRODUCT.thumbnails[activeThumb]}</span>
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              {/* Wish + Share */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => setWished(!wished)}
                  className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    wished ? "bg-rose-500 text-white" : "bg-black/40 text-gray-300 hover:text-white"
                  }`}
                >
                  <Heart size={15} fill={wished ? "currentColor" : "none"} />
                </button>
                <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
              {/* Badge */}
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white px-2.5 py-1 rounded-full">
                  {PRODUCT.badge}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {PRODUCT.thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-3xl border transition-all ${
                    activeThumb === idx
                      ? "border-violet-500 bg-violet-500/10 shadow-md shadow-violet-900/40"
                      : "border-white/5 bg-[#14121C] hover:border-white/20"
                  }`}
                >
                  {thumb}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                  {PRODUCT.brand}
                </span>
                <span className="text-gray-600">·</span>
                <div className="flex items-center gap-1">
                  <StarRating rating={PRODUCT.rating} size={12} />
                  <span className="text-xs text-yellow-400 font-bold">{PRODUCT.rating}</span>
                  <span className="text-xs text-gray-500">({PRODUCT.reviewCount.toLocaleString()} reviews)</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
                {PRODUCT.name}
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed">{PRODUCT.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-white">${PRODUCT.price}.00</span>
              <span className="text-lg text-gray-500 line-through mb-1">${PRODUCT.originalPrice}.00</span>
              <span className="mb-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1">
                Save {PRODUCT.discount}%
              </span>
            </div>

            {/* Color */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Color — <span className="text-white">{PRODUCT.colors[selectedColor].name}</span>
              </div>
              <div className="flex items-center gap-2">
                {PRODUCT.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-[8px] font-bold text-white ${
                      selectedColor === idx ? "border-violet-400 scale-110 ring-2 ring-violet-400/30" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {color.name.startsWith("+") ? color.name : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Quantity</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-white select-none">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  In stock · {PRODUCT.stockCount} remaining
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 ${
                  addedToCart
                    ? "bg-emerald-600 text-white"
                    : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/40"
                }`}
              >
                {addedToCart ? (
                  <><Check size={15} /> Added to Cart!</>
                ) : (
                  <><ShoppingCart size={15} /> Add to Cart</>
                )}
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95">
                <Zap size={15} className="text-yellow-400" /> Buy It Now
              </button>
            </div>

            {/* Shop card */}
            <div className="flex items-center gap-3 rounded-2xl bg-[#14121C] border border-white/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
                🎧
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Store size={11} className="text-violet-400" />
                  <span className="text-sm font-bold text-white">{PRODUCT.shop.name}</span>
                  {PRODUCT.shop.verified && <BadgeCheck size={13} className="text-violet-400" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <Star size={9} className="fill-yellow-400 text-yellow-400" />
                  {PRODUCT.shop.rating} · {PRODUCT.shop.followers} followers
                </div>
              </div>
              <Link
                href="/shops/1"
                className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 px-3 py-1.5 text-xs font-semibold transition-all shrink-0"
              >
                Visit Shop <ChevronRight size={11} />
              </Link>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT.perks.map((perk) => (
                <div key={perk.label} className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
                  <perk.icon size={13} className="text-violet-400 shrink-0" />
                  <span className="text-[11px] text-gray-400">{perk.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Detail Tabs ─── */}
        <div className="mb-14">
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-white/5 mb-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "details" && <DetailsTab />}
          {tab === "specifications" && <SpecificationsTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "shipping" && <ShippingTab />}
        </div>

        {/* ─── You might also like ─── */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">You might also like</h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              View All <ChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RELATED.map((p) => (
              <RelatedCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ─── Customer Reviews preview ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Customer Reviews</h2>
            <button
              onClick={() => setTab("reviews")}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 px-4 py-2 text-xs font-semibold transition-all"
            >
              <MessageSquare size={12} /> Write a Review
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEWS.slice(0, 2).map((review) => (
              <div key={review.id} className="rounded-2xl bg-[#14121C] border border-white/5 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.avatarBg} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{review.name}</span>
                      {review.verified && (
                        <BadgeCheck size={12} className="text-emerald-400" />
                      )}
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{review.date}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{review.comment}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => { setTab("reviews"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              View all {PRODUCT.reviewCount.toLocaleString()} reviews →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
