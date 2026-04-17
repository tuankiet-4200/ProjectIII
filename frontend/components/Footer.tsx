import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0914] pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-white">P3</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">ProjectIII</span>
            </Link>
            <p className="max-w-xs text-sm text-gray-400 leading-relaxed">
              The world's leading premium marketplace for high-end tech, minimalist fashion, and luxury lifestyle goods.
            </p>
            <div className="mt-6 flex gap-4">
              {/* Note: Just place holders for social icons based on design */}
              <div className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
                <span className="text-xs">IG</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
                <span className="text-xs">TW</span>
              </div>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">Marketplace</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">New Drops</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Featured Shops</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Sell on ProjectIII</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">Community</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-primary transition-colors">VIP Collective</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Affiliate Program</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Creator Hub</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Forum</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">Newsletter</h4>
            <p className="mb-4 text-sm text-gray-400">Get early drop notifications and exclusive deals.</p>
            <div className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 p-1">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-3 text-sm text-white focus:outline-none"
              />
              <button className="flex h-8 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">© 2026 ProjectIII. ALL RIGHTS RESERVED.</p>
          <div className="mt-4 flex gap-6 text-xs text-gray-500 sm:mt-0">
            <Link href="#" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
            <Link href="#" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <Link href="#" className="hover:text-white transition-colors">COOKIE SETTINGS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
