import Link from 'next/link';
import { SectionHeading } from '../components/section-heading';
import { ServiceCard } from '../components/service-card';
import { serviceAreas, services, testimonials } from '../lib/site-data';

export default function HomePage() {
  return (
    <div>
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 pt-4 pb-14 sm:px-6 sm:pt-6 sm:pb-16 lg:grid-cols-2 lg:px-8 lg:pt-8 lg:pb-20">
          <div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Compassionate care brought to your home.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              From doctor visits to diagnostics and medicine delivery, Pune Caring Hands helps you
              arrange healthcare services without leaving home.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center rounded-full bg-navy-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-navy-800"
              >
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
                <p className="text-2xl font-bold text-slate-900">Care</p>
                <p className="text-sm text-slate-500">At home</p>
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
              <p className="text-sm tracking-[0.2em] text-slate-300">Featured Service</p>
              <h2 className="mt-4 text-3xl font-bold">Doctor Home Consultation</h2>
              <p className="mt-3 text-slate-200">
                Immediate or scheduled visits for general care, check-ins, and recovery support.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-bold">₹1,500</span>
                <span className="text-slate-300">starting</span>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Booking options</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Immediate or scheduled</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Coverage</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Across Pune</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <SectionHeading
              eyebrow="Our Services"
              title="Healthcare services designed for everyday life"
              description="Professional healthcare services delivered to your doorstep across Pune."
            />
          </div>
          <Link
            href="/services"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2"
          >
            View All Services
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How It Works" title="A simple flow from booking to care" />
          <div className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              ['01', 'Choose service', 'Select the care you need and share your preferences.'],
              [
                '02',
                'Share details',
                'Add patient information, service details, and preferred time slot.',
              ],
              [
                '03',
                'Review and pay',
                'Submit UPI payment proof and receive confirmation after review.',
              ],
            ].map(([step, title, text], index) => (
              <article
                key={step}
                className="relative border-l-2 border-slate-200 pl-5 md:border-l-0 md:pl-0 md:pr-8"
              >
                {index < 2 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-7 hidden h-px w-8 bg-teal-300 md:left-auto md:right-0 md:block md:w-10"
                  />
                ) : null}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-700 text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <SectionHeading eyebrow="Care Information" title="Clear options for care at home" />
        <div className="mt-10 grid gap-x-8 gap-y-7 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Home healthcare support', 'Explore services that can be arranged for care at home.'],
            ['Clear booking details', 'Review service information and pricing in the booking flow.'],
            ['Care at home', 'Share patient details and preferences for the requested service.'],
            ['Payment verification', 'Upload UPI payment proof for review by our team.'],
          ].map(([title, text]) => (
            <article key={title} className="border-t border-slate-200 pt-5">
              <span aria-hidden="true" className="block h-1.5 w-8 rounded-full bg-teal-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">Patient Testimonials</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                What patients have shared
              </h2>
            </div>
            <Link
              href="/testimonials"
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2"
            >
              View Testimonials
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3 lg:gap-8">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7"
              >
                <p className="text-lg leading-relaxed text-slate-800">“{item.quote}”</p>
                <footer className="mt-auto border-t border-slate-100 pt-5 text-sm font-semibold text-slate-900">
                  <cite className="not-italic">{item.name}</cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Service Areas"
            title="Home healthcare across Pune"
            description="Providing home healthcare services across Pune and nearby communities."
          />
          <div className="mt-8 flex max-w-5xl flex-wrap gap-3">
            {serviceAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
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
              <Link
                href="/book"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-navy-800 hover:bg-slate-100"
              >
                Book a Service
              </Link>
              <a
                href="https://wa.me/+918605906083"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white hover:bg-white/5"
              >
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
            <p className="mt-2 text-sm text-slate-600">
              Choose a service, complete details, and proceed to review and payment.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Where do you serve?</h3>
            <p className="mt-2 text-sm text-slate-600">
              We cover multiple service areas across Pune and nearby communities.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Can I pay digitally?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Yes. The flow includes UPI payment instructions and transaction proof upload.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Need help booking?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use WhatsApp to coordinate with our care team.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
