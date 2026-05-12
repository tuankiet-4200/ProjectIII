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
  mediaImages: string[];
  images: string[];
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

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { productsService } from "@/services/products.service";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from API
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { shopsService } = await import('@/services/shops.service');
      const shop = await shopsService.getMyShop();
      if (shop?.id) {
        const result = await productsService.getAll({ shop_id: shop.id, limit: 50 });
        if (result?.data) {
          const EMOJI_MAP = ['⌚', '👟', '🎧', '👜', '🌿', '📱', '🕶️', '🚴', '🔊', '🕯️', '🛒', '🎁'];
          const BG_MAP = ['from-violet-600/30 to-violet-800/30', 'from-rose-600/30 to-rose-800/30', 'from-blue-600/30 to-blue-800/30', 'from-amber-600/30 to-amber-800/30', 'from-emerald-600/30 to-emerald-800/30', 'from-cyan-600/30 to-cyan-800/30'];
          
          const mapped: Product[] = result.data.map((p: any, i: number) => ({
            id: p.id,
            name: p.name,
            sku: p.slug?.substring(0, 10).toUpperCase() || `SKU-${String(i + 1).padStart(3, '0')}`,
            category: p.category?.name || 'Uncategorized',
            categoryColor: p.category?.name || 'Tech',
            price: Number(p.price) || 0,
            stock: p.stock_quantity || 0,
            maxStock: Math.max(p.stock_quantity || 0, 100),
            status: p.stock_quantity === 0 ? 'archived' as const : p.stock_quantity < 20 ? 'draft' as const : 'active' as const,
            image: EMOJI_MAP[i % EMOJI_MAP.length],
            imageBg: BG_MAP[i % BG_MAP.length],
            description: p.description || '',
            metaDescription: p.description || '',
            variations: [],
            mediaImages: p.images || [EMOJI_MAP[i % EMOJI_MAP.length]],
            images: p.images || [],
          }));
          setProducts(mapped);
          if (mapped.length > 0) setSelectedProduct(mapped[0]);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsService.delete(productId);
      toast.success('Product deleted successfully');
      if (selectedProduct?.id === productId) setSelectedProduct(null);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

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
                    onClick={() => router.push('/vendor/products/create')}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40"
                  >
                    <Plus size={12} /> New Product
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-white/5">
                {TAB_ITEMS.map((tab) => {
                  let badge: number | null = null;
                  if (tab.key === "drafts") badge = products.filter((p) => p.status === "draft").length;
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
                        <div
                          key={product.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedProduct(product)}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedProduct(product)}
                          className={`w-full grid grid-cols-12 items-center px-5 py-3.5 transition-all text-left cursor-pointer ${
                            isSelected
                              ? "bg-violet-500/5 border-l-2 border-l-violet-500"
                              : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                          }`}
                        >
                          {/* Image */}
                          <div className="col-span-1">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.imageBg} border border-white/5 flex items-center justify-center text-lg overflow-hidden shrink-0`}
                            >
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                product.image
                              )}
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
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
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
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-xl border border-white/5 overflow-hidden relative group cursor-pointer shrink-0"
                        >
                          <img src={img} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={14} className="text-white" />
                          </div>
                        </div>
                      ))
                    ) : (
                      selectedProduct.mediaImages.map((emoji, idx) => (
                        <div
                          key={idx}
                          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedProduct.imageBg} border border-white/5 flex items-center justify-center text-2xl relative group cursor-pointer shrink-0`}
                        >
                          {emoji}
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={14} className="text-white" />
                          </div>
                        </div>
                      ))
                    )}
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
