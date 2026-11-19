import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-xl font-semibold text-white">Pune Caring Hands</p>
          <p className="mt-4 text-sm text-slate-300">
            Trusted home healthcare for comfort, safety, and timely support across Pune.
          </p>
        </div>

        <div>
          <p className="font-semibold text-white">Quick Links</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/service-areas">Service Areas</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li><Link href="/faqs">FAQs</Link></li>
            <li><Link href="/testimonials">Patient Testimonials</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>+91 98765 43210</li>
            <li>hello@punecaringhands.in</li>
            <li>Pune, Maharashtra</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-400">
        © 2026 Pune Caring Hands. All rights reserved.
      </div>
    </footer>
  );
}
