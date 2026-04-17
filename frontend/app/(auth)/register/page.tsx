'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, User, Shield } from 'lucide-react';
import { authService } from '@/services/auth.service';
import AuthLayout from '@/components/auth/AuthLayout';

export default function RegisterPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const getInputClassName = (hasValue: boolean) =>
    `w-full rounded-xl border pl-12 pr-4 py-3.5 text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-light shadow-sm ${
      hasValue ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`;

  const getPasswordInputClassName = (hasValue: boolean) =>
    `w-full rounded-xl border pl-11 pr-4 py-3.5 text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-light text-sm shadow-sm ${
      hasValue ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Password does not match');
    }

    setLoading(true);
    try {
      await authService.register({
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    localStorage.removeItem('oauth_redirect');
    window.location.href = authService.getGoogleAuthUrl(true);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Create Account</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Join the exclusive world of premium tech and fashion.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <button
          type="button"
          onClick={handleGoogleRegister}
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

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-card-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 text-gray-500 font-medium transition-colors duration-300">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Full Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={getInputClassName(!!formData.full_name)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Phone Number</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <input
              type="tel"
              required
              placeholder="+84 123 456 789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={getInputClassName(!!formData.phone)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="email"
              required
              placeholder="john@luxemarket.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={getInputClassName(!!formData.email)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={getPasswordInputClassName(!!formData.password)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">Confirm</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={getPasswordInputClassName(!!formData.confirmPassword)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="terms"
            required
            className="w-4 h-4 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500" 
          />
          <label htmlFor="terms" className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium tracking-tight">
            I agree to the <Link href="#" className="underline hover:text-purple-600">Terms of Service</Link> and <Link href="#" className="underline hover:text-purple-600">Privacy Policy</Link>.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
        >
          {loading ? 'Processing...' : 'Create My Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
