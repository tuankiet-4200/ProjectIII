'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LogoutPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const run = async () => {
      await logout();
      router.replace('/login');
    };

    run();
  }, [logout, router]);

  return null;
}
