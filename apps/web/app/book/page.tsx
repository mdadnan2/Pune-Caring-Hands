import BookingWizard from '../../components/booking-wizard';

export default function BookPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Book a Service</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Book your healthcare service</h1>
      </div>
      <BookingWizard />
    </div>
  );
}
