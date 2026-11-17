import { faqs } from '../../lib/site-data';

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">FAQs</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">Frequently asked questions</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((item) => (
          <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{item.question}</h2>
            <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
