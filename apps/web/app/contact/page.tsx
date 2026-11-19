export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-[0.2em] text-teal-700">Contact Us</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">Need help or a quick consultation?</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Call</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">+91 98765 43210</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">hello@punecaringhands.in</p>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-500">WhatsApp Support</p>
        <a href="https://wa.me/+918605906083" target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
           Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}
