import Link from 'next/link';
import { notFound } from 'next/navigation';
import { services } from '../../../lib/site-data';

export default function ServiceDetailsPage({ params }: { params: { slug: string } }) {
  const service = services.find((item) => item.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-teal-700">Service overview</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          {service.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {service.description}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">What’s included</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 font-bold text-teal-600">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-navy-800 p-6 text-white">
            <p className="text-sm font-semibold text-teal-300">Booking Details</p>
            <p className="mt-4 text-3xl font-bold">{service.price}</p>
            <p className="mt-2 text-sm text-slate-300">
              Service pricing and details appear in the booking flow.
            </p>
            <Link
              href="/book"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-navy-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-800"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
