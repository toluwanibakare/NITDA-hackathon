'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BootLoader, LiveClock } from '@/components/chrome';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/events', label: 'Events' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <BootLoader done={booted} />
      <div className="bg-grid pointer-events-none fixed inset-0" />

      {/* liquid-glass nav bar — floats edge-to-edge */}
      <header className="sticky top-0 z-40">
        <div className="liquid-glass mx-auto flex h-[64px] w-full items-center gap-4 px-5 md:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.jpeg"
              alt="ThirdEye"
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="leading-none">
              <span className="block text-[18px] font-bold tracking-[-0.02em] text-ink">ThirdEye</span>
            </span>
          </Link>

          <nav className="liquid-segment mx-auto flex items-center gap-0.5 rounded-full p-[3px] md:flex">
            {NAV.map((n) => {
              const active = path === n.href || (n.href === '/dashboard' && path === '/');
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                    active
                      ? 'liquid-active text-ink'
                      : 'text-muted hover:bg-white/60 hover:text-ink'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <span className="chip hidden !border-trust/25 !bg-trust/[0.07] !text-[#0B7A55] lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-trust animate-pulseDot" />
              ENGINE NOMINAL
            </span>
            <LiveClock />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-5 md:px-6 pb-16 pt-6 md:pt-8">{children}</main>

      <footer className="border-t border-line bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 py-5 px-5 font-mono text-[11px] tracking-wide text-faint md:px-6">
          <span className="font-semibold text-muted">THIRDEYE · ICSC 2026 · TRACK G</span>
          <span className="ml-auto">Synthetic demo data only · No personal data</span>
        </div>
      </footer>
    </>
  );
}
