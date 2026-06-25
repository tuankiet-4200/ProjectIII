"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Type,
} from "lucide-react";
import { DEFAULT_HOME_BANNER } from "@/components/home/HomeBanner";
import { homeContentService } from "@/services/home-content.service";
import type { HomeBanner, UpdateHomeBannerData } from "@/types";

type BannerForm = UpdateHomeBannerData;

const emptyBannerForm: BannerForm = {
  eyebrow: DEFAULT_HOME_BANNER.eyebrow,
  title: DEFAULT_HOME_BANNER.title,
  subtitle: DEFAULT_HOME_BANNER.subtitle,
  primary_label: DEFAULT_HOME_BANNER.primary_label,
  primary_href: DEFAULT_HOME_BANNER.primary_href,
  secondary_label: DEFAULT_HOME_BANNER.secondary_label,
  secondary_href: DEFAULT_HOME_BANNER.secondary_href,
  visual_label: DEFAULT_HOME_BANNER.visual_label,
};

function Field({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-violet-500/50";

  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-gray-300">{label}</span>
        <span className="text-[10px] text-gray-600">
          {value.length}/{maxLength}
        </span>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={4}
          placeholder={placeholder}
          className={`${baseClass} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </label>
  );
}

function BannerPreview({ banner }: { banner: BannerForm }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white p-8 text-slate-950 shadow-2xl">
      <div className="absolute right-8 top-1/2 hidden h-40 w-72 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[80px] md:block" />
      <div className="absolute right-8 top-8 hidden rounded-lg border-2 border-cyan-400/30 px-5 py-3 opacity-60 shadow-[0_0_25px_rgba(6,182,212,0.25)] lg:block">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-500/70">
          {banner.visual_label}
        </span>
      </div>

      <div className="relative z-10 max-w-xl">
        <div className="mb-5 inline-flex rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-600 ring-1 ring-violet-500/20">
          {banner.eyebrow}
        </div>
        <h2 className="mb-5 max-w-lg text-4xl font-black leading-tight tracking-tight text-slate-950">
          {banner.title}
        </h2>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
          {banner.subtitle}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <span className="rounded-lg bg-violet-600 px-6 py-3 text-center text-xs font-bold text-white shadow-lg">
            {banner.primary_label}
          </span>
          <span className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-center text-xs font-bold text-slate-950">
            {banner.secondary_label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<BannerForm>(emptyBannerForm);
  const [bannerId, setBannerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const updatedAt = useMemo(() => {
    if (!bannerId) return "Chưa tải";
    return `Banner #${bannerId}`;
  }, [bannerId]);

  const setField = (field: keyof BannerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const loadBanner = async () => {
    try {
      setLoading(true);
      const data: HomeBanner = await homeContentService.getAdminBanner();
      setBannerId(data.id);
      setForm({
        eyebrow: data.eyebrow,
        title: data.title,
        subtitle: data.subtitle,
        primary_label: data.primary_label,
        primary_href: data.primary_href,
        secondary_label: data.secondary_label,
        secondary_href: data.secondary_href,
        visual_label: data.visual_label,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không tải được banner trang chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanner();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title?.trim() || !form.subtitle?.trim()) {
      toast.error("Tiêu đề và mô tả không được để trống");
      return;
    }

    try {
      setSaving(true);
      const data = await homeContentService.updateBanner(form);
      setBannerId(data.id);
      setForm({
        eyebrow: data.eyebrow,
        title: data.title,
        subtitle: data.subtitle,
        primary_label: data.primary_label,
        primary_href: data.primary_href,
        secondary_label: data.secondary_label,
        secondary_href: data.secondary_href,
        visual_label: data.visual_label,
      });
      toast.success("Đã cập nhật banner trang chủ");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không lưu được banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Cài đặt trang chủ</h1>
          <p className="mt-1 text-xs text-gray-500">
            Quản lý nội dung banner đầu trang đang hiển thị ở trang mua sắm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBanner}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow shadow-violet-900/40 transition-all hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Lưu banner
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(480px,1.05fr)]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0F0D1A] p-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
              <Type size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Nội dung banner</h2>
              <p className="text-[11px] text-gray-600">{updatedAt}</p>
            </div>
          </div>

          <Field
            label="Nhãn nhỏ"
            value={form.eyebrow || ""}
            onChange={(value) => setField("eyebrow", value)}
            maxLength={80}
          />
          <Field
            label="Tiêu đề chính"
            value={form.title || ""}
            onChange={(value) => setField("title", value)}
            maxLength={140}
            multiline
          />
          <Field
            label="Mô tả"
            value={form.subtitle || ""}
            onChange={(value) => setField("subtitle", value)}
            maxLength={260}
            multiline
          />
          <Field
            label="Dòng chữ trang trí bên phải"
            value={form.visual_label || ""}
            onChange={(value) => setField("visual_label", value)}
            maxLength={80}
          />

          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-3 text-xs text-emerald-300">
            Banner đang được dùng làm nội dung chính của trang chủ.
          </div>
        </section>

        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0F0D1A] p-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <Link2 size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Nút điều hướng</h2>
                <p className="text-[11px] text-gray-600">Dùng đường dẫn nội bộ như /products hoặc URL đầy đủ.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Text nút chính"
                value={form.primary_label || ""}
                onChange={(value) => setField("primary_label", value)}
                maxLength={60}
              />
              <Field
                label="Link nút chính"
                value={form.primary_href || ""}
                onChange={(value) => setField("primary_href", value)}
                maxLength={300}
              />
              <Field
                label="Text nút phụ"
                value={form.secondary_label || ""}
                onChange={(value) => setField("secondary_label", value)}
                maxLength={60}
              />
              <Field
                label="Link nút phụ"
                value={form.secondary_href || ""}
                onChange={(value) => setField("secondary_href", value)}
                maxLength={300}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0F0D1A] p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <Eye size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Xem trước</h2>
                <p className="text-[11px] text-gray-600">Preview tương đối theo banner ngoài trang chủ.</p>
              </div>
              <Sparkles size={15} className="ml-auto text-violet-300" />
            </div>
            <BannerPreview banner={form} />
          </section>
        </div>
      </div>
    </form>
  );
}
