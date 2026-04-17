import Image from "next/image";
import Link from "next/link";
import { Headphones, Watch, Shirt, Laptop, Glasses, Coffee, Heart, ShoppingCart, CheckCircle2 } from "lucide-react";

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

      {/* Trending Categories Section */}
      <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Trending Categories</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">Most sought after this week</p>
          </div>
          <Link href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All &gt;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Headphones, name: "Audio" },
            { icon: Watch, name: "Wearables" },
            { icon: Shirt, name: "Fashion" },
            { icon: Laptop, name: "Computing" },
            { icon: Glasses, name: "Optics" },
            { icon: Coffee, name: "Lifestyle" },
          ].map((cat) => (
            <div key={cat.name} className="flex flex-col items-center justify-center p-6 rounded-xl bg-card border border-card-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group">
              <cat.icon size={28} className="text-primary mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-300 group-hover:text-foreground">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Drops Section */}
      <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Featured Drops</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">Hand-picked premium selections</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-card-border">
            <button className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white">All Products</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-500 dark:text-gray-400 hover:text-foreground">Tech</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-500 dark:text-gray-400 hover:text-foreground">Style</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col">
            <div className="relative aspect-square p-6 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/60 transition-colors z-10">
                <Heart size={16} />
              </button>
              <div className="absolute bottom-4 left-4">
                 <span className="inline-flex items-center rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">Limited</span>
              </div>
              {/* Dummy Image Wrapper */}
              <div className="w-3/4 h-3/4 rounded-full bg-black/50 shadow-2xl flex items-center justify-center border border-white/5">
                <Headphones size={64} className="text-gray-400" />
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Horizon Audio Co.</span>
                <span className="text-xs text-yellow-500 font-medium">★ 4.9 <span className="text-slate-500 dark:text-gray-500">(342)</span></span>
              </div>
              <h3 className="font-semibold text-foreground mb-4 line-clamp-1">Onyx Horizon ANC Headphones</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-foreground">$349.99</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-500">Free express worldwide</div>
                </div>
                <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col">
            <div className="relative aspect-square p-6 bg-gradient-to-tl from-gray-200 to-gray-400 flex items-center justify-center">
              <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-gray-800 hover:text-black hover:bg-black/30 transition-colors z-10">
                <Heart size={16} />
              </button>
              <div className="w-2/3 h-2/3 rounded-3xl bg-white shadow-xl border border-gray-200 flex items-center justify-center">
                 <Watch size={48} className="text-gray-800" />
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">LuxeTech</span>
                <span className="text-xs text-yellow-500 font-medium">★ 4.8 <span className="text-slate-500 dark:text-gray-500">(89)</span></span>
              </div>
              <h3 className="font-semibold text-foreground mb-4 line-clamp-1">Zenith Smart Watch V3</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-foreground">$219.50</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-500">Estimated tax applied</div>
                </div>
                <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col">
            <div className="relative aspect-square p-6 bg-gradient-to-tr from-[#2d3748] to-[#4a5568] flex items-center justify-center">
              <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/60 transition-colors z-10">
                <Heart size={16} />
              </button>
              <div className="w-full text-center">
                 <Shirt size={80} className="text-gray-200 mx-auto" />
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Urban Edge</span>
                <span className="text-xs text-yellow-500 font-medium">★ 4.7 <span className="text-slate-500 dark:text-gray-500">(120)</span></span>
              </div>
              <h3 className="font-semibold text-foreground mb-4 line-clamp-1">Neo-Shell Tech Jacket</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-foreground">$185.00</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-500">Only 2 sizes left</div>
                </div>
                <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group rounded-2xl bg-card border border-card-border overflow-hidden hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col">
            <div className="relative aspect-square p-6 bg-gradient-to-b from-[#b1e0db] to-[#6da5a1] flex items-center justify-center">
              <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/60 transition-colors z-10">
                <Heart size={16} />
              </button>
              <div className="w-2/3 h-5/6 bg-[#cd9360] rounded-sm shadow-2xl flex flex-col justify-center items-center gap-2 border-2 border-[#8b5a33]">
                 <div className="w-10 h-10 rounded-full bg-black/80 shadow-inner"></div>
                 <div className="w-16 h-16 rounded-full bg-black/80 shadow-inner"></div>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Oakcraft</span>
                <span className="text-xs text-yellow-500 font-medium">★ 5.0 <span className="text-slate-500 dark:text-gray-500">(42)</span></span>
              </div>
              <h3 className="font-semibold text-foreground mb-4 line-clamp-1">Vintage Oak Desktop Speakers</h3>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-foreground">$450.00</div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-500">Free shipping</div>
                </div>
                <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
