import { serviceAreas } from '../../lib/site-data';

export default function ServiceAreasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Service Areas</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">Care across Pune</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {serviceAreas.map((area) => (
          <div key={area} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{area}</h2>
            <p className="mt-2 text-sm text-slate-600">Home healthcare support available in this area.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
