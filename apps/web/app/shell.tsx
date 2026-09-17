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

      <div className="min-h-screen bg-[#12131C] text-[#F2F4F8] flex flex-col md:flex-row">
        {/* ═══ LEFT VERTICAL SIDEBAR (Matching Reference Image) ═══ */}
        <aside className="w-full md:w-64 shrink-0 bg-[#161726] border-r border-white/5 flex flex-col justify-between p-5 z-30">
          <div>
            {/* Top Brand Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B50E6] to-[#FF2A6D] text-white shadow-lg shadow-[#5B50E6]/30">
                <Icon d={paths.shield} size={20} />
              </div>
              <span className="text-[18px] font-bold text-white tracking-tight">ThirdEye</span>
            </Link>

            {/* Vertical Navigation Links */}
            <nav className="space-y-1.5" aria-label="Sidebar console navigation">
              {NAV.map((n) => {
                const active = path === n.href || (n.href === '/dashboard' && path === '/dashboard');
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14px] font-medium transition-all ${
                      active
                        ? 'bg-[#5B50E6] text-white font-semibold shadow-lg shadow-[#5B50E6]/40'
                        : 'text-[#8E92A4] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon
                      d={
                        n.href === '/dashboard'
                          ? paths.grid
                          : n.href === '/integrations'
                          ? paths.layers
                          : n.href === '/events'
                          ? paths.activity
                          : n.href === '/simulator'
                          ? paths.zap
                          : paths.lock
                      }
                      size={18}
                    />
                    <span>{n.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls & User Profile */}
          <div className="mt-8 pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={toggleDevMode}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[12px] font-semibold border transition-all ${
                devMode
                  ? 'border-[#5B50E6] bg-[#5B50E6]/20 text-[#8E92A4]'
                  : 'border-white/10 bg-white/5 text-[#8E92A4]'
              }`}
            >
              <span>Dev Mode</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${devMode ? 'bg-[#5B50E6] text-white' : 'bg-white/10 text-white/70'}`}>
                {devMode ? 'ON' : 'OFF'}
              </span>
            </button>

            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#5B50E6] to-[#00CEC9] flex items-center justify-center text-white font-bold text-[13px]">
                SX
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">ShopX Admin</div>
                <div className="text-[11px] text-[#8E92A4] truncate">shopx@thirdeye.sec</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT AREA + TOP HEADER BAR ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 bg-[#161726]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-[24px] font-bold text-white tracking-tight">
              {path === '/dashboard'
                ? 'Dashboard'
                : path === '/integrations'
                ? 'Integrations Marketplace'
                : path === '/events'
                ? 'Security Events Stream'
                : path === '/simulator'
                ? 'Attack Simulator'
                : 'Settings & Gateway Policies'}
            </h1>

            <div className="flex items-center gap-3">
              {/* Top Search Pill matching image */}
              <div className="relative hidden sm:block w-64">
                <input
                  type="text"
                  placeholder="Search APIs or logs…"
                  className="w-full rounded-full border border-white/10 bg-[#1C1D2A] px-4 py-2 pl-9 text-[13px] text-white outline-none placeholder:text-[#8E92A4] focus:border-[#5B50E6]"
                />
                <span className="absolute left-3 top-2.5 text-[#8E92A4]">
                  <Icon d={paths.grid} size={14} />
                </span>
              </div>

              <span className="chip !text-[11px] !border-[#10B981]/30 !bg-[#10B981]/10 !text-[#10B981]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                {engineOnline ? 'Shield Active' : 'Offline'}
              </span>
            </div>
          </header>

          {/* Main Dashboard / Page Viewport */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}

