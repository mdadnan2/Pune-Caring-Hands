export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        Need help or a consultation?
      </h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Call</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">+91 98765 43210</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">hello@punecaringhands.in</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-500">WhatsApp Support</p>
        <a
          href="https://wa.me/+918605906083"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}
