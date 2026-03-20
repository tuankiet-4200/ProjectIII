import Link from "next/link";
import { Search, ShoppingCart, Heart, Grid } from "lucide-react";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0914]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">LUXEMARKET</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex max-w-2xl">
          <div className="flex h-10 w-full items-center rounded-full border border-white/10 bg-white/5 px-4 text-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <button className="flex items-center gap-2 pr-4 text-gray-400 hover:text-white border-r border-white/10 shrink-0">
              <Grid size={16} />
              <span>Categories</span>
            </button>
            <input
              type="text"
              placeholder="Search premium products..."
              className="flex-1 bg-transparent px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none"
            />
            <button className="text-gray-400 hover:text-white shrink-0">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <ShoppingCart size={22} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Heart size={22} />
          </button>
          <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 hover:bg-white/10 transition-colors">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-800">
              <img src="https://i.pravatar.cc/150?u=alex" alt="Alex Rivera" className="h-full w-full object-cover" />
            </div>
            <div className="hidden flex-col items-start text-xs sm:flex">
              <span className="font-semibold text-white">Alex Rivera</span>
              <span className="text-gray-400">Pro Member</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
