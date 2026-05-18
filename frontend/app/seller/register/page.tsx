"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Package,
  TrendingUp,
  Shield,
  Users,
  Zap,
  ChevronRight,
  FileText,
  Globe,
  Star,
} from "lucide-react";
import { shopsService } from "@/services/shops.service";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const BENEFITS = [
  { icon: TrendingUp, title: "Reach millions of buyers", desc: "Access our growing customer base and scale your business nationwide." },
  { icon: Shield, title: "Secure & protected", desc: "Your earnings are protected by our escrow system and seller guarantee." },
  { icon: Zap, title: "Fast payouts", desc: "Get paid within 2 business days after order completion." },
  { icon: Users, title: "Dedicated support", desc: "Our seller success team is available 24/7 to help you grow." },
];

const STATS = [
  { value: "2M+", label: "Active Buyers" },
  { value: "50K+", label: "Sellers" },
  { value: "98%", label: "Satisfaction" },
  { value: "0đ", label: "Phí đăng ký" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SellerRegisterPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user === null && !isAuthenticated) {
      router.push("/login?redirect=/seller/register&reason=unauthenticated");
    }
  }, [user, isAuthenticated, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Shop name is required";
    else if (form.name.trim().length < 3) e.name = "Shop name must be at least 3 characters";
    else if (form.name.trim().length > 50) e.name = "Shop name must be under 50 characters";
    if (form.description.trim().length > 500) e.description = "Description must be under 500 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await shopsService.create({ name: form.name.trim(), description: form.description.trim() || undefined });
      setStep(3);
      toast.success("Your shop has been submitted for review!");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.toLowerCase().includes("already")) {
        toast.error("You already have a shop. Redirecting...");
        setTimeout(() => router.push("/vendor/dashboard"), 1500);
      } else {
        toast.error(msg || "Failed to create shop. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero section breadcrumb ────────────────────────────────── */}
      <div className="border-b border-card-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium">Seller Center</span>
          <ChevronRight size={12} />
          <span className="text-purple-600">Register</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* ─── Left: Benefits Panel ────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 mb-5">
                <Sparkles size={12} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-600">Join 50,000+ successful sellers</span>
              </div>
              <h1 className="text-4xl font-black text-foreground leading-tight mb-4">
                Start selling on<br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">ProjectIII today</span>
              </h1>
              <p className="text-gray-500 text-base leading-relaxed">
                Join millions of entrepreneurs who have built thriving businesses on our platform. Zero setup fees, powerful tools, and a massive customer base awaiting your products.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-10">
              {STATS.map((s) => (
                <div key={s.label} className="text-center p-3 rounded-2xl bg-card border border-card-border shadow-sm">
                  <div className="text-xl font-black text-purple-600">{s.value}</div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-card-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <b.icon size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground mb-0.5">{b.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-300 fill-yellow-300" />)}
              </div>
              <p className="text-white/90 text-sm leading-relaxed italic mb-4">
                "I went from zero to $50k monthly revenue in just 8 months. ProjectIII's platform made it incredibly easy to reach customers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">ML</div>
                <div>
                  <div className="text-white text-xs font-bold">Marcus Lin</div>
                  <div className="text-white/60 text-[10px]">Electronics Seller · Joined 2024</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Form Panel ───────────────────────────────────────── */}
          <div>
            {/* Step indicator */}
            {step < 3 && (
              <div className="flex items-center gap-2 mb-6">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? "bg-purple-600 text-white shadow-md shadow-purple-500/30" : "bg-gray-100 text-gray-400"}`}>
                      {step > s ? <CheckCircle2 size={14} /> : s}
                    </div>
                    <span className={`text-xs font-semibold ${step >= s ? "text-purple-600" : "text-gray-400"}`}>
                      {s === 1 ? "Shop Details" : "Review & Submit"}
                    </span>
                    {s < 2 && <ChevronRight size={12} className="text-gray-300" />}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-card rounded-3xl border border-card-border shadow-xl shadow-black/5 overflow-hidden">

              {/* ── Step 1 ── */}
              {step === 1 && (
                <div className="p-8">
                  <div className="mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
                      <Store size={22} className="text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-1">Set up your shop</h2>
                    <p className="text-sm text-gray-500">Tell us about your business to get started.</p>
                  </div>

                  <div className="space-y-5">
                    {/* Shop Name */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Shop Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                        placeholder="e.g. TechGear Store, Fashion House..."
                        maxLength={50}
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground bg-input-bg placeholder:text-gray-400 outline-none transition-all ${errors.name ? "border-red-400 focus:ring-2 focus:ring-red-500/20" : "border-card-border focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"}`}
                      />
                      <div className="flex items-start justify-between mt-1.5">
                        {errors.name
                          ? <p className="text-xs text-red-500">{errors.name}</p>
                          : <p className="text-xs text-gray-400">This will be your public shop name</p>}
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{form.name.length}/50</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Shop Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
                        placeholder="Tell buyers what your shop is about, what you sell, and what makes you unique..."
                        rows={4}
                        maxLength={500}
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground bg-input-bg placeholder:text-gray-400 outline-none resize-none leading-relaxed transition-all ${errors.description ? "border-red-400" : "border-card-border focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"}`}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-gray-400">{form.description.length}/500</span>
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <FileText size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Your shop will be reviewed before going live. This usually takes <strong>1–3 business days</strong>. You'll be notified by email once approved.
                      </p>
                    </div>

                    <button
                      onClick={() => { if (validate()) setStep(2); }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-purple-500 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25"
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <div className="p-8">
                  <div className="mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                      <FileText size={22} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-1">Review your shop</h2>
                    <p className="text-sm text-gray-500">Confirm the details before submitting.</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="p-4 rounded-xl bg-background border border-card-border">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Shop Name</div>
                      <div className="text-sm font-bold text-foreground">{form.name}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-card-border">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Description</div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {form.description || <span className="italic text-gray-400">No description provided</span>}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-card-border">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Owner Account</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {(user?.full_name || user?.email || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{user?.full_name}</div>
                          <div className="text-xs text-gray-400">{user?.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <Shield size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        By submitting, you agree to ProjectIII's{" "}
                        <span className="font-bold underline cursor-pointer">Seller Terms</span> and{" "}
                        <span className="font-bold underline cursor-pointer">Privacy Policy</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 rounded-xl border border-card-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-card transition-all"
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25 disabled:opacity-60"
                    >
                      {loading ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Submitting...</>
                      ) : (
                        <><Sparkles size={15} /> Submit Application</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Success ── */}
              {step === 3 && (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">Application Submitted!</h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-1">
                    Your shop <span className="font-bold text-foreground">"{form.name}"</span> has been submitted for review.
                  </p>
                  <p className="text-sm text-gray-400 mb-8">
                    Our team reviews applications within <strong className="text-foreground">1–3 business days</strong>.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { icon: Package, label: "List Products", desc: "Add your first product" },
                      { icon: Globe, label: "Go Live", desc: "After admin approval" },
                      { icon: TrendingUp, label: "Start Selling", desc: "Reach millions" },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-background border border-card-border text-center">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-2">
                          <s.icon size={14} className="text-purple-600" />
                        </div>
                        <div className="text-xs font-bold text-foreground">{s.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/vendor/dashboard"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-500/20"
                    >
                      Go to Seller Dashboard <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/"
                      className="w-full text-center py-2.5 text-sm text-gray-400 hover:text-foreground transition-colors"
                    >
                      Back to shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
