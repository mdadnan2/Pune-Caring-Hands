export default function BookingConfirmationPage({ params }: { params: { bookingRef: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Booking request received</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Your booking is in progress</h1>
        <p className="mt-4 text-lg text-slate-700">
          Your booking reference is <span className="font-semibold text-slate-900">{params.bookingRef}</span>.
        </p>
        <p className="mt-3 text-slate-600">
          Payment is still required, and the payment proof will be reviewed before the booking is confirmed by our team.
        </p>
      </div>
    </div>
  );
}
