"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { homeContentService } from "@/services/home-content.service";
import type { HomeBanner as HomeBannerType } from "@/types";

export const DEFAULT_HOME_BANNER: Omit<HomeBannerType, "id" | "created_at" | "updated_at"> = {
  eyebrow: "SEASONAL DROP",
  title: "Định nghĩa lại phong cách công nghệ.",
  subtitle: "Tuyển chọn thiết bị điện tử hiệu năng cao và thời trang thủ công cho người dùng hiện đại.",
  primary_label: "Khám phá bộ sưu tập",
  primary_href: "/products",
  secondary_label: "Xem lookbook",
  secondary_href: "/products",
  visual_label: "THỜI TRANG SỐ CAO CẤP",
  is_active: true,
};

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 6) return title;

  const middle = Math.ceil(words.length / 2);
  return (
    <>
      {words.slice(0, middle).join(" ")}
      <br />
      {words.slice(middle).join(" ")}
    </>
  );
}

export default function HomeBanner() {
  const [banner, setBanner] = useState(DEFAULT_HOME_BANNER);

  useEffect(() => {
    let isMounted = true;

    homeContentService
      .getBanner()
      .then((data) => {
        if (isMounted) setBanner(data);
      })
      .catch(() => {
        if (isMounted) setBanner(DEFAULT_HOME_BANNER);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="container mx-auto max-w-7xl px-4 lg:px-8 pt-8 pb-16">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-card-border p-8 md:p-16 lg:p-20 shadow-2xl transition-colors duration-300">
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none hidden md:block" />
        <div className="absolute right-20 top-20 border-2 border-cyan-500/30 rounded-lg px-8 py-4 opacity-40 shadow-[0_0_30px_rgba(6,182,212,0.3)] hidden lg:block">
          <span className="text-cyan-500/70 tracking-[0.2em] font-bold text-xl uppercase">
            {banner.visual_label}
          </span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-6 ring-1 ring-primary/30">
            {banner.eyebrow}
          </div>
          <h1 className="text-5xl tracking-tight font-extrabold text-foreground sm:text-6xl md:text-7xl mb-6 leading-[1.1]">
            {splitTitle(banner.title)}
          </h1>
          <p className="max-w-xl text-lg text-slate-500 dark:text-gray-400 mb-10 leading-relaxed">
            {banner.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={banner.primary_href || "/products"}
              className="rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 text-center"
            >
              {banner.primary_label}
            </Link>
            <Link
              href={banner.secondary_href || "/products"}
              className="rounded-lg bg-white/5 border border-card-border px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all text-center"
            >
              {banner.secondary_label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
