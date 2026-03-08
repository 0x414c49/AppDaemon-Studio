import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AppDaemon Studio',
  description: 'IDE for AppDaemon apps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
