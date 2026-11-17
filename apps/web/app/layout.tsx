import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pune Caring Hands — Home Healthcare Services',
  description: 'Professional home healthcare services in Pune.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
