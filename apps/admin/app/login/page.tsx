'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../lib/api';

type LoginResult = { accessToken: string; admin: { id: string; name: string; email: string } };

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('pch_admin_token')) router.replace('/dashboard');
  }, [router]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const result = await adminApiFetch<LoginResult>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem('pch_admin_token', result.accessToken);
      router.replace('/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <form
        onSubmit={(event) => void login(event)}
        className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          Pune Caring Hands
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Admin sign in</h1>
        <label className="mt-7 block space-y-2 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-navy-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
