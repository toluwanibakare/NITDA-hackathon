'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BootLoader, LiveClock } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { checkEngineHealth } from '@/lib/api';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [engineOnline, setEngineOnline] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const ping = async () => {
      const ok = await checkEngineHealth();
      setEngineOnline(ok);
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  return (
    <>
      <BootLoader done={booted} />
      <div className="bg-grid pointer-events-none fixed inset-0" />

      {/* liquid-glass nav bar — floats edge-to-edge */}
      <header className="sticky top-0 z-40 backdrop-blur-md">
        <div className="liquid-glass mx-auto flex h-[64px] w-full items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.jpeg"
              alt="ThirdEye"
              width={44}
              height={44}
              className="h-10 w-10 object-contain rounded-lg"
              priority
            />
            <span className="leading-none">
              <span className="block text-[18px] font-bold tracking-[-0.02em] text-ink">ThirdEye</span>
              <span className="block text-[9.5px] font-mono tracking-widest text-muted uppercase">Risk Engine</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="liquid-segment hidden mx-auto items-center gap-0.5 rounded-full p-[3px] md:flex">
            {NAV.map((n) => {
              const active = path === n.href || (n.href === '/dashboard' && path === '/');
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                    active
                      ? 'liquid-active text-ink font-semibold shadow-sm'
                      : 'text-muted hover:bg-white/60 hover:text-ink'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <span
              className={`chip hidden !text-[11px] font-semibold lg:inline-flex ${
                engineOnline
                  ? '!border-trust/25 !bg-trust/[0.07] !text-[#0B7A55]'
                  : '!border-[#D9930D]/25 !bg-[#D9930D]/[0.07] !text-[#92600A]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  engineOnline ? 'bg-trust animate-pulseDot' : 'bg-[#D9930D] animate-blink'
                }`}
              />
              {engineOnline ? 'ENGINE NOMINAL' : 'DEMO MODE'}
            </span>
            <LiveClock />

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/80 text-ink shadow-sm md:hidden hover:bg-white"
              aria-label="Toggle Navigation Menu"
            >
              <Icon d={mobileOpen ? paths.cross : paths.grid} size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <div className="border-b border-line bg-white/95 px-5 py-4 shadow-lg backdrop-blur-xl md:hidden animate-rise">
            <nav className="flex flex-col gap-1.5">
              {NAV.map((n) => {
                const active = path === n.href || (n.href === '/dashboard' && path === '/');
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-[14px] font-medium transition-all ${
                      active
                        ? 'bg-brand/10 font-bold text-brand'
                        : 'text-[#5A6B82] hover:bg-[#F1F5F9] hover:text-[#0A1830]'
                    }`}
                  >
                    <span>{n.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
              <span
                className={`chip !text-[11px] font-semibold ${
                  engineOnline
                    ? '!border-trust/25 !bg-trust/[0.07] !text-[#0B7A55]'
                    : '!border-[#D9930D]/25 !bg-[#D9930D]/[0.07] !text-[#92600A]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    engineOnline ? 'bg-trust animate-pulseDot' : 'bg-[#D9930D] animate-blink'
                  }`}
                />
                {engineOnline ? 'ENGINE NOMINAL' : 'DEMO MODE'}
              </span>
            </div>
          </div>
        )}
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

