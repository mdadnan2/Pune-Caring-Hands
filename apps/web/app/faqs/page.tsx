import { faqs } from '../../lib/site-data';

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        Frequently asked questions
      </h1>
      <div className="mt-6 space-y-3">
        {faqs.map((item) => (
          <div
            key={item.question}
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900">{item.question}</h2>
            <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
