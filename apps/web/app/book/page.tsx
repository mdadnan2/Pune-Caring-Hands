import BookingWizard from '../../components/booking-wizard';

export default function BookPage() {
  return (
    <div className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="break-words text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          Book your healthcare service
        </h1>
      </div>
      <BookingWizard />
    </div>
  );
}
