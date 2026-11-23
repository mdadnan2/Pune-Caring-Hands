import { testimonials } from '../../lib/site-data';

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-sm font-semibold text-teal-700">Patient Testimonials</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        Patients share their experience
      </h1>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <blockquote
            key={item.name}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7"
          >
            <p className="text-lg leading-relaxed text-slate-800">“{item.quote}”</p>
            <footer className="mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
              <cite className="not-italic">{item.name}</cite>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
