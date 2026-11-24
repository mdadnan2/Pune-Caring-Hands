import { serviceAreas } from '../../lib/site-data';

export default function ServiceAreasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-teal-700">Service Areas</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        Home healthcare across Pune
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
        Supporting patients and families across our active Pune service areas.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
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
  );
}
