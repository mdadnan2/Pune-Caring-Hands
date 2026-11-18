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
          <div className="flex flex-wrap items-center gap-6">
            <Link className="font-bold text-slate-900" href="/bookings">Pune Caring Hands · Admin</Link>
            <nav aria-label="Admin navigation" className="flex gap-4 text-sm font-medium">
              <Link className="text-slate-600 hover:text-slate-900" href="/bookings">Bookings</Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/slots">Slots</Link>
            </nav>
          </div>
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
