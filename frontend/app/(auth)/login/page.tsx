'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import AuthLayout from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const getInputClassName = (hasValue: boolean) =>
    `w-full rounded-xl border pl-12 py-4 text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-light shadow-sm ${
      hasValue ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData);
      setAuth(
        response.user,
        response.access_token,
        response.refresh_token
      );
      // Set cookie for middleware auth check
      document.cookie = `access_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      toast.success('Login success!');
      // Redirect based on role
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else if (response.user.role === 'ADMIN') {
        router.push('/admin/analytics');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');

    if (redirect) {
      localStorage.setItem('oauth_redirect', redirect);
    } else {
      localStorage.removeItem('oauth_redirect');
    }

    window.location.href = authService.getGoogleAuthUrl();
  };

  return (
    <AuthLayout>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Access your premium marketplace dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Email or Username</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="email"
              required
              placeholder="name@luxury.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`${getInputClassName(!!formData.email)} pr-4`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Password</label>
            <Link href="#" className="text-xs font-medium text-purple-600 dark:text-purple-500 hover:text-purple-400">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${getInputClassName(!!formData.password)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="remember"
            className="w-4 h-4 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500 focus:ring-offset-card" 
          />
          <label htmlFor="remember" className="text-xs text-gray-500 dark:text-gray-400 font-medium cursor-pointer">Remember this device</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-gray-500 transition-colors duration-300">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 bg-white/5 dark:bg-[#1C1326] border border-card-border hover:bg-black/5 dark:hover:bg-[#251A33] text-foreground py-3.5 rounded-xl transition-all shadow-sm dark:shadow-none"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>

        <div className="pt-6 text-center text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
          By signing in, you agree to our <Link href="#" className="underline hover:text-purple-600 transition-colors">Terms of Service</Link> and <Link href="#" className="underline hover:text-purple-600 transition-colors">Privacy Policy</Link>.
        </div>
      </form>
    </AuthLayout>
  );
}
