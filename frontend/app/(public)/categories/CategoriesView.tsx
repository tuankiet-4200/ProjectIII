"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Grid,
  List,
  Tags,
  ArrowRight,
  ChevronDown,
  Loader2,
  Monitor,
  Headphones,
  Speaker,
  Smartphone,
  Camera,
  Gamepad2,
  Watch,
  Home,
  Shirt,
  Footprints,
  Gem,
  Baby,
  UtensilsCrossed,
  BookOpen,
  Palette,
  Dumbbell,
} from "lucide-react";
import { categoriesService } from "@/services/categories.service";
import type { Category } from "@/types";

const GRADIENTS = [
  "from-violet-500/20 to-fuchsia-500/20",
  "from-cyan-500/20 to-blue-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-rose-500/20 to-orange-500/20",
  "from-amber-500/20 to-yellow-500/20",
];

const CATEGORY_ICONS = {
  Monitor,
  Headphones,
  Speaker,
  Smartphone,
  Camera,
  Gamepad: Gamepad2,
  Watch,
  Home,
  Shirt,
  Footprints,
  Gem,
  Baby,
  Utensils: UtensilsCrossed,
  Book: BookOpen,
  Palette,
  Dumbbell,
};

function getCategoryIcon(icon?: string | null) {
  return CATEGORY_ICONS[icon as keyof typeof CATEGORY_ICONS] || Grid;
}

function getCategoryDescription(category: Category) {
  return category.description?.trim() || `Khám phá các sản phẩm trong danh mục ${category.name}.`;
}

export default function CategoriesView() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getCategoryCount = (category: Category) => {
    const ownCount = category._count?.products || 0;
    const childCount = category.children?.reduce((sum, child) => sum + (child._count?.products || 0), 0) || 0;
    return ownCount + childCount;
  };

  useEffect(() => {
    let isActive = true;

    categoriesService
      .getAll()
      .then((data) => {
        if (isActive) setCategories(data || []);
      })
      .catch(() => {
        if (isActive) setCategories([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-12 pb-24 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 mb-4 font-medium">
                <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                <span>/</span>
                <span className="text-primary font-semibold">Danh mục</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                Thư mục danh mục
              </h1>
              <p className="text-base text-slate-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                Duyệt các nhóm sản phẩm đang có trong hệ thống và chọn một danh mục để bắt đầu khám phá.
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-card-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "grid" 
                    ? "bg-primary text-white shadow-md" 
                    : "text-slate-500 dark:text-gray-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Grid size={16} /> <span className="hidden sm:inline">Dạng lưới</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "list" 
                    ? "bg-primary text-white shadow-md" 
                    : "text-slate-500 dark:text-gray-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <List size={16} /> <span className="hidden sm:inline">Dạng danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-card-border bg-card shadow-sm">
            <Loader2 size={44} className="text-primary mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Đang tải danh mục</h3>
            <p className="text-slate-500 dark:text-gray-400 text-center max-w-md">Vui lòng chờ trong giây lát.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-card-border bg-card shadow-sm">
            <Tags size={48} className="text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy danh mục</h3>
            <p className="text-slate-500 dark:text-gray-400 text-center max-w-md">Hiện chưa có danh mục nào trong hệ thống.</p>
          </div>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
          }>
            {categories.map((cat, index) => {
               const gradient = GRADIENTS[index % GRADIENTS.length];
               const Icon = getCategoryIcon(cat.icon);
               
               if (viewMode === "list") {
                 const isExpanded = expandedIds.includes(cat.id);
                 const hasChildren = cat.children && cat.children.length > 0;
                 
                 return (
                   <div key={cat.id} className="group relative rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col">
                     <div className="flex flex-col sm:flex-row items-center p-6 gap-6 relative z-10 bg-transparent">
                       <div className={`absolute left-0 top-0 w-32 h-full bg-gradient-to-r ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-l-2xl`}></div>
                       
                       <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-100 dark:bg-white/5 border border-card-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:text-primary transition-transform duration-300 relative z-10">
                         <Icon size={28} />
                       </div>
                       
                       <div className="flex-1 relative z-10 w-full">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                           <h2 className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{cat.name}</h2>
                           <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mt-2 sm:mt-0">{getCategoryCount(cat)} sản phẩm</span>
                         </div>
                         
                         <p className="text-sm text-slate-500 dark:text-gray-400 mb-2 line-clamp-2 max-w-2xl">
                           {getCategoryDescription(cat)}
                         </p>
                       </div>
                       
                       <div className="shrink-0 relative z-10 w-full sm:w-auto mt-4 sm:mt-0 flex gap-2">
                         {hasChildren && (
                           <button 
                             onClick={() => toggleExpand(cat.id)}
                             className="flex items-center justify-center w-full sm:w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                             aria-label="Toggle subcategories"
                           >
                             <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                           </button>
                         )}
                         <Link href={`/products?category=${cat.slug}`} className="flex items-center justify-center flex-1 sm:flex-none sm:w-12 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 font-semibold gap-2">
                           <span className="sm:hidden">Xem</span>
                           <ArrowRight size={20} />
                         </Link>
                       </div>
                     </div>
                     
                     {/* Expandable Danh mục con Section */}
                     <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded && hasChildren ? "max-h-[1000px] opacity-100 border-t border-card-border" : "max-h-0 opacity-0 border-t-0 border-transparent"}`}>
                       <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-b-2xl">
                         <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                           <Tags size={14} /> Danh mục con
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                           {cat.children?.map(child => (
                             <Link key={child.id} href={`/products?category=${child.slug}`} className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 hover:shadow-md transition-all group/child">
                               <span className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover/child:text-primary transition-colors">
                                 {child.name}
                               </span>
                               <ArrowRight size={14} className="text-slate-400 group-hover/child:text-primary group-hover/child:translate-x-1 transition-all" />
                             </Link>
                           ))}
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               }
               
               // Grid View
               return (
                 <div key={cat.id} className="group relative overflow-hidden rounded-3xl bg-card border border-card-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                   <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradient} rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 opacity-20 group-hover:opacity-40 dark:opacity-30 dark:group-hover:opacity-50 transition-opacity duration-500`}></div>
                   
                   <div className="p-8 relative z-10 flex flex-col flex-1">
                     <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-card-border flex items-center justify-center mb-6 text-foreground group-hover:scale-110 group-hover:text-primary transition-transform duration-300 shadow-sm">
                       <Icon size={24} />
                     </div>
                     
                     <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors">{cat.name}</h2>
                     <p className="text-sm text-slate-500 dark:text-gray-400 mb-8 line-clamp-2 leading-relaxed">
                       {getCategoryDescription(cat)}
                     </p>

                     {cat.children && cat.children.length > 0 && (
                       <div className="mb-8">
                         <h4 className="text-[10px] uppercase font-bold text-primary/80 tracking-widest mb-3">Danh mục con</h4>
                         <div className="flex flex-wrap gap-2">
                           {cat.children.map(child => (
                             <Link key={child.id} href={`/products?category=${child.slug}`} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-primary/10 text-xs font-medium text-slate-600 dark:text-gray-300 hover:text-primary transition-colors border border-transparent dark:border-card-border hover:border-primary/30">
                               {child.name}
                             </Link>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="mt-auto pt-6 border-t border-card-border flex items-center justify-between">
                       <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 group-hover:text-foreground transition-colors">{getCategoryCount(cat)} sản phẩm</span>
                       <Link href={`/products?category=${cat.slug}`} className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                         <ArrowRight size={16} />
                       </Link>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
