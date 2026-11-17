import Link from 'next/link';
import { notFound } from 'next/navigation';
import { services } from '../../../lib/site-data';

export default function ServiceDetailsPage({ params }: { params: { slug: string } }) {
  const service = services.find((item) => item.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${service.accent}`}>
          {service.price}
        </div>
        <h1 className="mt-5 text-4xl font-bold text-slate-900">{service.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">{service.description}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">What’s included</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-navy-800 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Fast booking</p>
            <p className="mt-4 text-3xl font-bold">{service.price}</p>
            <p className="mt-2 text-sm text-slate-300">Service pricing and details appear in the booking flow.</p>
            <Link href="/book" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-slate-100">
              Book this service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
