import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from './shell';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ThirdEye — Real-Time Risk & Purpose Enforcement Middleware',
  description: 'Continuous trust layer for third-party e-commerce integrations. Track G, ICSC 2026.',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="bg-noise min-h-screen font-sans text-ink antialiased selection:bg-brand selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

