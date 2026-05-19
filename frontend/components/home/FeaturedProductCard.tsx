"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { formatVnd } from "@/lib/currency";
import { getPublicImageUrl } from "@/lib/images";
import type { Product } from "@/types";

type Props = {
  product: Product;
};

export default function FeaturedProductCard({ product }: Props) {
  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
        <button
          onClick={(event) => event.preventDefault()}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/60 transition-colors z-10"
        >
          <Heart size={16} />
        </button>
        {product.images && product.images.length > 0 ? (
          <img src={getPublicImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-3/4 h-3/4 rounded-2xl bg-white shadow-xl border border-gray-200 dark:border-white/5 dark:bg-black/50 overflow-hidden flex items-center justify-center">
            <span className="text-4xl text-slate-300 dark:text-gray-600">P3</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
            {product.shop?.name || "P3 Verified"}
          </span>
          <span className="text-xs text-yellow-500 font-medium flex items-center gap-1">
            <Star size={10} className="fill-current" />
            5.0 <span className="text-slate-500 dark:text-gray-500">({product.sales_count})</span>
          </span>
        </div>
        <h3 className="font-semibold text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-foreground">{formatVnd(Number(product.price))}</div>
            <div className="text-[10px] text-slate-500 dark:text-gray-500">Stock: {product.stock_quantity}</div>
          </div>
          <button
            onClick={(event) => event.preventDefault()}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
