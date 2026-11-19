'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../components/AdminAuth';
import { getAdminPatients, type PatientListItem } from '../../lib/api';

const PAGE_SIZE = 20;

function PatientsPage() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
      const result = await getAdminPatients({ search, page, pageSize: PAGE_SIZE }, token);
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (page > Math.max(1, result.totalPages)) setPage(Math.max(1, result.totalPages));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load patients.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminAuth>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">Patient records</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Patients</h1>
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Search by name or mobile
            <input
              type="search"
              value={search}
              maxLength={100}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="Patient name or 10-digit mobile"
            />
          </label>
        </section>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <p className="py-10 text-slate-600">Loading patients...</p>
        ) : items.length ? (
          <>
            <div className="mt-6 grid gap-3 md:hidden">
              {items.map((patient) => (
                <article
                  key={patient.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">{patient.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">{patient.phone}</p>
                    </div>
                    <Link
                      href={`/patients/${encodeURIComponent(patient.id)}`}
                      className="min-h-11 rounded-full border px-4 py-2 text-sm font-semibold text-teal-700"
                    >
                      View
                    </Link>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Bookings</dt>
                      <dd className="font-semibold text-slate-900">{patient.bookingCount}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Last booking</dt>
                      <dd className="font-semibold text-slate-900">
                        {patient.lastBookingAt
                          ? new Date(patient.lastBookingAt).toLocaleDateString('en-IN')
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    {['Patient', 'Mobile', 'Email', 'Address', 'Bookings', 'Last booking', ''].map(
                      (heading) => (
                        <th key={heading} className="px-4 py-3 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{patient.name}</td>
                      <td className="px-4 py-3">{patient.phone}</td>
                      <td className="px-4 py-3">{patient.email ?? '—'}</td>
                      <td className="max-w-xs px-4 py-3">{patient.address}</td>
                      <td className="px-4 py-3">{patient.bookingCount}</td>
                      <td className="px-4 py-3">
                        {patient.lastBookingAt
                          ? new Date(patient.lastBookingAt).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients/${encodeURIComponent(patient.id)}`}
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
                {total} patient{total === 1 ? '' : 's'} · Page {page} of {Math.max(totalPages, 1)}
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="min-h-11 rounded-lg border bg-white px-4 py-2 font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            No patients match this search.
          </p>
        )}
      </main>
    </AdminAuth>
  );
}

export default function AdminPatientsPage() {
  return <PatientsPage />;
}
