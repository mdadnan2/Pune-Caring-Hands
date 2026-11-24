import BookingWizard from '../../components/booking-wizard';

export default function BookPage() {
  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-sm font-semibold text-teal-700">Book a Service</p>
        <h1 className="mt-2 break-words text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          Book your healthcare service
        </h1>
      </div>
      <BookingWizard />
    </div>
  );
}
