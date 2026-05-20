'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useNotifications } from '@/hooks/useNotifications';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useNotifications(); // Khởi động socket lắng nghe thông báo toàn app

  const hideGlobalChrome =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/logout') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor');

  if (hideGlobalChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
