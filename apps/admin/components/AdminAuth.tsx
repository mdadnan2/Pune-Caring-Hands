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
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 text-slate-600">Checking admin session...</main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
          <div className="flex min-w-0 items-center gap-3 md:gap-6">
            <Link className="truncate font-bold text-slate-900" href="/dashboard">
              Pune Caring Hands · Admin
            </Link>
            <nav
              aria-label="Admin navigation"
              className="flex max-w-full gap-2 overflow-x-auto text-sm font-medium md:gap-4"
            >
              <Link
                className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                href="/bookings"
              >
                Bookings
              </Link>
              <Link
                className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                href="/slots"
              >
                Slots
              </Link>
              <Link
                className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                href="/services"
              >
                Services
              </Link>
              <Link
                className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                href="/patients"
              >
                Patients
              </Link>
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
