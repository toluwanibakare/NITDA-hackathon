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
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-abyss/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="relative block h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-black">
              <Image src="/logo.jpeg" alt="ThirdEye" fill className="object-cover" priority />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-[-0.01em]">ThirdEye</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Trust layer · G1</span>
            </span>
          </Link>
          <nav className="ml-8 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = path === n.href || (n.href === '/dashboard' && path === '/');
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-lg px-3.5 py-2 text-[13.5px] transition-colors ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {active && <span className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.06]" />}
                  <span className="relative">{n.label}</span>
                  {active && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-aqua" />}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="chip hidden lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-trust animate-pulseDot" />
              ENGINE NOMINAL
            </span>
            <LiveClock />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-white/[0.05] px-4 py-1.5 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] ${path === n.href ? 'bg-white/10 text-ink' : 'text-muted'}`}>{n.label}</Link>
          ))}
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-5 pb-16 pt-6">{children}</main>
      <footer className="border-t border-white/[0.06] py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 font-mono text-[11px] text-faint">
          <span>THIRDEYE · ICSC 2026 · TRACK G</span>
          <span className="ml-auto">Synthetic demo data only · No personal data</span>
        </div>
      </footer>
    </>
  );
}
