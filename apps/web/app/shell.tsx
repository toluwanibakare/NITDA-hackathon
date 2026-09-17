'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BootLoader, LiveClock } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { NotificationToastContainer, showToast } from '@/components/NotificationToast';
import { checkEngineHealth } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/events', label: 'Activity' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/settings', label: 'Settings' },
];

export function useDevMode() {
  const [devMode, setDevModeState] = useState(false);
  useEffect(() => {
    try {
      setDevModeState(localStorage.getItem('te-dev-mode') === 'true');
    } catch { /* SSR */ }
    const onStorage = () => {
      try {
        setDevModeState(localStorage.getItem('te-dev-mode') === 'true');
      } catch { /* SSR */ }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('te-dev-mode-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('te-dev-mode-change', onStorage);
    };
  }, []);
  return devMode;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [booted, setBooted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [engineOnline, setEngineOnline] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    try {
      setDevMode(localStorage.getItem('te-dev-mode') === 'true');
    } catch { /* SSR */ }
  }, []);

  const toggleDevMode = () => {
    const next = !devMode;
    setDevMode(next);
    try {
      localStorage.setItem('te-dev-mode', String(next));
      window.dispatchEvent(new Event('te-dev-mode-change'));
    } catch { /* SSR */ }
    showToast(
      next ? 'Developer Mode Active' : 'Standard Mode Active',
      next
        ? 'cURL inspectors, SDK snippets, raw payloads & API key tools unlocked.'
        : 'Clean executive overview mode active.',
      next ? 'info' : 'success'
    );
  };

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
        <NotificationToastContainer />
        {children}
      </>
    );
  }

  return (
    <>
      <BootLoader done={booted} />
      <NotificationToastContainer />

      {/* Translucent Cloudflare-style Enterprise console bar */}
      <header className="sticky top-0 z-40">
        <div
          className="liquid-glass scroll-edge transition-shadow duration-200"
          style={scrolled ? { boxShadow: '0 12px 32px -20px rgba(0,0,0,0.8)' } : undefined}
        >
          <div className="console-full flex h-[64px] w-full items-center justify-between gap-3">
            {/* Left: Brand + Project Switcher */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="ThirdEye overview">
                <Image
                  src="/logo.jpeg"
                  alt="ThirdEye"
                  width={44}
                  height={44}
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-xl shadow-md"
                  priority
                />
                <span className="leading-none hidden sm:block">
                  <span className="block text-[16px] sm:text-[17px] font-bold text-[#F2F6FC]" style={{ letterSpacing: '-0.015em' }}>ThirdEye</span>
                  <span className="block text-[10px] sm:text-[10.5px] font-medium" style={{ color: '#6E7E99' }}>API Gateway Security</span>
                </span>
              </Link>

              {/* Cloudflare-style Project Switcher */}
              <div className="hidden md:flex items-center gap-2 border-l pl-3 border-white/10">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[12.5px] text-white">
                  <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="font-semibold">ShopX Store</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[10px] text-[#5B9CFF]">PROD</span>
                </div>
              </div>
            </div>

            {/* Center: Main Navigation Flow */}
            <nav className="liquid-segment hidden mx-auto items-center gap-0.5 rounded-full p-[3px] md:flex" aria-label="Console">
              {NAV.map((n) => {
                const active = path === n.href || (n.href === '/dashboard' && path === '/dashboard');
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className="relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-all"
                    style={active
                      ? { background: '#1677FF', color: '#F2F6FC', fontWeight: 650, boxShadow: '0 2px 10px rgba(22,119,255,0.35)' }
                      : { color: '#93A1B8' }}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Quick Command Search + Dev Mode Switch + Live Health */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              {/* Quick Command Search Button */}
              <button
                onClick={() => {
                  showToast('Search Command Palette', 'Press Ctrl+K to quickly search APIs, logs, and gateway policies.', 'info');
                }}
                className="hidden xl:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-[#93A1B8] hover:border-white/20 hover:text-white transition-colors"
              >
                <Icon d={paths.grid} size={14} />
                <span>Search APIs or events…</span>
                <kbd className="rounded border border-white/10 bg-black/40 px-1.5 font-mono text-[10px] text-[#6E7E99]">⌘K</kbd>
              </button>

              {/* Mode Switcher Button (Simplified vs Developer) */}
              <button
                onClick={toggleDevMode}
                className="rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-150 active:scale-95 flex items-center gap-1.5"
                style={
                  devMode
                    ? { borderColor: '#1677FF', background: 'rgba(22,119,255,0.22)', color: '#8FBFFF', boxShadow: '0 0 12px rgba(22,119,255,0.25)' }
                    : { borderColor: 'rgba(245,249,255,0.14)', background: 'rgba(245,249,255,0.04)', color: '#93A1B8' }
                }
                title="Toggle Developer Mode (unlocks SDK snippets, cURL commands, raw payloads)"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${devMode ? 'bg-[#5B9CFF]' : 'bg-[#10B981]'}`} />
                {devMode ? '⚡ Dev Mode: ON' : '👤 Merchant Mode'}
              </button>

              <span
                className="chip hidden !text-[11px] lg:inline-flex"
                style={
                  engineOnline
                    ? { borderColor: 'rgba(25,217,138,0.3)', background: 'rgba(25,217,138,0.07)', color: '#19D98A' }
                    : { borderColor: 'rgba(255,196,46,0.3)', background: 'rgba(255,196,46,0.07)', color: '#FFC42E' }
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${engineOnline ? 'bg-[#19D98A] animate-pulseDot' : 'bg-[#FFC42E] animate-blink'}`} />
                {engineOnline ? 'Gateway 0.8ms' : 'Offline'}
              </span>
              <LiveClock />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border md:hidden active:scale-95 transition-transform"
                style={{ borderColor: 'rgba(245,249,255,0.14)', background: 'rgba(245,249,255,0.06)', color: '#F2F6FC' }}
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                <Icon d={mobileOpen ? paths.cross : paths.grid} size={18} />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="border-t px-4 py-3 md:hidden animate-rise" style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(7,20,38,0.96)' }}>
              <nav className="flex flex-col gap-1.5" aria-label="Console mobile">
                {NAV.map((n) => {
                  const active = path === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex items-center justify-between rounded-xl px-3.5 py-3 text-[14.5px] font-medium transition-colors"
                      style={active ? { background: '#1677FF', color: '#fff', fontWeight: 600 } : { color: '#93A1B8' }}
                    >
                      <span>{n.label}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
                <button
                  onClick={toggleDevMode}
                  className="rounded-full border px-3 py-1.5 text-[11.5px] font-semibold"
                  style={
                    devMode
                      ? { borderColor: '#1677FF', background: 'rgba(22,119,255,0.18)', color: '#8FBFFF' }
                      : { borderColor: 'rgba(245,249,255,0.14)', background: 'rgba(245,249,255,0.04)', color: '#93A1B8' }
                  }
                >
                  {devMode ? '⚡ Dev Mode: ON' : '👤 Merchant Mode'}
                </button>
                <Link href="/simulator" className="btn-accent !px-3.5 !py-2 !text-[12.5px]">
                  <Icon d={paths.play} size={13} /> Attack demo
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="console-full relative w-full pb-16 pt-5 md:pt-8 overflow-x-clip">{children}</main>

      <footer className="border-t" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="console-full flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 text-[12px]" style={{ color: '#6E7E99' }}>
          <span>ThirdEye · ICSC 2026 · Track G</span>
          <span>Synthetic demo data · No personal data</span>
        </div>
      </footer>
    </>
  );
}

