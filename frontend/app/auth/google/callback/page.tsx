'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

import type { User } from '@/types';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      router.replace('/login');
      return;
    }

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');

    if (!accessToken || !refreshToken || !userParam) {
      toast.error('Google sign-in response is invalid.');
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(userParam) as Partial<User>;

      setAuth(
        {
          ...user,
          phone: user.phone || '',
        } as User,
        accessToken,
        refreshToken,
      );

      document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;

      const redirectPath = localStorage.getItem('oauth_redirect');
      if (redirectPath) {
        localStorage.removeItem('oauth_redirect');
        router.replace(redirectPath);
        return;
      }

      if (user.role === 'ADMIN') {
        router.replace('/admin/analytics');
        return;
      }

      router.replace('/');
      toast.success('Google sign-in successful!');
    } catch {
      toast.error('Could not complete Google sign-in.');
      router.replace('/login');
    }
  }, [router, setAuth]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">Signing you in...</h1>
        <p className="text-sm text-gray-500 mt-2">Completing Google authentication.</p>
      </div>
    </div>
  );
}