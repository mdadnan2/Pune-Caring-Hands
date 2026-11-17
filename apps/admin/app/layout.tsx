import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pune Caring Hands — Admin',
  description: 'Admin panel for Pune Caring Hands.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
