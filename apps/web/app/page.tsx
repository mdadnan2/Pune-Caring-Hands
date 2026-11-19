import Link from 'next/link';
import { serviceAreas, services, testimonials } from '../lib/site-data';

export default function HomePage() {
  return (
    <main>
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 pt-4 pb-14 sm:px-6 sm:pt-6 sm:pb-16 lg:grid-cols-2 lg:px-8 lg:pt-8 lg:pb-20">
          <div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Compassionate care brought to your home.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              From doctor visits to diagnostics and medicine delivery, Pune Caring Hands makes it easier to access quality care without leaving home.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="inline-flex items-center justify-center rounded-full bg-navy-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-navy-800">
                Book a Service
              </Link>
              <a
                href="https://wa.me/+918605906083"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Contact on WhatsApp
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">1.5k+</p>
                 <p className="text-sm text-slate-500">Patients Served</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">6</p>
                 <p className="text-sm text-slate-500">Core Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Pune</p>
                <p className="text-sm text-slate-500">Coverage</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200 ring-1 ring-slate-200">
            <div className="rounded-2xl bg-navy-800 p-6 text-white">
              <p className="text-sm tracking-[0.2em] text-slate-300">Popular Service</p>
              <h2 className="mt-4 text-3xl font-bold">Doctor Home Consultation</h2>
              <p className="mt-3 text-slate-200">Immediate or scheduled visits for general care, check-ins, and recovery support.</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-bold">₹1,500</span>
                <span className="text-slate-300">starting</span>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fast response</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Same-day slots</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Coverage</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Across Pune</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Our Services</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Healthcare services designed for everyday life</h2>
          </div>
           <Link href="/services" className="hidden text-sm font-semibold text-navy-700 md:inline-flex">
             View All Services
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${service.accent}`}>
                {service.price}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-3 text-sm text-slate-600">{service.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={`/services/${service.slug}`} className="mt-6 inline-flex rounded-full bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
                 View Details
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">How It Works</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">A simple flow from booking to care</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['1', 'Choose service', 'Select the care you need and share your preferences.'],
              ['2', 'Confirm details', 'Add patient information, service details, and preferred time slot.'],
              ['3', 'Pay & verify', 'Submit UPI payment details and receive confirmation after review.'],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Why Choose Us</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Reliable, transparent, and patient-first</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            ['Licensed professionals', 'Medical support from trusted, verified caregivers.'],
            ['Transparent pricing', 'Clear service pricing with no hidden surprise charges.'],
            ['Home-first care', 'Convenient appointments that respect your routine.'],
            ['Quick verification', 'Smooth UPI payment and admin confirmation flow.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Patient Testimonials</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Patients trust our care</h2>
            </div>
             <Link href="/testimonials" className="hidden text-sm font-semibold text-navy-700 md:inline-flex">
                View Testimonials
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-slate-700">“{item.quote}”</p>
                <footer className="mt-5 text-sm font-semibold text-slate-900">{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Service Areas</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Pune coverage</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {serviceAreas.map((area) => (
              <span key={area} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy-800 p-8 text-white md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm tracking-[0.2em] text-teal-300">Need Help Booking?</p>
              <h2 className="mt-2 text-3xl font-bold">Start your care journey today.</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/book" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-navy-800 hover:bg-slate-100">
                Book a Service
              </Link>
              <a href="https://wa.me/+918605906083" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white hover:bg-white/5">
                 Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">How do I book?</h3>
            <p className="mt-2 text-sm text-slate-600">Choose a service, complete details, and proceed to review and payment.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Where do you serve?</h3>
            <p className="mt-2 text-sm text-slate-600">We cover multiple service areas across Pune and nearby communities.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Can I pay digitally?</h3>
            <p className="mt-2 text-sm text-slate-600">Yes. The flow includes UPI payment instructions and transaction proof upload.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Need urgent support?</h3>
            <p className="mt-2 text-sm text-slate-600">Use WhatsApp for quick coordination and immediate assistance.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
