"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Copy,
  Trash2,
  Image as ImageIcon,
  Upload,
  Tag,
  Palette,
  Ruler,
  Globe,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MoreVertical,
  Eye,
  Archive,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = "active" | "draft" | "archived";
type ProductTab = "all" | "drafts" | "categories" | "alerts";

type ProductVariation = {
  type: string;
  icon: React.FC<{ size?: number; className?: string }>;
  values: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryColor: string;
  price: number;
  stock: number;
  maxStock: number;
  status: ProductStatus;
  image: string;
  imageBg: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  variations: ProductVariation[];
  mediaImages: string[];
};

// ─── Data ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProductStatus, { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  draft: { label: "Draft", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20", dot: "bg-violet-400" },
  archived: { label: "Archived", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Tech: "bg-violet-500/20 text-violet-400 border-violet-500/20",
  Fashion: "bg-rose-500/20 text-rose-400 border-rose-500/20",
  Audio: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  Accessories: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  Home: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  Sports: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
};

const TAB_ITEMS: { key: ProductTab; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "drafts", label: "Drafts" },
  { key: "categories", label: "Categories" },
  { key: "alerts", label: "Inventory Alerts" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "PROD-001",
    name: "Neo Quartz Watch Gen 4",
    sku: "TECH-W-001",
    category: "Tech",
    categoryColor: "Tech",
    price: 249.0,
    stock: 85,
    maxStock: 100,
    status: "active",
    image: "⌚",
    imageBg: "from-violet-600/30 to-violet-800/30",
    description: "Premium smartwatch with sapphire crystal display, heart rate monitoring, and 5-day battery life.",
    metaTitle: "Neo Quartz Watch Gen 4 - Premium Smartwatch",
    metaDescription: "Experience the ultimate smartwatch with sapphire display and advanced health tracking...",
    variations: [
      { type: "Color", icon: Palette, values: "Black, Silver, Rose Gold" },
      { type: "Size", icon: Ruler, values: "40mm, 44mm" },
    ],
    mediaImages: ["⌚", "📱"],
  },
  {
    id: "PROD-002",
    name: "Aura Runner Pro",
    sku: "FASH-S-042",
    category: "Fashion",
    categoryColor: "Fashion",
    price: 120.0,
    stock: 52,
    maxStock: 80,
    status: "draft",
    image: "👟",
    imageBg: "from-rose-600/30 to-rose-800/30",
    description: "Ultra-lightweight running shoes with responsive cushioning and breathable mesh upper.",
    metaTitle: "Aura Runner Pro - Performance Running Shoes",
    metaDescription: "Run faster and further with the Aura Runner Pro featuring advanced cushioning...",
    variations: [
      { type: "Color", icon: Palette, values: "White, Black, Neon" },
      { type: "Size", icon: Ruler, values: "US 6-13, EU 39-48" },
    ],
    mediaImages: ["👟", "🏃"],
  },
  {
    id: "PROD-003",
    name: "Studio Beats X",
    sku: "TECH-H-992",
    category: "Tech",
    categoryColor: "Tech",
    price: 399.0,
    stock: 150,
    maxStock: 200,
    status: "active",
    image: "🎧",
    imageBg: "from-blue-600/30 to-blue-800/30",
    description: "Premium wireless headphones with noise cancellation, spatial audio, and 40-hour battery.",
    metaTitle: "Studio Beats X - Best Wireless Headphones",
    metaDescription: "Get the best audio experience with noise cancelling tech...",
    variations: [
      { type: "Color", icon: Palette, values: "Black, White, Red" },
      { type: "Size", icon: Ruler, values: "One size fits all" },
    ],
    mediaImages: ["🎧", "🎵"],
  },
  {
    id: "PROD-004",
    name: "Eclipse Leather Bag",
    sku: "FASH-B-118",
    category: "Fashion",
    categoryColor: "Fashion",
    price: 185.0,
    stock: 12,
    maxStock: 50,
    status: "active",
    image: "👜",
    imageBg: "from-amber-600/30 to-amber-800/30",
    description: "Handcrafted Italian leather crossbody bag with adjustable strap and multiple compartments.",
    metaTitle: "Eclipse Leather Bag - Premium Crossbody",
    metaDescription: "Elevate your style with the Eclipse handcrafted Italian leather bag...",
    variations: [
      { type: "Color", icon: Palette, values: "Tan, Black, Burgundy" },
    ],
    mediaImages: ["👜"],
  },
  {
    id: "PROD-005",
    name: "Zen Aroma Diffuser",
    sku: "HOME-D-076",
    category: "Home",
    categoryColor: "Home",
    price: 68.0,
    stock: 200,
    maxStock: 250,
    status: "active",
    image: "🌿",
    imageBg: "from-emerald-600/30 to-emerald-800/30",
    description: "Ultra-quiet essential oil diffuser with ambient LED lighting and 12-hour run time.",
    metaTitle: "Zen Aroma Diffuser - Essential Oil Diffuser",
    metaDescription: "Create a calming atmosphere with the Zen Aroma Diffuser...",
    variations: [
      { type: "Color", icon: Palette, values: "White, Wood Grain" },
    ],
    mediaImages: ["🌿", "💧"],
  },
  {
    id: "PROD-006",
    name: "Titan Fitness Tracker",
    sku: "TECH-T-233",
    category: "Tech",
    categoryColor: "Tech",
    price: 89.0,
    stock: 8,
    maxStock: 100,
    status: "active",
    image: "📱",
    imageBg: "from-cyan-600/30 to-cyan-800/30",
    description: "Advanced fitness tracker with GPS, SpO2, sleep analysis, and 14-day battery life.",
    metaTitle: "Titan Fitness Tracker - Smart Health Band",
    metaDescription: "Track your health and fitness goals with the Titan Fitness Tracker...",
    variations: [
      { type: "Color", icon: Palette, values: "Black, Navy, Grey" },
      { type: "Size", icon: Ruler, values: "S, M, L" },
    ],
    mediaImages: ["📱"],
  },
  {
    id: "PROD-007",
    name: "Prism Sunglasses",
    sku: "ACC-S-401",
    category: "Accessories",
    categoryColor: "Accessories",
    price: 145.0,
    stock: 3,
    maxStock: 60,
    status: "draft",
    image: "🕶️",
    imageBg: "from-gray-600/30 to-gray-800/30",
    description: "Polarized titanium sunglasses with UV400 protection and anti-scratch coating.",
    metaTitle: "Prism Sunglasses - Polarized Titanium",
    metaDescription: "See the world clearly with Prism polarized titanium sunglasses...",
    variations: [
      { type: "Color", icon: Palette, values: "Gold, Silver, Matte Black" },
    ],
    mediaImages: ["🕶️"],
  },
  {
    id: "PROD-008",
    name: "Velocity Cycling Jersey",
    sku: "SPR-C-089",
    category: "Sports",
    categoryColor: "Sports",
    price: 75.0,
    stock: 0,
    maxStock: 120,
    status: "archived",
    image: "🚴",
    imageBg: "from-indigo-600/30 to-indigo-800/30",
    description: "Aerodynamic cycling jersey with moisture-wicking fabric and 3 rear pockets.",
    metaTitle: "Velocity Cycling Jersey - Performance Gear",
    metaDescription: "Ride faster with the Velocity aerodynamic cycling jersey...",
    variations: [
      { type: "Color", icon: Palette, values: "Red, Blue, Black" },
      { type: "Size", icon: Ruler, values: "XS, S, M, L, XL" },
    ],
    mediaImages: ["🚴"],
  },
  {
    id: "PROD-009",
    name: "Nimbus Wireless Speaker",
    sku: "TECH-A-567",
    category: "Audio",
    categoryColor: "Audio",
    price: 159.0,
    stock: 45,
    maxStock: 80,
    status: "active",
    image: "🔊",
    imageBg: "from-violet-600/30 to-violet-800/30",
    description: "360° surround sound speaker with deep bass, waterproof design, and 20-hour playback.",
    metaTitle: "Nimbus Wireless Speaker - 360° Sound",
    metaDescription: "Immerse yourself in premium 360° sound with the Nimbus Speaker...",
    variations: [
      { type: "Color", icon: Palette, values: "Midnight, Ocean, Sand" },
    ],
    mediaImages: ["🔊", "🎶"],
  },
  {
    id: "PROD-010",
    name: "Lux Scented Candle Set",
    sku: "HOME-C-145",
    category: "Home",
    categoryColor: "Home",
    price: 42.0,
    stock: 180,
    maxStock: 200,
    status: "active",
    image: "🕯️",
    imageBg: "from-orange-600/30 to-orange-800/30",
    description: "Hand-poured soy wax candle set with 3 premium scents. 45-hour burn time each.",
    metaTitle: "Lux Scented Candle Set - Soy Wax Candles",
    metaDescription: "Relax and unwind with the Lux hand-poured soy wax scented candle set...",
    variations: [],
    mediaImages: ["🕯️"],
  },
];

