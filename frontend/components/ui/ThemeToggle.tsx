'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-card-border bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all group overflow-hidden relative"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 transition-all duration-500 transform ${
            theme === 'dark' ? 'translate-y-10 opacity-0 rotate-90' : 'translate-y-0 opacity-100 rotate-0'
          } text-amber-500`} 
        />
        <Moon 
          className={`absolute inset-0 transition-all duration-500 transform ${
            theme === 'dark' ? 'translate-y-0 opacity-100 rotate-0' : '-translate-y-10 opacity-0 -rotate-90'
          } text-purple-400`} 
        />
      </div>
    </button>
  );
}
