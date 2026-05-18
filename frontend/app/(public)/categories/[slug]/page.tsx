"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import { categoriesService } from "@/services/categories.service";
import { productsService } from "@/services/products.service";
import type { Category } from "@/types";

// Recursively find category by slug in nested tree
const findCategoryBySlug = (categories: Category[], slug: string): Category | null => {
  for (const category of categories) {
    if (category.slug === slug) return category;
    if (category.children?.length) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
    }
  }
  return null;
};

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // 1. Get all categories (nested tree)
        const categories = await categoriesService.getAll();
        const found = findCategoryBySlug(categories, slug);
        setCurrentCategory(found || null);

        if (!found) {
          setProducts([]);
          return;
        }

        // 2. Collect IDs: the category itself + all its children
        const ids: number[] = [
          found.id,
          ...(found.children?.map((c) => c.id) || []),
        ];

        // 3. Fetch products for all IDs in parallel
        const results = await Promise.all(
          ids.map((id) =>
            productsService.getAll({ category_id: id, limit: 100 }).catch(() => null)
          )
        );

        const allProducts = results
          .filter(Boolean)
          .flatMap((r: any) => r?.data || r?.products || []);

        // Deduplicate by id
        const seen = new Set<string>();
        const unique = allProducts.filter((p: any) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        setProducts(unique);
      } catch (err) {
        console.error("Failed to load category page:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? "Đang tải..." : currentCategory?.name || "Danh mục không tồn tại"}
            </h1>
            {!isLoading && (
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {products.length} sản phẩm
              </p>
            )}
          </div>
          <Link
            href="/categories"
            className="text-sm font-semibold text-violet-500 hover:text-violet-400 transition-colors"
          >
            Quay lại danh mục
          </Link>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-card-border overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-2 rounded bg-white/5 w-1/3" />
                  <div className="h-3 rounded bg-white/5 w-3/4" />
                  <div className="h-4 rounded bg-white/5 w-1/2 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products grid */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div
                key={product.id}
                className="rounded-2xl bg-card border border-card-border overflow-hidden hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all group"
              >
                <div className="relative aspect-square bg-white">
                  {product.images?.[0] ? (
                    <img
                      src={getPublicImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase font-bold text-violet-400 tracking-wide mb-1">
                    {product.shop?.name || "Cửa hàng"}
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm font-semibold text-foreground line-clamp-2 hover:text-violet-400 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-3 text-base font-bold text-foreground">
                    {formatVnd(Number(product.price))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-card-border bg-card p-16 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-500 dark:text-gray-400 font-medium">
              {currentCategory
                ? "Chưa có sản phẩm trong danh mục này."
                : "Không tìm thấy danh mục này."}
            </p>
            <Link
              href="/categories"
              className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Xem tất cả danh mục →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
