import { CheckCircle2 } from "lucide-react";
import RecommendedProducts from "@/components/home/RecommendedProducts";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 lg:px-8 pt-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-card-border p-8 md:p-16 lg:p-20 shadow-2xl transition-colors duration-300">
          {/* Abstract Glow representing the neon light */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none hidden md:block"></div>
          <div className="absolute right-20 top-20 border-2 border-cyan-500/30 rounded-lg px-8 py-4 opacity-40 shadow-[0_0_30px_rgba(6,182,212,0.3)] hidden lg:block">
            <span className="text-cyan-500/70 tracking-[0.2em] font-bold text-xl uppercase">Digital Haute Couture</span>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-6 ring-1 ring-primary/30">
              SEASONAL DROP
            </div>
            <h1 className="text-5xl tracking-tight font-extrabold text-foreground sm:text-6xl md:text-7xl mb-6 leading-[1.1]">
              Redefine Your <br /> Tech Aesthetic.
            </h1>
            <p className="max-w-xl text-lg text-slate-500 dark:text-gray-400 mb-10 leading-relaxed">
              Curated selection of high-performance electronics and artisanal fashion pieces for the digital elite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                Explore Collection
              </button>
              <button className="rounded-lg bg-white/5 border border-card-border px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                View Lookbook
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products Section */}
      <RecommendedProducts />

      {/* VIP Banner Section */}
      <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-16 mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-card-border flex flex-col lg:flex-row items-center p-8 lg:p-16 gap-12 transition-colors duration-300">
          {/* Background Gradient Effect */}
          <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex-1 w-full text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
              Become a <br className="hidden lg:block"/> LuxeMarket VIP <br className="hidden lg:block"/> Member.
            </h2>
            <p className="max-w-md mx-auto lg:mx-0 text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
              Unlock early access to drops, free worldwide express shipping, and a personal AI shopping concierge.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center lg:justify-start mb-8 text-sm font-medium text-slate-600 dark:text-gray-300">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 size={18} className="text-primary" />
                <span>Free Express Shipping</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 size={18} className="text-primary" />
                <span>Early Drops Access</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 size={18} className="text-primary" />
                <span>5% Cashback</span>
              </div>
            </div>

            <button className="w-full sm:w-auto rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition-transform active:scale-95">
              Get Started - $10/mo
            </button>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-[#4c2975] to-[#250d40] p-1 shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
              <div className="relative z-10 text-center transform transition-transform group-hover:scale-105 duration-500">
                <div className="text-5xl md:text-6xl font-black text-white tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">VIP</div>
                <div className="text-xs md:text-sm tracking-[0.3em] text-white/80 font-medium">ELITE COLLECTIVE</div>
              </div>
              {/* Optional glowing orb for flair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
