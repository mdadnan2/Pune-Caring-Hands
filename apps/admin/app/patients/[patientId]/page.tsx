'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../../components/AdminAuth';
import {
  getAdminPatient,
  getAdminPatientBookings,
  type PatientBookingHistory,
  type PatientDetail,
} from '../../../lib/api';

const PAGE_SIZE = 20;

function PatientDetailPage({ patientId }: { patientId: string }) {
  const [token, setToken] = useState('');
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [history, setHistory] = useState<PatientBookingHistory | null>(null);
  const [page, setPage] = useState(1);
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
      const [patientResult, historyResult] = await Promise.all([
        getAdminPatient(patientId, token),
        getAdminPatientBookings(patientId, { page, pageSize: PAGE_SIZE }, token),
      ]);
      setPatient(patientResult);
      setHistory(historyResult);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load patient.');
    } finally {
      setIsLoading(false);
    }
  }, [page, patientId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <AdminAuth>
        <p className="mx-auto max-w-5xl px-4 py-12 text-slate-600">Loading patient...</p>
      </AdminAuth>
    );
  }

  return (
    <AdminAuth>
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-5 md:py-8">
        <Link href="/patients" className="text-sm font-semibold text-teal-700 hover:underline">
          ← All patients
        </Link>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {patient ? (
          <>
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
              <p className="mt-1 text-slate-600">
                {patient.bookingCount} booking{patient.bookingCount === 1 ? '' : 's'}
              </p>
            </div>
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Patient information</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ['Mobile', patient.phone],
                  ['Alternate mobile', patient.alternatePhone ?? '—'],
                  ['Email', patient.email ?? '—'],
                  [
                    'Date of birth',
                    patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN')
                      : '—',
                  ],
                  ['Gender', patient.gender ?? '—'],
                  ['PIN code', patient.pinCode ?? '—'],
                  ['Address', patient.address],
                  ['Maps link', patient.mapsLink ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    {label === 'Maps link' && patient.mapsLink ? (
                      <dd className="mt-1 break-all font-medium">
                        <a
                          href={patient.mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 underline"
                        >
                          Open in Maps
                        </a>
                      </dd>
                    ) : (
                      <dd className="mt-1 break-words font-medium text-slate-900">{value}</dd>
                    )}
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Booking history</h2>
              {history?.items.length ? (
                <>
                  <div className="mt-4 grid gap-3 md:hidden">
                    {history.items.map((booking) => (
                      <Link
                        key={booking.bookingRef}
                        href={`/bookings/${encodeURIComponent(booking.bookingRef)}`}
                        className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{booking.bookingRef}</p>
                            <p className="mt-1 text-sm text-slate-600">{booking.service.name}</p>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {booking.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          ₹{booking.totalAmount.toLocaleString('en-IN')} ·{' '}
                          {booking.appointmentType === 'SCHEDULED' && booking.slot
                            ? `${new Date(booking.slot.date).toLocaleDateString('en-IN')} · ${booking.slot.startTime}`
                            : 'Immediate request'}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          {['Booking', 'Service', 'Appointment', 'Amount', 'Status', ''].map(
                            (heading) => (
                              <th key={heading} className="px-4 py-3 font-semibold">
                                {heading}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {history.items.map((booking) => (
                          <tr key={booking.bookingRef} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold">{booking.bookingRef}</td>
                            <td className="px-4 py-3">{booking.service.name}</td>
                            <td className="px-4 py-3">
                              {booking.appointmentType === 'SCHEDULED' && booking.slot
                                ? `${new Date(booking.slot.date).toLocaleDateString('en-IN')} · ${booking.slot.startTime}`
                                : 'Immediate request'}
                            </td>
                            <td className="px-4 py-3">
                              ₹{booking.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">{booking.status.replaceAll('_', ' ')}</td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/bookings/${encodeURIComponent(booking.bookingRef)}`}
                                className="font-semibold text-teal-700 hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <span>
                      Page {page} of {Math.max(history.totalPages, 1)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="min-h-11 rounded-lg border bg-white px-4 py-2 font-medium disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={page >= history.totalPages}
                        onClick={() => setPage((current) => current + 1)}
                        className="min-h-11 rounded-lg border bg-white px-4 py-2 font-medium disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No booking history.
                </p>
              )}
            </section>
          </>
        ) : null}
      </main>
    </AdminAuth>
  );
}

export default function AdminPatientDetailRoute({ params }: { params: { patientId: string } }) {
  return <PatientDetailPage patientId={params.patientId} />;
}
