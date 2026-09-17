'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BootLoader, LiveClock } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { checkEngineHealth } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/events', label: 'Activity' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [booted, setBooted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [engineOnline, setEngineOnline] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Landing owns its nav and full-bleed layout — no console chrome here.
  if (path === '/') {
    return (
      <>
        <BootLoader done={booted} />
        {children}
      </>
    );
  }

  return (
    <>
      <BootLoader done={booted} />

      {/* Translucent console bar — content scrolls underneath, edge fades instead of a hard rule */}
      <header className="sticky top-0 z-40">
        <div
          className="liquid-glass scroll-edge transition-shadow duration-200"
          style={scrolled ? { boxShadow: '0 12px 32px -20px rgba(0,0,0,0.8)' } : undefined}
        >
          <div className="console-full flex h-[60px] w-full items-center justify-between gap-4">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="ThirdEye overview">
              <Image
                src="/logo.jpeg"
                alt="ThirdEye"
                width={36}
                height={36}
                className="h-9 w-9 object-contain rounded-lg"
                priority
              />
              <span className="leading-none">
                <span className="block text-[16px] font-semibold text-[#F2F6FC]" style={{ letterSpacing: '-0.01em' }}>ThirdEye</span>
                <span className="block text-[11px]" style={{ color: '#6E7E99' }}>Third-party trust</span>
              </span>
            </Link>

            <nav className="liquid-segment hidden mx-auto items-center gap-0.5 rounded-full p-[3px] md:flex" aria-label="Console">
              {NAV.map((n) => {
                const active = path === n.href || (n.href === '/dashboard' && path === '/dashboard');
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className="relative rounded-full px-4 py-1.5 text-[13.5px] font-medium"
                    style={active
                      ? { background: 'rgba(22,119,255,0.16)', color: '#F2F6FC', fontWeight: 600 }
                      : { color: '#93A1B8' }}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2.5">
              <span
                className="chip hidden !text-[11px] lg:inline-flex"
                style={
                  engineOnline
                    ? { borderColor: 'rgba(25,217,138,0.3)', background: 'rgba(25,217,138,0.07)', color: '#19D98A' }
                    : { borderColor: 'rgba(255,196,46,0.3)', background: 'rgba(255,196,46,0.07)', color: '#FFC42E' }
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${engineOnline ? 'bg-[#19D98A] animate-pulseDot' : 'bg-[#FFC42E] animate-blink'}`} />
                {engineOnline ? 'Live' : 'Offline'}
              </span>
              <LiveClock />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border md:hidden"
                style={{ borderColor: 'rgba(245,249,255,0.12)', background: 'rgba(245,249,255,0.05)', color: '#F2F6FC' }}
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                <Icon d={mobileOpen ? paths.cross : paths.grid} size={18} />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="border-t px-5 py-3 md:hidden" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
              <nav className="flex flex-col gap-1" aria-label="Console mobile">
                {NAV.map((n) => {
                  const active = path === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px]"
                      style={active ? { background: 'rgba(22,119,255,0.14)', color: '#fff', fontWeight: 600 } : { color: '#93A1B8' }}
                    >
                      <span>{n.label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#1677FF]" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="console-full relative w-full pb-16 pt-6 md:pt-8">{children}</main>

      <footer className="border-t" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="console-full flex w-full flex-wrap items-center gap-2 py-4 text-[12px]" style={{ color: '#6E7E99' }}>
          <span>ThirdEye · ICSC 2026 · Track G</span>
          <span className="ml-auto">Synthetic demo data · No personal data</span>
        </div>
      </footer>
    </>
  );
}
