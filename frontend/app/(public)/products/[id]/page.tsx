"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
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
  MessageSquare,
  Package,
  Loader2,
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
  images: [] as string[],
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
              : "fill-white/10 text-foreground/10"
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
      className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all"
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
        <div className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-violet-100 mb-2">
          {product.name}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-violet-400">
            {formatVnd(Number(product.price))}
          </span>
          <div className="flex items-center gap-1">
            <Star size={9} className="fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-slate-500 dark:text-gray-400">{product.rating}</span>
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
        <h3 className="text-base font-bold text-foreground mb-2">Precision Audio for Professionals</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed mb-4">
          {PRODUCT.longDescription}
        </p>
        <ul className="space-y-2">
          {PRODUCT.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-gray-300">
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
    <div className="rounded-xl overflow-hidden border border-card-border">
      {PRODUCT.specs.map((spec, idx) => (
        <div
          key={spec.label}
          className={`flex items-center gap-4 px-5 py-3.5 text-sm ${
            idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
          }`}
        >
          <span className="text-slate-400 dark:text-gray-500 w-44 shrink-0">{spec.label}</span>
          <span className="text-foreground font-medium">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ productId, onStatsLoaded }: { productId: string; onStatsLoaded?: (stats: { total: number; avgRating: number }) => void }) {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<{ reviews: any[]; total: number; avgRating: number } | null>(null);
  const [perm, setPerm] = useState<{ canReview: boolean; hasPurchased: boolean; hasReviewed: boolean } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!productId) return;
    setLoadingReviews(true);
    try {
      const { reviewsService } = await import('@/services/reviews.service');
      const reviewData = await reviewsService.getProductReviews(productId);
      setData(reviewData);
      onStatsLoaded?.({ total: reviewData.total, avgRating: reviewData.avgRating });
      if (isAuthenticated) {
        const permData = await reviewsService.canReview(productId);
        setPerm(permData);
      }
    } catch { /* ignore */ } finally {
      setLoadingReviews(false);
    }
  }, [productId, isAuthenticated, onStatsLoaded]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSubmit = async () => {
    if (myRating === 0) { alert('Vui lòng chọn số sao.'); return; }
    setSubmitting(true);
    try {
      const { reviewsService } = await import('@/services/reviews.service');
      await reviewsService.createReview(productId, myRating, myComment);
      setMyRating(0); setMyComment('');
      await loadAll();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gửi đánh giá thất bại.');
    } finally { setSubmitting(false); }
  };

  const avgRating = data?.avgRating ?? 0;
  const total = data?.total ?? 0;
  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    pct: total > 0 ? Math.round(((data?.reviews.filter((r) => r.rating === s).length ?? 0) / total) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex flex-col md:flex-row gap-6 rounded-2xl bg-card border border-card-border p-5">
        <div className="flex flex-col items-center justify-center text-center md:w-36 shrink-0">
          <div className="text-5xl font-black text-foreground mb-1">{avgRating || '—'}</div>
          <StarRating rating={avgRating} size={16} />
          <div className="text-xs text-slate-400 dark:text-gray-500 mt-2">{total.toLocaleString()} đánh giá</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-gray-400 w-4 text-right">{stars}</span>
              <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-400 dark:text-gray-500 w-7">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write review area */}
      {!isAuthenticated && (
        <div className="rounded-2xl bg-card border border-card-border p-5 text-center">
          <p className="text-sm text-slate-500 mb-3">Đăng nhập để viết đánh giá</p>
          <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all">Đăng nhập</a>
        </div>
      )}
      {isAuthenticated && perm && !perm.hasPurchased && (
        <div className="rounded-2xl bg-card border border-amber-500/20 p-5 text-center">
          <p className="text-sm text-amber-400 font-medium">Chỉ khách hàng đã mua và nhận hàng mới có thể viết đánh giá.</p>
        </div>
      )}
      {isAuthenticated && perm?.hasReviewed && (
        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 text-center">
          <p className="text-sm text-emerald-400 font-medium">✅ Bạn đã đánh giá sản phẩm này rồi!</p>
        </div>
      )}
      {isAuthenticated && perm?.canReview && (
        <div className="rounded-2xl bg-card border border-card-border p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground">✍️ Viết đánh giá của bạn</h4>
          {/* Star picker */}
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setMyRating(s)} className="transition-transform hover:scale-110">
                <Star size={28} className={s <= myRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-gray-600'} />
              </button>
            ))}
            {myRating > 0 && <span className="text-xs text-slate-400 ml-2">{['','Rất tệ','Tệ','Bình thường','Tốt','Xuất sắc'][myRating]}</span>}
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            rows={4}
            className="w-full rounded-xl border border-card-border bg-background text-sm text-foreground px-4 py-3 resize-none outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-all active:scale-95"
          >
            <MessageSquare size={12} />{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-violet-500" /></div>
      ) : (
        <div className="space-y-4">
          {data?.reviews.length === 0 && <div className="text-sm text-slate-500 text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>}
          {data?.reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-card border border-card-border p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {review.user.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{review.user.full_name}</span>
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <BadgeCheck size={9} /> VERIFIED
                    </span>
                    <span className="ml-auto text-xs text-slate-400 dark:text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              {review.comment && <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
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
        <div key={item.title} className="flex gap-4 rounded-2xl bg-card border border-card-border p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <item.icon size={18} className="text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground mb-1">{item.title}</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [tab, setTab] = useState<DetailTab>("details");
  const [addedToCart, setAddedToCart] = useState(false);
  const [productRealId, setProductRealId] = useState<string>('');
  const [reviewStats, setReviewStats] = useState<{ total: number; avgRating: number }>({ total: 0, avgRating: 0 });
  const [productData, setProductData] = useState({
    ...PRODUCT,
    parentCategory: '' as string,
    shopSlug: '' as string,
    shop: { ...PRODUCT.shop, id: '' as string },
  });

  // Try to load product from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const slug = params?.id as string;
        if (!slug) return;
        const { productsService } = await import('@/services/products.service');
        const p = await productsService.getBySlug(slug);
        if (p?.name) {
          setProductData({
            ...PRODUCT,
            id: p.id as any,
            name: p.name,
            price: p.price,
            description: p.description || PRODUCT.description,
            inStock: p.stock_quantity > 0,
            stockCount: p.stock_quantity,
            brand: p.shop?.name || PRODUCT.brand,
            category: p.category?.name || PRODUCT.category,
            parentCategory: p.category?.parent?.name || '',
            shopSlug: p.shop?.id || '',
            images: p.images || [],
            shop: {
              id: p.shop?.id || '',
              name: p.shop?.name || PRODUCT.shop.name,
              rating: Number(p.shop?.rating ?? PRODUCT.shop.rating),
              followers: PRODUCT.shop.followers,
              verified: PRODUCT.shop.verified,
            },
          });
          setProductRealId(p.id);
          // Auto-open reviews tab if ?tab=reviews in URL
          if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'reviews') {
            setTab('reviews');
            setTimeout(() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
          }
        }
      } catch {
        // Keep mock data
      }
    };
    loadProduct();
  }, [params?.id]);

  // Load wishlist status for logged-in user
  useEffect(() => {
    if (!productRealId) return;
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    const checkWishlistStatus = async () => {
      try {
        const { wishlistService } = await import('@/services/wishlist.service');
        const res = await wishlistService.checkWishlist(productRealId);
        setWished(res.wishlisted);
      } catch (err) {
        console.error("Failed to check wishlist status", err);
      }
    };
    checkWishlistStatus();
  }, [productRealId]);

  // Record product view interaction
  useEffect(() => {
    if (!productRealId || !isAuthenticated) return;
    
    const recordView = async () => {
      try {
        const { default: api } = await import('@/lib/axios');
        await api.post(`/products/${productRealId}/interact`, {
          interaction_type: 'VIEW'
        });
      } catch (err) {
        console.error("Failed to record view interaction", err);
      }
    };
    recordView();
  }, [productRealId, isAuthenticated]);


  // Preload review stats so tab label + header show correct count/rating
  useEffect(() => {
    if (!productRealId) return;
    const preloadStats = async () => {
      try {
        const { reviewsService } = await import('@/services/reviews.service');
        const reviewData = await reviewsService.getProductReviews(productRealId);
        setReviewStats({ total: reviewData.total, avgRating: reviewData.avgRating });
      } catch { /* ignore */ }
    };
    preloadStats();
  }, [productRealId]);

  const handleToggleWishlist = async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const { wishlistService } = await import('@/services/wishlist.service');
      const res = await wishlistService.toggleWishlist(productRealId);
      setWished(res.added);
      if (res.added) {
        toast.success("Đã thêm vào danh sách yêu thích");
      } else {
        toast.success("Đã xóa khỏi danh sách yêu thích");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật danh sách yêu thích");
    }
  };

  const handleAddToCart = async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error("Please login to add products to cart");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const addItem = useCartStore.getState().addItem;
      const productId = typeof productData.id === 'string' ? productData.id : '';
      if (!productId) {
        toast.error("Product is not ready yet. Please try again.");
        return;
      }
      await addItem(productId, qty);

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      toast.success("Added to cart successfully!");
    } catch (error: any) {
      console.error("Failed to add to cart", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(error.response?.data?.message || "Failed to add to cart");
      }
    }
  };

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "specifications", label: "Specifications" },
    { id: "reviews", label: `Reviews${reviewStats.total > 0 ? ` (${reviewStats.total.toLocaleString()})` : ''}` },
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-violet-400 transition-colors">Home</Link>
          <ChevronRight size={11} />
          {/* Parent category */}
          {productData.parentCategory && (
            <>
              <Link href="/products" className="hover:text-violet-400 transition-colors">
                {productData.parentCategory}
              </Link>
              <ChevronRight size={11} />
            </>
          )}
          {/* Category (leaf) */}
          {productData.category && (
            <>
              <Link href="/products" className="hover:text-violet-400 transition-colors">
                {productData.category}
              </Link>
              <ChevronRight size={11} />
            </>
          )}
          <span className="text-slate-500 dark:text-gray-400 truncate max-w-[200px]">{productData.name}</span>
        </div>

        {/* ─── Product Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square rounded-3xl bg-white border border-card-border flex items-center justify-center overflow-hidden w-full">
              {productData.images && productData.images.length > 0 ? (
                <img
                  src={getPublicImageUrl(productData.images[activeThumb] || productData.images[0])}
                  alt={productData.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[120px] select-none py-16">{PRODUCT.thumbnails[activeThumb]}</span>
              )}
              {/* Wish + Share */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    wished ? "bg-rose-500 text-white" : "bg-black/40 text-slate-600 dark:text-gray-300 hover:text-white"
                  }`}
                >
                  <Heart size={15} fill={wished ? "currentColor" : "none"} />
                </button>
                <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-gray-300 hover:text-foreground transition-colors">
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
              {(productData.images && productData.images.length > 0 ? productData.images : PRODUCT.thumbnails).map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-3xl border transition-all overflow-hidden ${
                    activeThumb === idx
                      ? "border-violet-500 shadow-md shadow-violet-900/40"
                      : "border-card-border bg-white hover:border-violet-400/40"
                  }`}
                >
                  {productData.images && productData.images.length > 0 ? (
                    <img
                      src={getPublicImageUrl(thumb as string)}
                      alt={`Thumbnail ${idx}`}
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    <span className="py-4">{thumb}</span>
                  )}
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
                  {productData.brand}
                </span>
                <span className="text-slate-400 dark:text-gray-600">·</span>
                <div className="flex items-center gap-1">
                  <StarRating rating={reviewStats.avgRating || productData.rating} size={12} />
                  <span className="text-xs text-yellow-400 font-bold">{reviewStats.avgRating || productData.rating}</span>
                  <span className="text-xs text-slate-400 dark:text-gray-500">({reviewStats.total > 0 ? reviewStats.total.toLocaleString() : '—'} đánh giá)</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-3">
                {productData.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed mb-4">{productData.description}</p>

              {/* Price */}
              <div className="flex items-end gap-3 my-4">
                <span className="text-4xl font-black text-foreground">{formatVnd(Number(productData.price))}</span>
                <span className="text-lg text-slate-400 dark:text-gray-500 line-through mb-1">{formatVnd(Number(productData.originalPrice))}</span>
                <span className="mb-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1">
                  Tiết kiệm {productData.discount}%
                </span>
              </div>

              {/* Color */}
              <div className="my-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-2">
                  Màu sắc — <span className="text-foreground">{PRODUCT.colors[selectedColor].name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {PRODUCT.colors.map((color, idx) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(idx)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-[8px] font-bold text-foreground ${
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
              <div className="my-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-2">Số lượng</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border border-border dark:border-white/10 bg-slate-100 dark:bg-white/5">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-foreground select-none">{qty}</span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-foreground transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Còn hàng · Còn {productData.stockCount} sản phẩm
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 my-4">
                <button
                  onClick={handleAddToCart}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 ${
                    addedToCart
                      ? "bg-emerald-600 text-white"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/40"
                  }`}
                >
                  {addedToCart ? (
                    <><Check size={15} /> Đã thêm vào giỏ!</>
                  ) : (
                    <><ShoppingCart size={15} /> Thêm vào giỏ hàng</>
                  )}
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-border dark:border-white/10 bg-slate-100 dark:bg-white/5 py-3.5 text-sm font-bold text-foreground hover:bg-white/10 transition-all active:scale-95">
                  <Zap size={15} className="text-yellow-400" /> Mua ngay
                </button>
              </div>

              {/* Shop card */}
              <div className="flex items-center gap-3 rounded-2xl bg-card border border-card-border p-4 my-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
                  <Store size={18} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Store size={11} className="text-violet-400" />
                    <span className="text-sm font-bold text-foreground">{productData.shop.name}</span>
                    {productData.shop.verified && <BadgeCheck size={13} className="text-violet-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                    <Star size={9} className="fill-yellow-400 text-yellow-400" />
                    {Number(productData.shop.rating) > 0
                      ? Number(productData.shop.rating).toFixed(1)
                      : '—'} · {productData.shop.followers} người theo dõi
                  </div>
                </div>
                <Link
                  href={`/shops/${productData.shop.id || productData.shopSlug || '1'}`}
                  className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 px-3 py-1.5 text-xs font-semibold transition-all shrink-0"
                >
                  Xem Shop <ChevronRight size={11} />
                </Link>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-2 gap-2 my-4">
                {PRODUCT.perks.map((perk) => (
                  <div key={perk.label} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-card-border px-3 py-2">
                    <perk.icon size={13} className="text-violet-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">{perk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Detail Tabs ─── */}
        <div className="mb-14">
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-card-border mb-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "details" && <DetailsTab />}
          {tab === "specifications" && <SpecificationsTab />}
          {tab === "reviews" && <ReviewsTab productId={productRealId} onStatsLoaded={setReviewStats} />}
          {tab === "shipping" && <ShippingTab />}
        </div>

        {/* ─── You might also like ─── */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">You might also like</h2>
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
            <h2 className="text-lg font-bold text-foreground">Customer Reviews</h2>
            <button
              onClick={() => setTab("reviews")}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 px-4 py-2 text-xs font-semibold transition-all"
            >
              <MessageSquare size={12} /> Write a Review
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEWS.slice(0, 2).map((review) => (
              <div key={review.id} className="rounded-2xl bg-card border border-card-border p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.avatarBg} flex items-center justify-center text-xs font-bold text-foreground shrink-0`}>
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{review.name}</span>
                      {review.verified && (
                        <BadgeCheck size={12} className="text-emerald-400" />
                      )}
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 shrink-0">{review.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed line-clamp-3">{review.comment}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => { setTab("reviews"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              View all {reviewStats.total > 0 ? reviewStats.total.toLocaleString() : ''} reviews →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
