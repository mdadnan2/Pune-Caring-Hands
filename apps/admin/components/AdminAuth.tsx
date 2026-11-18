'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (!stored) {
      router.replace('/login');
      return;
    }
    setToken(stored);
  }, [router]);

  if (!token) {
    return <main className="mx-auto max-w-5xl px-6 py-16 text-slate-600">Checking admin session...</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="font-bold text-slate-900" href="/bookings">Pune Caring Hands · Admin</Link>
          <button
            type="button"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            onClick={() => {
              sessionStorage.removeItem('pch_admin_token');
              router.replace('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
