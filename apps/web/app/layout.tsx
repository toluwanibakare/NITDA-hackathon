import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from './shell';

export const metadata: Metadata = {
  title: 'ThirdEye — watches your third parties',
  description: 'Continuous trust layer for third-party integrations. Track G, ICSC 2026.',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-noise min-h-screen font-sans text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
