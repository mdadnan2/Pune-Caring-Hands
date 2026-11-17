import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/service-areas', label: 'Service Areas' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-lg font-bold text-white">
            P
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Pune Caring Hands</p>
            <p className="text-xs text-slate-500">Home healthcare</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-navy-700">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:inline-flex"
          >
            WhatsApp
          </a>
          <Link
            href="/book"
            className="inline-flex items-center justify-center rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
          >
            Book now
          </Link>
        </div>
      </div>
    </header>
  );
}
