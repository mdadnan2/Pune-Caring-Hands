'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AdminAuth from '../../components/AdminAuth';
import {
  createAdminSlot,
  deleteAdminSlot,
  getAdminSlots,
  updateAdminSlot,
  type AdminSlot,
} from '../../lib/api';
import {
  currentPuneDate,
  isFuturePuneSlot,
  slotFormSchema,
  type SlotFormValues,
} from '../../features/slots/schemas/slot.schema';
import { formatBookingStatus } from '../../lib/ui-text';

const PAGE_SIZE = 20;

function SlotManagement() {
  const [token, setToken] = useState('');
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    '' | 'available' | 'unavailable'
  >('');
  const [bookingFilter, setBookingFilter] = useState<'' | 'booked' | 'unbooked'>('');
  const [editingSlot, setEditingSlot] = useState<AdminSlot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    mode: 'onBlur',
    defaultValues: {
      date: currentPuneDate(),
      startTime: '',
      endTime: '',
      isAvailable: true,
    },
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (stored) setToken(stored);
  }, []);

  const loadSlots = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await getAdminSlots(
        {
          date: dateFilter || undefined,
          availability: availabilityFilter || undefined,
          bookingStatus: bookingFilter || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
        token,
      );
      setSlots(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load slots.');
    } finally {
      setIsLoading(false);
    }
  }, [availabilityFilter, bookingFilter, dateFilter, page, token]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const openCreateForm = () => {
    setEditingSlot(null);
    form.reset({
      date: currentPuneDate(),
      startTime: '',
      endTime: '',
      isAvailable: true,
    });
    setError('');
    setNotice('');
    setIsFormOpen(true);
  };

  const openEditForm = (slot: AdminSlot) => {
    setEditingSlot(slot);
    form.reset({
      date: slot.date.slice(0, 10),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    });
    setError('');
    setNotice('');
    setIsFormOpen(true);
  };

  const saveSlot = async (values: SlotFormValues) => {
    if (!token) return;
    const scheduleChanged =
      !editingSlot ||
      values.date !== editingSlot.date.slice(0, 10) ||
      values.startTime !== editingSlot.startTime ||
      values.endTime !== editingSlot.endTime;
    if (scheduleChanged && !isFuturePuneSlot(values.date, values.startTime)) {
      form.setError('startTime', {
        type: 'manual',
        message: 'You cannot create or move a slot into the past.',
      });
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingSlot) {
        await updateAdminSlot(editingSlot.id, values, token);
        setNotice('Slot updated successfully.');
      } else {
        await createAdminSlot(
          { date: values.date, startTime: values.startTime, endTime: values.endTime },
          token,
        );
        setNotice('Slot created successfully.');
      }
      setIsFormOpen(false);
      setEditingSlot(null);
      setPage(1);
      await loadSlots();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this slot.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async (slot: AdminSlot) => {
    if (!token) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await updateAdminSlot(slot.id, { isAvailable: !slot.isAvailable }, token);
      setNotice(slot.isAvailable ? 'Slot disabled successfully.' : 'Slot enabled successfully.');
      await loadSlots();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update availability.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeSlot = async (slot: AdminSlot) => {
    if (!token) return;
    const display = `${formatSlotDate(slot.date)} · ${slot.startTime}–${slot.endTime}`;
    if (!window.confirm(`Delete this slot?\n\n${display}\n\nThis action cannot be undone.`)) {
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await deleteAdminSlot(slot.id, token);
      setNotice('Slot deleted successfully.');
      if (slots.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadSlots();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this slot.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminAuth>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Slot Management</h1>
            <p className="mt-1 text-slate-600">Create and manage available appointment time slots.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
             Create Slot
          </button>
        </div>

        {notice ? <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p> : null}
        {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        {isFormOpen ? (
          <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                   {editingSlot ? 'Edit Slot' : 'Create Slot'}
                </h2>
                {editingSlot?.booking ? (
                  <p className="mt-1 text-sm text-amber-800">
                    This slot is booked. Date and time are locked; only availability can be changed.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <form onSubmit={(event) => void form.handleSubmit(saveSlot)(event)} className="mt-5">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Date
                  <input
                    type="date"
                    min={currentPuneDate()}
                    readOnly={Boolean(editingSlot?.booking)}
                    {...form.register('date')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  />
                  {form.formState.errors.date ? <span className="text-xs text-red-600">{form.formState.errors.date.message}</span> : null}
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Start time
                  <input
                    type="time"
                    readOnly={Boolean(editingSlot?.booking)}
                    {...form.register('startTime')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  />
                  {form.formState.errors.startTime ? <span className="text-xs text-red-600">{form.formState.errors.startTime.message}</span> : null}
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  End time
                  <input
                    type="time"
                    readOnly={Boolean(editingSlot?.booking)}
                    {...form.register('endTime')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  />
                  {form.formState.errors.endTime ? <span className="text-xs text-red-600">{form.formState.errors.endTime.message}</span> : null}
                </label>
              </div>
              {editingSlot ? (
                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" {...form.register('isAvailable')} className="h-4 w-4 rounded border-slate-300" />
                  Slot is available
                </label>
              ) : null}
              <button
                type="submit"
                disabled={isSaving}
                className="mt-5 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                 {isSaving ? 'Saving...' : editingSlot ? 'Save Changes' : 'Create Slot'}
              </button>
            </form>
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Date
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Availability
            <select
              value={availabilityFilter}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || value === 'available' || value === 'unavailable') {
                  setAvailabilityFilter(value);
                }
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border p-2.5"
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Disabled</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Booking status
            <select
              value={bookingFilter}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || value === 'booked' || value === 'unbooked') {
                  setBookingFilter(value);
                }
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border p-2.5"
            >
              <option value="">All</option>
              <option value="booked">Booked</option>
              <option value="unbooked">Unbooked</option>
            </select>
          </label>
        </section>

        {isLoading ? (
          <p className="py-10 text-slate-600">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="mt-6 rounded-xl border bg-white p-8 text-slate-600">No slots match these filters.</p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    {['Date', 'Time', 'Availability', 'Booking', 'Actions'].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{formatSlotDate(slot.date)}</td>
                      <td className="px-4 py-3">{slot.startTime} – {slot.endTime}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          slot.booking
                            ? 'bg-blue-100 text-blue-800'
                            : slot.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {slot.booking ? 'Booked' : slot.isAvailable ? 'Available' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {slot.booking ? (
                          <div>
                            <Link className="font-semibold text-teal-700 hover:underline" href={`/bookings/${encodeURIComponent(slot.booking.bookingRef)}`}>
                              {slot.booking.bookingRef}
                            </Link>
                            <p className="mt-0.5 text-xs text-slate-500">
                               {slot.booking.patient.name} · {slot.booking.service.name} · {formatBookingStatus(slot.booking.status)}
                            </p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => openEditForm(slot)}
                            className="font-semibold text-teal-700 hover:underline"
                          >
                            Edit
                          </button>
                          {!slot.booking ? (
                            <>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void toggleAvailability(slot)}
                                className="font-semibold text-slate-700 hover:underline disabled:opacity-50"
                              >
                                {slot.isAvailable ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void removeSlot(slot)}
                                className="font-semibold text-red-700 hover:underline disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <Link className="font-semibold text-slate-700 hover:underline" href={`/bookings/${encodeURIComponent(slot.booking.bookingRef)}`}>
                               View Booking
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>{total} slot{total === 1 ? '' : 's'} · Page {page} of {Math.max(totalPages, 1)}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border bg-white px-3 py-1.5 font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border bg-white px-3 py-1.5 font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </AdminAuth>
  );
}

function formatSlotDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminSlotsPage() {
  return <SlotManagement />;
}
