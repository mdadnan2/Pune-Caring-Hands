'use client';

import { BookingStatus } from '@pch/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../components/AdminAuth';
import {
  adminApiFetch,
  type AdminBookingListItem,
  type AdminService,
} from '../../lib/api';

const statuses = Object.values(BookingStatus);

function BookingList() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<AdminBookingListItem[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [status, setStatus] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (stored) setToken(stored);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (serviceId) params.set('serviceId', serviceId);
    if (date) params.set('date', date);
    try {
      const query = params.toString();
      const [bookings, serviceList] = await Promise.all([
        adminApiFetch<AdminBookingListItem[]>(`/admin/bookings${query ? `?${query}` : ''}`, { token }),
        adminApiFetch<AdminService[]>('/services', { token }),
      ]);
      setItems(bookings);
      setServices(serviceList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [date, serviceId, status, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminAuth>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="mt-1 text-slate-600">Review requests and payment verification.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
            Refresh
          </button>
        </div>
        <section className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5">
              <option value="">All statuses</option>
              {statuses.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Service
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5">
              <option value="">All services</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Appointment date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5" />
          </label>
        </section>
        {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : null}
        {isLoading ? <p className="py-10 text-slate-600">Loading bookings...</p> : !items.length ? (
          <p className="mt-6 rounded-xl border bg-white p-8 text-slate-600">No bookings match these filters.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>{['Booking', 'Patient', 'Service', 'Appointment', 'Amount', 'Payment', 'Status'].map((head) => <th key={head} className="px-4 py-3 font-semibold">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {items.map((booking) => (
                  <tr key={booking.bookingRef} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Link className="font-semibold text-teal-700 hover:underline" href={`/bookings/${encodeURIComponent(booking.bookingRef)}`}>{booking.bookingRef}</Link></td>
                    <td className="px-4 py-3">{booking.patient.name}<br /><span className="text-slate-500">{booking.patient.phone}</span></td>
                    <td className="px-4 py-3">{booking.service.name}</td>
                    <td className="px-4 py-3">{booking.slot ? `${new Date(booking.slot.date).toLocaleDateString('en-IN')} · ${booking.slot.startTime}` : 'Immediate request'}</td>
                    <td className="px-4 py-3">₹{booking.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{booking.payment?.status ?? '—'}</td>
                    <td className="px-4 py-3">{booking.status.replaceAll('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminAuth>
  );
}

export default function AdminBookingsPage() {
  return <BookingList />;
}
