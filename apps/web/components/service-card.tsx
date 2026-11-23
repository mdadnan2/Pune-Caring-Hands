import Link from 'next/link';
import type { ServiceItem } from '../lib/site-data';

export function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" />
        <p className="ml-auto text-right text-xs font-semibold text-slate-500">
          {service.price.startsWith('₹') ? 'Starting from' : 'Pricing'}
        </p>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
        {service.name}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{service.description}</p>
      <ul className="mt-5 space-y-2 text-sm leading-relaxed text-slate-700">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-1.5 text-sm font-bold text-teal-600">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-2xl font-bold text-navy-800">{service.price}</p>
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-navy-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2"
        >
          Book This Service
        </Link>
      </div>
    </article>
  );
}
