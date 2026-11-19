import { testimonials } from '../../lib/site-data';

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Patient Testimonials</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">Patients share their experience</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <blockquote key={item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">“{item.quote}”</p>
            <footer className="mt-5 text-sm font-semibold text-slate-900">{item.name}</footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
