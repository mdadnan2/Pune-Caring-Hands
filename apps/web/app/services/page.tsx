import Link from 'next/link';
import { services } from '../../lib/site-data';

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Services</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Care at home, designed around your routine.</h1>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${service.accent}`}>
              {service.price}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{service.name}</h2>
            <p className="mt-3 text-sm text-slate-600">{service.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href={`/services/${service.slug}`} className="mt-6 inline-flex rounded-full bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              Explore service
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
