import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

import '@fontsource/fira-code/400.css';
import '@fontsource/fira-code/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/cascadia-code/400.css';
import '@fontsource/cascadia-code/500.css';

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
