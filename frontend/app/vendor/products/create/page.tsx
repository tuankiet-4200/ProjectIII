"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Upload, 
  Save, 
  Info,
  Package,
  Banknote,
  Tag,
  AlignLeft,
  XCircle,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { categoriesService } from "@/services/categories.service";
import { productsService } from "@/services/products.service";
import { shopsService } from "@/services/shops.service";
import { uploadService } from "@/services/upload.service";
import type { Category } from "@/types";
import Link from "next/link";
import CategorySelect from "@/components/vendor/CategorySelect";

const parseLineList = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const parseSpecifications = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return { label: line, value: "" };
      }
      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((spec) => spec.label && spec.value);

export default function CreateProduct() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    featuresText: "",
    specificationsText: "",
    price: "",
    stock_quantity: "",
    category_id: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesService.getAll();
        setCategories(data);
      } catch {
        toast.error("Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || prev.slug === "" ? generateSlug(name) : prev.slug
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.category_id || !formData.price || !formData.stock_quantity) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const shop = await shopsService.getMyShop();
      if (!shop?.id) {
        throw new Error("Could not find your shop.");
      }

      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadService.uploadMultiple(images);
      }

      await productsService.create(shop.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        features: parseLineList(formData.featuresText),
        specifications: parseSpecifications(formData.specificationsText),
        price: Number(formData.price),
        stock_quantity: Number(formData.stock_quantity),
        category_id: Number(formData.category_id),
        images: imageUrls
      });

      toast.success("Product created successfully!");
      router.push("/vendor/products");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create product. The slug might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* ─── Page Header ─── */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 bg-[#0F0D1A]/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/vendor/products"
            className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Add New Product</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Create a new listing for your store</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/vendor/products"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
          >
            <XCircle size={14} /> Discard
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
            Save Product
          </button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full">
        <form id="product-form" onSubmit={handleSubmit} className="flex gap-6 items-start">
          
          {/* ─── Left Column (Main Details) ─── */}
          <div className="flex-1 space-y-6">
            
            {/* Basic Information */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <Info size={14} className="text-violet-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Basic Information</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Product Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Sony WH-1000XM4 Wireless Headphones"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <div className="relative">
                    <AlignLeft size={14} className="absolute top-3.5 left-3.5 text-gray-600" />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write a compelling description..."
                      rows={5}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all resize-y"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Đặc điểm nổi bật</label>
                  <textarea
                    value={formData.featuresText}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuresText: e.target.value }))}
                    placeholder={"Mỗi dòng một đặc điểm\nVí dụ: Chống nước 5ATM"}
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all resize-y"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Thông số kỹ thuật</label>
                  <textarea
                    value={formData.specificationsText}
                    onChange={(e) => setFormData(prev => ({ ...prev, specificationsText: e.target.value }))}
                    placeholder={"Mỗi dòng theo dạng Tên: Giá trị\nVí dụ: Chất liệu: Thép không gỉ"}
                    rows={5}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Banknote size={14} className="text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Giá bán</h2>
                </div>
                <div className="p-5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Giá bán (VNĐ) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₫</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Package size={14} className="text-blue-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Inventory</h2>
                </div>
                <div className="p-5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Stock Quantity <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ─── Right Column (Organization & Media) ─── */}
          <div className="w-[340px] shrink-0 space-y-6">
            
            {/* Organization */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <Tag size={14} className="text-rose-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Organization</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Danh mục sản phẩm <span className="text-red-400">*</span></label>
                  <CategorySelect
                    categories={categories}
                    value={formData.category_id}
                    onChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                  />
                  {isLoadingCategories && <p className="text-[10px] text-gray-500 mt-1">Đang tải danh mục...</p>}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">URL Slug <span className="text-red-400">*</span></label>
                    <span className="text-[9px] text-gray-500">Auto-generated</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="product-url-slug"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-300 font-mono placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="rounded-2xl bg-[#14121C] border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <Upload size={14} className="text-amber-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Product Media</h2>
              </div>
              <div className="p-5">
                <label className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all">
                    <Upload size={20} className="text-gray-400 group-hover:text-violet-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Click to upload</h3>
                  <p className="text-[10px] text-gray-500 max-w-[180px]">
                    PNG, JPG or WEBP (max. 10MB)
                  </p>
                </label>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                        <img src={src} alt={`Preview ${index}`} className="w-full h-full object-contain bg-white dark:bg-[#1a1a2e] p-1" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
