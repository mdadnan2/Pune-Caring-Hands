export default function BookingConfirmationPage({ params }: { params: { bookingRef: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Confirmed</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Booking created successfully</h1>
        <p className="mt-4 text-lg text-slate-700">
          Your booking reference is <span className="font-semibold text-slate-900">{params.bookingRef}</span>.
        </p>
        <p className="mt-3 text-slate-600">Please proceed with payment and upload your UPI transaction proof for verification.</p>
      </div>
    </div>
  );
}
