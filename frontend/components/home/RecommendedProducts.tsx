"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Product } from "@/types";
import FeaturedProductCard from "@/components/home/FeaturedProductCard";
import { useAuthStore } from "@/store/useAuthStore";

export default function RecommendedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const recentSearch = localStorage.getItem("recent_search");
      const queryStr = recentSearch ? `?q=${encodeURIComponent(recentSearch)}` : "";

      try {
        const { isAuthenticated } = useAuthStore.getState();
        let res;
        if (isAuthenticated) {
           res = await api.get(`/recommendations${queryStr}`);
        } else {
           res = await api.get(`/recommendations/public${queryStr}`);
        }
        
        if (res.data && Array.isArray(res.data)) {
           setProducts(res.data);
        } else if (res.data && Array.isArray(res.data.recommendations)) {
           setProducts(res.data.recommendations);
        } else {
           setProducts(res.data || []);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
            try {
               const publicRes = await api.get(`/recommendations/public${queryStr}`);
               if (publicRes.data && Array.isArray(publicRes.data)) {
                  setProducts(publicRes.data);
               } else if (publicRes.data && Array.isArray(publicRes.data.recommendations)) {
                  setProducts(publicRes.data.recommendations);
               } else {
                  setProducts(publicRes.data || []);
               }
            } catch (err) {
               console.error("Public recommendations failed", err);
            }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
        <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
            <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                <span className="font-medium">Đang tải sản phẩm...</span>
            </div>
        </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Featured Drops</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">Hand-picked premium selections</p>
        </div>
        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-card-border">
          <Link href="/products" className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white">All Products</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