const ITEMS_PER_PAGE = 5;

// ─── Stock Bar Component ──────────────────────────────────────────────────────

function StockBar({ stock, max }: { stock: number; max: number }) {
  const pct = Math.min((stock / max) * 100, 100);
  const isLow = pct < 20;
  const isCritical = stock === 0;

  return (
    <div className="flex items-center gap-2.5 w-full max-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical
              ? "bg-red-500"
              : isLow
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[10px] font-bold shrink-0 ${
          isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-gray-400"
        }`}
      >
        {stock}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorProducts() {
  const [activeTab, setActiveTab] = useState<ProductTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  // Try to load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { shopsService } = await import('@/services/shops.service');
        const { productsService } = await import('@/services/products.service');
        const shop = await shopsService.getMyShop();
        if (shop?.id) {
          const result = await productsService.getAll({ shop_id: shop.id, limit: 50 });
          if (result?.data?.length) {
            const EMOJI_MAP = ['⌚', '👟', '🎧', '👜', '🌿', '📱', '🕶️', '🚴', '🔊', '🕯️'];
            const BG_MAP = ['from-violet-600/30 to-violet-800/30', 'from-rose-600/30 to-rose-800/30', 'from-blue-600/30 to-blue-800/30', 'from-amber-600/30 to-amber-800/30', 'from-emerald-600/30 to-emerald-800/30', 'from-cyan-600/30 to-cyan-800/30'];
            const CAT_MAP = ['Tech', 'Fashion', 'Audio', 'Accessories', 'Home', 'Sports'];
            const mapped: Product[] = result.data.map((p: any, i: number) => ({
              id: p.id || `PROD-${String(i + 1).padStart(3, '0')}`,
              name: p.name,
              sku: `SKU-${String(i + 1).padStart(3, '0')}`,
              category: p.category?.name || CAT_MAP[i % CAT_MAP.length],
              categoryColor: p.category?.name || CAT_MAP[i % CAT_MAP.length],
              price: p.price,
              stock: p.stock_quantity,
              maxStock: Math.max(p.stock_quantity, 100),
              status: p.stock_quantity === 0 ? 'archived' as const : p.stock_quantity < 20 ? 'draft' as const : 'active' as const,
              image: EMOJI_MAP[i % EMOJI_MAP.length],
              imageBg: BG_MAP[i % BG_MAP.length],
              description: p.description || '',
              metaTitle: p.name,
              metaDescription: p.description || '',
              variations: [],
              mediaImages: [EMOJI_MAP[i % EMOJI_MAP.length]],
            }));
            setProducts(mapped);
            if (mapped.length > 0) setSelectedProduct(mapped[0]);
          }
        }
      } catch {
        // Fallback to mock data
        setSelectedProduct(MOCK_PRODUCTS[2]);
      }
    };
    loadProducts();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (activeTab === "drafts") {
      filtered = filtered.filter((p) => p.status === "draft");
    } else if (activeTab === "alerts") {
      filtered = filtered.filter((p) => p.stock <= p.maxStock * 0.2);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeTab, searchQuery, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tab: ProductTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Inventory stats
  const totalProductsCount = products.length;
  const activeCount = products.filter((p) => p.status === "active").length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.maxStock * 0.2).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <>
      <div className="flex-1 flex overflow-hidden h-full">
          {/* ─── Products List Panel ─── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Page header */}
            <div className="px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-extrabold text-white">Product Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage your catalog, inventory, and listings.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    <Download size={12} /> Export
                  </button>
                  <button
                    onClick={() => setShowNewProductModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40"
                  >
                    <Plus size={12} /> New Product
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-white/5">
                {TAB_ITEMS.map((tab) => {
                  // badge counts
                  let badge: number | null = null;
                  if (tab.key === "drafts") badge = MOCK_PRODUCTS.filter((p) => p.status === "draft").length;
                  if (tab.key === "alerts") badge = lowStockCount + outOfStockCount;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                        activeTab === tab.key
                          ? "text-violet-400"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {tab.label}
                      {badge !== null && badge > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          tab.key === "alerts"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-violet-500/15 text-violet-400"
                        }`}>
                          {badge}
                        </span>
                      )}
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inventory Overview Card */}
            <div className="px-6 pb-3 shrink-0">
              <div className="rounded-2xl bg-[#14121C] border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white">Inventory Overview</h2>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                      <Filter size={12} />
                    </button>
                    <button className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                      <MoreVertical size={12} />
                    </button>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-3 mb-0">
                  {[
                    { label: "Total", value: totalProductsCount, color: "text-white", bg: "bg-white/5" },
                    { label: "Active", value: activeCount, color: "text-emerald-400", bg: "bg-emerald-500/5" },
                    { label: "Low Stock", value: lowStockCount, color: "text-amber-400", bg: "bg-amber-500/5" },
                    { label: "Out of Stock", value: outOfStockCount, color: "text-red-400", bg: "bg-red-500/5" },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl ${stat.bg} border border-white/5 px-3 py-2 text-center`}>
                      <div className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase font-bold tracking-widest text-gray-600 border-b border-white/[0.03]">
                  <span className="col-span-1">Image</span>
                  <span className="col-span-3">Name & SKU</span>
                  <span className="col-span-2 text-center">Category</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-center">Stock</span>
                  <span className="col-span-1 text-center">Status</span>
                  <span className="col-span-1 text-center">Actions</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-white/[0.03]">
                  {paginatedProducts.length === 0 ? (
                    <div className="py-16 text-center">
                      <Package size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No products found</p>
                      <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    paginatedProducts.map((product) => {
                      const s = STATUS_CONFIG[product.status];
                      const catColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Tech;
                      const isSelected = selectedProduct?.id === product.id;
                      return (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className={`w-full grid grid-cols-12 items-center px-5 py-3.5 transition-all text-left ${
                            isSelected
                              ? "bg-violet-500/5 border-l-2 border-l-violet-500"
                              : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                          }`}
                        >
                          {/* Image */}
                          <div className="col-span-1">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.imageBg} border border-white/5 flex items-center justify-center text-lg`}
                            >
                              {product.image}
                            </div>
                          </div>

                          {/* Name & SKU */}
                          <div className="col-span-3">
                            <div className="text-xs font-semibold text-white truncate">{product.name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                              SKU: {product.sku}
                            </div>
                          </div>

                          {/* Category */}
                          <div className="col-span-2 flex justify-center">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catColor}`}>
                              {product.category}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="col-span-2 text-right">
                            <span className="text-xs font-bold text-white">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Stock */}
                          <div className="col-span-2 flex justify-center">
                            <StockBar stock={product.stock} max={product.maxStock} />
                          </div>

                          {/* Status */}
                          <div className="col-span-1 flex justify-center">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="p-1.5 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                              <Edit3 size={11} />
                            </button>
                            <button className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                              <Copy size={11} />
                            </button>
                            <button className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer info + Pagination */}
              <div className="flex items-center justify-between py-4 pb-6">
                <span className="text-xs text-gray-600">
                  Showing {paginatedProducts.length} of {filteredProducts.length} products
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                    >
                      <ChevronLeft size={12} /> Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "text-gray-500 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Product Detail Side Panel ─── */}
          {selectedProduct && (
            <aside className="w-[400px] shrink-0 border-l border-white/5 bg-[#0F0D1A] flex flex-col overflow-hidden animate-in">
              {/* Panel header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Product Details</h2>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Basic Information */}
                <div>
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    {/* Product Name */}
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Product Name</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus-within:border-violet-500/40 transition-colors">
                        {selectedProduct.name}
                      </div>
                    </div>

                    {/* SKU + Category row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium mb-1 block">SKU</label>
                        <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white font-mono">
                          {selectedProduct.sku}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium mb-1 block">Category</label>
                        <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white flex items-center justify-between">
                          {selectedProduct.category}
                          <ChevronRight size={10} className="text-gray-600 rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Description</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-300 leading-relaxed min-h-[65px]">
                        {selectedProduct.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                    Media
                  </h3>
                  <div className="flex gap-2">
                    {selectedProduct.mediaImages.map((emoji, idx) => (
                      <div
                        key={idx}
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedProduct.imageBg} border border-white/5 flex items-center justify-center text-2xl relative group cursor-pointer`}
                      >
                        {emoji}
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={14} className="text-white" />
                        </div>
                      </div>
                    ))}
                    <button className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/40 flex flex-col items-center justify-center gap-1 transition-colors group">
                      <Upload size={14} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
                      <span className="text-[8px] text-gray-600 group-hover:text-violet-400 transition-colors font-medium">Upload</span>
                    </button>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div>
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                    Pricing & Stock
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Price</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
                        ${selectedProduct.price.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Stock</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white flex items-center gap-2">
                        <span className="font-bold">{selectedProduct.stock}</span>
                        <span className="text-gray-600">/ {selectedProduct.maxStock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StockBar stock={selectedProduct.stock} max={selectedProduct.maxStock} />
                  </div>
                  {selectedProduct.stock <= selectedProduct.maxStock * 0.2 && selectedProduct.stock > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle size={10} /> Low stock — consider restocking soon
                    </div>
                  )}
                  {selectedProduct.stock === 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle size={10} /> Out of stock!
                    </div>
                  )}
                </div>

                {/* Variations */}
                {selectedProduct.variations.length > 0 && (
                  <div>
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                      Variations
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.variations.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-violet-600/15 flex items-center justify-center">
                              <v.icon size={12} className="text-violet-400" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">{v.type}</div>
                              <div className="text-[10px] text-gray-500">{v.values}</div>
                            </div>
                          </div>
                          <button className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEO Metadata */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      SEO Metadata
                    </h3>
                    <span className="text-[9px] text-violet-400 font-medium cursor-pointer hover:text-violet-300 transition-colors">
                      Optional
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Meta Title</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-300">
                        {selectedProduct.metaTitle}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium mb-1 block">Meta Description</label>
                      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-300 leading-relaxed min-h-[55px]">
                        {selectedProduct.metaDescription}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                    Status
                  </h3>
                  <div className="flex gap-2">
                    {(["active", "draft", "archived"] as ProductStatus[]).map((status) => {
                      const cfg = STATUS_CONFIG[status];
                      const isActive = selectedProduct.status === status;
                      return (
                        <button
                          key={status}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            isActive
                              ? cfg.cls + " ring-1 ring-current"
                              : "border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : "bg-gray-700"}`} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-4 border-t border-white/5 shrink-0">
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40">
                    Save Product
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all">
                    Discard
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>

      {/* ─── New Product Modal ─── */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewProductModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-[#14121C] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-black/50 animate-modal">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">New Product</h2>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Category</label>
                  <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors appearance-none">
                    <option value="">Select category</option>
                    <option value="tech">Tech</option>
                    <option value="fashion">Fashion</option>
                    <option value="audio">Audio</option>
                    <option value="accessories">Accessories</option>
                    <option value="home">Home</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Price</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Media</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-violet-500/30 transition-colors cursor-pointer">
                  <Upload size={20} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Drag & drop images or click to upload</p>
                  <p className="text-[10px] text-gray-600 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40"
              >
                Create Product
              </button>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-in { animation: slideIn 0.25s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal { animation: modalIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
