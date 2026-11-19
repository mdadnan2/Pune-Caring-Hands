'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../components/AdminAuth';
import { getDashboard, type DashboardData } from '../../lib/api';
import { formatBookingStatus, formatAppointmentType, formatPaymentStatus } from '../../lib/ui-text';

function DashboardPage() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (stored) setToken(stored);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      setData(await getDashboard(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminAuth>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-teal-700">Operations overview</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 rounded-full border bg-white px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <p className="py-10 text-slate-600">Loading dashboard...</p>
        ) : data ? (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Total bookings', data.kpis.totalBookings],
                ["Today's appointments", data.kpis.todaysBookings],
                    ['Payment Verification', data.kpis.pendingPaymentVerification],
                ['Confirmed', data.kpis.confirmed],
                ['Completed', data.kpis.completed],
                ['Cancelled', data.kpis.cancelled],
                ['Rescheduled', data.kpis.rescheduled],
              ].map(([label, value]) => (
                <article
                  key={String(label)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </article>
              ))}
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">Bookings by service</h2>
                {data.serviceCounts.length ? (
                  <div className="mt-4 space-y-3">
                    {data.serviceCounts.map((item) => (
                      <div
                        key={item.serviceId}
                        className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-800">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No bookings yet.</p>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payment verification queue
                  </h2>
                  <Link href="/bookings" className="text-sm font-semibold text-teal-700">
                    View Bookings
                  </Link>
                </div>
                {data.paymentVerificationQueue.length ? (
                  <div className="mt-4 space-y-3">
                    {data.paymentVerificationQueue.map((item) => (
                      <Link
                        key={item.bookingRef}
                        href={`/bookings/${encodeURIComponent(item.bookingRef)}`}
                        className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.bookingRef}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.patient.name} · {item.service.name}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                             {formatPaymentStatus('SUBMITTED')}
                          </span>
                        </div>
                        {item.payment?.submittedAt ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted {new Date(item.payment.submittedAt).toLocaleString('en-IN')}
                          </p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No payments require verification.</p>
                )}
              </section>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Recent bookings</h2>
              {data.recentBookings.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {data.recentBookings.map((booking) => (
                    <Link
                      key={booking.bookingRef}
                      href={`/bookings/${encodeURIComponent(booking.bookingRef)}`}
                      className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{booking.bookingRef}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {booking.patient.name} · {booking.service.name}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                           {formatBookingStatus(booking.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {booking.appointmentType === 'SCHEDULED' && booking.slot
                          ? `${new Date(booking.slot.date).toLocaleDateString('en-IN')} · ${booking.slot.startTime}`
                           : formatAppointmentType('IMMEDIATE')}{' '}
                        · ₹{booking.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No recent bookings.</p>
              )}
            </section>
          </>
        ) : null}
      </main>
    </AdminAuth>
  );
}

export default function DashboardRoute() {
  return <DashboardPage />;
}
