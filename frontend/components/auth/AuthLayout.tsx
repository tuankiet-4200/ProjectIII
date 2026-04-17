'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative font-sans transition-colors duration-300">
      {/* Background Glows (Only in dark mode) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
      
      {/* Header */}
      <header className="w-full px-8 py-6 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">ProjectIII</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-white/10 mx-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <Link 
            href={isLogin ? "/register" : "/login"}
            className="px-6 py-2 rounded-xl border border-card-border bg-card hover:opacity-80 transition-all text-sm font-medium"
          >
            {isLogin ? "Register" : "Login"}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 pb-20">
        <div className="w-full max-w-[800px]">
          <div className="bg-card backdrop-blur-md border border-card-border rounded-[32px] p-12 shadow-2xl relative transition-colors duration-300">
            {children}
          </div>
        </div>
        
        {/* Footer info under the card */}
        <div className="mt-8 text-center text-xs text-gray-500 space-y-4">
          <p>© 2024 ProjectIII Marketplace. All rights reserved.</p>
          {!isLogin && (
             <div className="flex justify-center gap-6 text-gray-400">
               <Link href="#" className="hover:text-white transition-colors">Support</Link>
               <Link href="#" className="hover:text-white transition-colors">Returns</Link>
               <Link href="#" className="hover:text-white transition-colors">FAQ</Link>
             </div>
          )}
        </div>
      </main>

      {/* Background Decoration for Register Page */}
      {!isLogin && (
        <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none hidden lg:block">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500 fill-current">
            <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="5" y="9" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      )}
    </div>
  );
}
