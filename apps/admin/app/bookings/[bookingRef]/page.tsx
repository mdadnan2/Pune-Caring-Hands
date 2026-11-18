'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../../components/AdminAuth';
import {
  adminApiFetch,
  adminApiFile,
  cancelAdminBooking,
  completeAdminBooking,
  getAvailableSlotsForAdmin,
  rescheduleAdminBooking,
  type AdminAvailableSlot,
  type AdminBookingDetail,
} from '../../../lib/api';

function BookingDetail({ bookingRef }: { bookingRef: string }) {
  const [token, setToken] = useState('');
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [operationalAction, setOperationalAction] = useState<
    'reschedule' | null
  >(null);
  const [availableSlots, setAvailableSlots] = useState<AdminAvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (stored) setToken(stored);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      setBooking(await adminApiFetch<AdminBookingDetail>(`/admin/bookings/${encodeURIComponent(bookingRef)}`, { token }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load booking.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingRef, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const showFile = async (kind: 'proof' | 'prescription') => {
    if (!token) return;
    setError('');
    try {
      const blob = await adminApiFile(
        `/admin/bookings/${encodeURIComponent(bookingRef)}/files/${kind}`,
        token,
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewType(blob.type);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Could not open file.');
    }
  };

  const verify = async () => {
    if (!token || !booking?.payment) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await adminApiFetch(`/admin/payments/${booking.payment.id}/verify`, {
        method: 'PATCH',
        token,
      });
      setNotice('Payment verified. Booking is now confirmed.');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not verify payment.');
    } finally {
      setIsSaving(false);
    }
  };

  const reject = async () => {
    if (!token || !booking?.payment) return;
    if (rejectionReason.trim().length < 5) {
      setError('Enter a correction reason of at least 5 characters.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await adminApiFetch(`/admin/payments/${booking.payment.id}/reject`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      setNotice('Correction requested. The booking remains unconfirmed and is pending payment.');
      setRejectionReason('');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not request correction.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelBooking = async () => {
    if (!token || !booking) return;
    const currentSlot = booking.slot
      ? `${formatAppointmentDate(booking.slot.date)} · ${booking.slot.startTime}–${booking.slot.endTime}`
      : 'Immediate request (no slot)';
    if (
      !window.confirm(
        `Cancel this booking?\n\n${currentSlot}\n\nThis will release the assigned slot and mark the booking as cancelled.`,
      )
    ) {
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await cancelAdminBooking(bookingRef, token);
      setNotice('Booking cancelled and its slot released.');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not cancel booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const completeBooking = async () => {
    if (!token || !booking) return;
    if (!window.confirm('Mark this booking as completed?')) return;

    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await completeAdminBooking(bookingRef, token);
      setNotice('Booking marked as completed.');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not complete booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const openReschedule = async () => {
    if (!token) return;
    setOperationalAction('reschedule');
    setSelectedSlotId('');
    setAvailableSlots([]);
    setIsLoadingSlots(true);
    setError('');
    try {
      setAvailableSlots(await getAvailableSlotsForAdmin(token));
    } catch (slotsError) {
      setError(slotsError instanceof Error ? slotsError.message : 'Could not load available slots.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const confirmReschedule = async () => {
    if (!token || !booking || !selectedSlotId) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await rescheduleAdminBooking(bookingRef, selectedSlotId, token);
      setOperationalAction(null);
      setSelectedSlotId('');
      setNotice('Booking rescheduled successfully.');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not reschedule booking.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="mx-auto max-w-5xl px-5 py-12 text-slate-600">Loading booking...</p>;
  }
  if (!booking) {
    return <main className="mx-auto max-w-5xl px-5 py-12"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error || 'Booking not found.'}</p></main>;
  }

  const awaitingVerification =
    booking.status === 'PAYMENT_VERIFICATION' && booking.payment?.status === 'SUBMITTED';
  const details = Object.entries(booking.serviceDetails).filter(([, value]) => value !== null && value !== '');

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/bookings" className="text-sm font-semibold text-teal-700 hover:underline">← All bookings</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{booking.bookingRef}</h1>
          <p className="mt-1 text-slate-600">{booking.service.name} · {booking.status.replaceAll('_', ' ')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Booking amount</p>
          <p className="text-2xl font-bold text-slate-900">₹{booking.totalAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">{notice}</p> : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Patient</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Name" value={booking.patient.name} />
            <Detail label="Mobile" value={booking.patient.phone} />
            <Detail label="Email" value={booking.patient.email ?? '—'} />
            <Detail label="Date of birth" value={booking.patient.dateOfBirth ? new Date(booking.patient.dateOfBirth).toLocaleDateString('en-IN') : '—'} />
            <Detail label="Address" value={booking.patient.address} />
          </dl>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Appointment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label="Service" value={booking.service.name} />
            <Detail label="Type" value={booking.appointmentType.replaceAll('_', ' ')} />
            <Detail label="Slot" value={booking.slot ? `${new Date(booking.slot.date).toLocaleDateString('en-IN')} · ${booking.slot.startTime}–${booking.slot.endTime}` : 'No slot (immediate request)'} />
            <Detail label="Payment status" value={booking.payment?.status ?? '—'} />
            <Detail label="Amount" value={`₹${(booking.payment?.amount ?? booking.totalAmount).toLocaleString('en-IN')}`} />
          </dl>
          {booking.bookingItems.length ? (
            <div className="mt-5 border-t pt-4">
              <h3 className="font-medium">Selected tests / X-Ray type</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {booking.bookingItems.map((item) => <li key={item.id}>{item.name} — ₹{item.price.toLocaleString('en-IN')}</li>)}
              </ul>
            </div>
          ) : null}
          {details.length ? (
            <div className="mt-5 border-t pt-4">
              <h3 className="font-medium">Service details</h3>
              <dl className="mt-2 space-y-2 text-sm">
                {details.map(([key, value]) => <Detail key={key} label={key.replaceAll(/([A-Z])/g, ' $1')} value={typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)} />)}
              </dl>
            </div>
          ) : null}
          {booking.notes ? <p className="mt-4 border-t pt-4 text-sm"><strong>Notes:</strong> {booking.notes}</p> : null}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Uploaded files</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {booking.payment?.proofAvailable ? (
            <button type="button" onClick={() => void showFile('proof')} className="rounded-full border px-4 py-2 text-sm font-semibold">View payment proof</button>
          ) : <p className="text-sm text-slate-500">No payment proof uploaded.</p>}
          {booking.prescriptionAvailable ? (
            <button type="button" onClick={() => void showFile('prescription')} className="rounded-full border px-4 py-2 text-sm font-semibold">View prescription</button>
          ) : <p className="text-sm text-slate-500">No prescription uploaded.</p>}
        </div>
        {previewUrl ? (
          <div className="mt-5 rounded-xl border bg-slate-50 p-3">
            <a href={previewUrl} download={`${booking.bookingRef}-attachment`} className="text-sm font-semibold text-teal-700 underline">Download attachment</a>
            {previewType.startsWith('image/') ? (
              <img src={previewUrl} alt="Uploaded booking attachment" className="mt-3 max-h-[600px] max-w-full object-contain" />
            ) : previewType === 'application/pdf' ? (
              <iframe title="Uploaded booking attachment" src={previewUrl} className="mt-3 h-[600px] w-full" />
            ) : null}
          </div>
        ) : null}
      </section>

      {booking.payment?.rejectionReason ? (
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Previous correction reason: {booking.payment.rejectionReason}
        </p>
      ) : null}
      {booking.status === 'CONFIRMED' ? (
        <section className="mt-5 rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Booking operations</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void completeBooking()}
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Complete Booking
            </button>
            <button
              type="button"
              disabled={isSaving || isLoadingSlots}
              onClick={() => void openReschedule()}
              className="rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Reschedule
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void cancelBooking()}
              className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Cancel Booking
            </button>
          </div>
          {operationalAction === 'reschedule' ? (
            <div className="mt-5 border-t pt-5">
              <h3 className="font-medium">Choose a new available slot</h3>
              {isLoadingSlots ? (
                <p className="mt-3 text-sm text-slate-600">Loading available slots...</p>
              ) : availableSlots.length ? (
                <label className="mt-3 block max-w-xl text-sm font-medium text-slate-700">
                  Future appointment slots
                  <select
                    value={selectedSlotId}
                    onChange={(event) => setSelectedSlotId(event.target.value)}
                    className="mt-1 w-full rounded-lg border p-2.5"
                  >
                    <option value="">Select a slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatAppointmentDate(slot.date)} · {slot.startTime}–{slot.endTime}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No future available slots.</p>
              )}
              {selectedSlotId
                ? (() => {
                    const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId);
                    if (!selectedSlot) return null;
                    return (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                        <p>
                          <strong>Current:</strong>{' '}
                          {booking.slot
                            ? `${formatAppointmentDate(booking.slot.date)} · ${booking.slot.startTime}–${booking.slot.endTime}`
                            : 'Immediate request (no slot)'}
                        </p>
                        <p className="mt-2">
                          <strong>New:</strong> {formatAppointmentDate(selectedSlot.date)} ·{' '}
                          {selectedSlot.startTime}–{selectedSlot.endTime}
                        </p>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void confirmReschedule()}
                            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {isSaving ? 'Rescheduling...' : 'Confirm Reschedule'}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setOperationalAction(null)}
                            className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                          >
                            Keep Current Slot
                          </button>
                        </div>
                      </div>
                    );
                  })()
                : null}
            </div>
          ) : null}
        </section>
      ) : null}
      {awaitingVerification ? (
        <section className="mt-5 rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Payment review</h2>
          <p className="mt-1 text-sm text-slate-600">Approving confirms the booking. Requesting correction keeps it unconfirmed and records the reason.</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Correction reason (required to reject/request correction)
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border p-3" maxLength={500} />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={isSaving} onClick={() => void verify()} className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Verify payment</button>
            <button type="button" disabled={isSaving} onClick={() => void reject()} className="rounded-full border border-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-800 disabled:opacity-50">Request correction</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function formatAppointmentDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-900">{value}</dd></div>;
}

export default function AdminBookingDetailPage({ params }: { params: { bookingRef: string } }) {
  return <AdminAuth><BookingDetail bookingRef={params.bookingRef} /></AdminAuth>;
}
