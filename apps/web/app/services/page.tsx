import Link from 'next/link';
import { services } from '../../lib/site-data';

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-teal-700">Our Services</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Healthcare services designed for everyday life
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Professional healthcare services delivered to your doorstep across Pune.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
        {services.map((service) => (
          <article
            key={service.slug}
            className="flex h-full min-h-[380px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
          >
            <h2 className="text-2xl font-semibold leading-tight text-slate-900">{service.name}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{service.description}</p>
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-slate-700">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <p className="text-sm text-slate-500">
                {service.price.startsWith('₹') ? 'Starting from' : 'Pricing'}
              </p>
              <p className="mt-1 text-3xl font-bold text-navy-800">{service.price}</p>
              <Link
                href={`/services/${service.slug}`}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-navy-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2 sm:w-auto"
              >
                Book This Service
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
