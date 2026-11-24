'use client';

import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE_BYTES } from '@pch/shared';
import QRCode from 'qrcode';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { getBookingByRef, getPaymentInstructions, submitPaymentProof } from '../../../../lib/api';
import type { BookingRecord, PaymentInstructions } from '../../../../lib/api';

export default function BookingPaymentPage({ params }: { params: { bookingRef: string } }) {
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const paymentAmount = booking?.payment?.amount ?? booking?.totalAmount ?? 0;
  const upiLink = useMemo(() => {
    if (!instructions || !booking) return '';
    const query = new URLSearchParams({
      pa: instructions.upiId,
      pn: instructions.payeeName,
      am: paymentAmount.toFixed(2),
      cu: 'INR',
      tn: booking.bookingRef,
    });
    return `upi://pay?${query.toString()}`;
  }, [booking, instructions, paymentAmount]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [bookingData, paymentInstructions] = await Promise.all([
          getBookingByRef(params.bookingRef),
          getPaymentInstructions(),
        ]);
        if (!cancelled) {
          setBooking(bookingData);
          setInstructions(paymentInstructions);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Could not load payment details.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.bookingRef]);

  useEffect(() => {
    let cancelled = false;
    if (!upiLink) {
      setQrCode('');
      return;
    }
    void QRCode.toDataURL(upiLink, { width: 240, margin: 1 })
      .then((dataUrl) => {
        if (!cancelled) setQrCode(dataUrl);
      })
      .catch(() => {
        if (!cancelled)
          setError('Could not generate the UPI QR code. You can still use the UPI ID below.');
      });
    return () => {
      cancelled = true;
    };
  }, [upiLink]);

  const uploadProof = async () => {
    if (!proof) {
      setError('Select your payment screenshot before submitting.');
      return;
    }
    if (!UPLOAD_ALLOWED_MIME_TYPES.some((type) => type === proof.type)) {
      setError('Upload a JPEG, PNG, or PDF payment screenshot.');
      return;
    }
    if (proof.size > UPLOAD_MAX_FILE_SIZE_BYTES) {
      setError('The payment screenshot must be 5MB or smaller.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await submitPaymentProof(params.bookingRef, proof);
      setBooking((current) =>
        current
          ? {
              ...current,
              status: result.status,
              payment: current.payment
                ? { ...current.payment, status: 'SUBMITTED' }
                : current.payment,
            }
          : current,
      );
      setProof(null);
      setNotice('Payment proof received. Our team will verify it before confirming your booking.');
    } catch (submitError) {
      try {
        const latestBooking = await getBookingByRef(params.bookingRef);
        if (
          latestBooking.status === 'PAYMENT_VERIFICATION' ||
          latestBooking.status === 'CONFIRMED'
        ) {
          setBooking(latestBooking);
          setProof(null);
          setNotice(
            latestBooking.status === 'CONFIRMED'
              ? 'Your payment has been verified and your booking is confirmed.'
              : 'Payment proof received. Our team will verify it before confirming your booking.',
          );
          return;
        }
      } catch {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Payment proof was not submitted. Please retry.',
        );
        return;
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Payment proof was not submitted. Please retry.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshBookingStatus = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      setBooking(await getBookingByRef(params.bookingRef));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : 'Could not refresh booking status.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12" role="status">
        Loading payment details...
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error || 'Booking not found.'}
        </p>
      </div>
    );
  }

  const confirmed = booking.status === 'CONFIRMED' || booking.payment?.status === 'VERIFIED';
  const verificationPending =
    booking.status === 'PAYMENT_VERIFICATION' || booking.payment?.status === 'SUBMITTED';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.18em] text-teal-700">
          Booking {booking.bookingRef}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Payment</h1>
        <p className="mt-2 text-slate-600">{booking.service?.name}</p>
        <p className="mt-5 text-3xl font-bold text-slate-900">
          ₹{paymentAmount.toLocaleString('en-IN')}
        </p>

        {confirmed ? (
          <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <h2 className="font-semibold text-green-900">Confirmed</h2>
            <p className="mt-1 text-sm text-green-800">
              Your payment was verified by our team and your booking is confirmed.
            </p>
          </div>
        ) : verificationPending ? (
          <div role="status" className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="font-semibold text-blue-900">Verification Pending</h2>
            <p className="mt-1 text-sm text-blue-800">
              We received your payment proof. Your booking is not confirmed until our team verifies
              the payment.
            </p>
            <button
              type="button"
              onClick={() => void refreshBookingStatus()}
              disabled={isRefreshing}
              className="mt-3 text-sm font-semibold text-blue-900 underline disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Payment Status'}
            </button>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold text-amber-900">Pending Payment</h2>
              <p className="mt-1 text-sm text-amber-800">
                Pay the amount shown, then upload your payment screenshot. Confirmation happens only
                after admin verification.
              </p>
            </div>
            {booking.payment?.rejectionReason ? (
              <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                Correction requested: {booking.payment.rejectionReason}
              </p>
            ) : null}
            <div className="mt-7 grid gap-6 sm:grid-cols-[240px_1fr] sm:items-center">
              {qrCode ? (
                <Image
                  src={qrCode}
                  alt="UPI payment QR code"
                  width={240}
                  height={240}
                  unoptimized
                  className="h-60 w-60 rounded-xl border p-2"
                />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center rounded-xl border bg-slate-50 text-center text-sm text-slate-500">
                  Loading UPI QR...
                </div>
              )}
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Payee: <strong>{instructions?.payeeName}</strong>
                </p>
                <p>
                  UPI ID: <strong>{instructions?.upiId}</strong>
                </p>
                <p>
                  Amount: <strong>₹{paymentAmount.toLocaleString('en-IN')}</strong>
                </p>
                <p>
                  Reference: <strong>{booking.bookingRef}</strong>
                </p>
              </div>
            </div>
            <label className="mt-8 block space-y-2 text-sm font-medium text-slate-700">
              Payment screenshot (required)
              <input
                type="file"
                accept={UPLOAD_ALLOWED_MIME_TYPES.join(',')}
                onChange={(event) => {
                  setProof(event.target.files?.[0] ?? null);
                  setError('');
                }}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <span className="block text-xs font-normal text-slate-500">
                JPEG, PNG, or PDF. Maximum 5MB.
              </span>
            </label>
            {error ? (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                {notice}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void uploadProof()}
              disabled={isSubmitting}
              className="mt-6 rounded-full bg-navy-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading Proof...' : 'Upload Payment Proof'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
