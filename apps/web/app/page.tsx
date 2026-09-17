'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CodeTypingPreview } from '@/components/CodeTypingPreview';
import { IntegrationMap } from '@/components/IntegrationMap';
import { Icon, paths } from '@/components/icons';
import { apiSafe, getRiskScore, normaliseIntegration, type IntegrationRow } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

const TIERS = [
  { range: '0–30', tier: 'Trusted', action: 'Allow', color: '#19D98A', desc: 'Matches declared purpose, endpoint scope and method.' },
  { range: '31–60', tier: 'Suspicious', action: 'Allow + monitor', color: '#FFC42E', desc: 'Endpoint or purpose drift. Logged for review.' },
  { range: '61–80', tier: 'High risk', action: 'Rate limit + monitor', color: '#FF9F2E', desc: 'Restricted data or volume anomaly.' },
  { range: '81–100', tier: 'Critical', action: 'Block + quarantine', color: '#FF4D5E', desc: 'Sustained abuse. Isolated until review.' },
];

const NAV_LINKS: [string, string][] = [
  ['#how', 'How it works'],
  ['#architecture', 'Topology'],
  ['#response', 'Response'],
  ['#audit', 'Audit'],
];

export default function LandingPage() {
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [live, setLive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS).then((r) => {
      setItems((r.data.length ? r.data : MOCK_INTEGRATIONS).map(normaliseIntegration));
      setLive(r.live);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const critical = [...items].sort((a, b) => getRiskScore(b) - getRiskScore(a))[0];

  return (
    <div className="min-h-screen bg-[#040B16] font-sans text-[#F2F6FC] antialiased overflow-x-clip">
      {/* ── Nav: glassy layer that stays put while content slides under ── */}
      <header className="sticky top-0 z-50">
        <div
          className="transition-[background,box-shadow,border-color] duration-200"
          style={scrolled
            ? {
                background: 'rgba(4, 11, 22, 0.88)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderBottom: '1px solid rgba(245,249,255,0.09)',
                boxShadow: '0 12px 40px -18px rgba(0,0,0,0.85)',
              }
            : {
                background: 'rgba(4, 11, 22, 0.65)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                borderBottom: '1px solid rgba(245,249,255,0.06)',
                boxShadow: 'none',
              }}
        >
          <div className="console-full flex h-16 items-center gap-3 sm:gap-4">
            <Link href="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3" aria-label="ThirdEye home">
              <Image src="/logo.jpeg" alt="ThirdEye" width={56} height={56} className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain transition-transform duration-150 group-active:scale-95" priority />
              <span className="leading-none">
                <span className="block text-[17px] sm:text-[18px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>ThirdEye</span>
                <span className="mt-0.5 block text-[10px] sm:text-[11px] font-medium" style={{ letterSpacing: '0.06em', color: '#6E7E99' }}>TRACK G · ICSC 2026</span>
              </span>
            </Link>
            <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Product">
              {NAV_LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-150 hover:text-white"
                  style={{ color: '#93A1B8', letterSpacing: '-0.006em' }}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5 lg:ml-0">
              <span className="chip hidden !text-[11px] md:inline-flex" style={{ color: live ? '#19D98A' : '#8B9BB4' }}>
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#19D98A] animate-pulseDot' : 'bg-[#5B6B85]'}`} />
                {live ? 'Live' : 'Demo'}
              </span>
              <Link href="/simulator" className="btn-ghost hidden !px-3.5 !py-2 !text-[13px] sm:inline-flex">Attack demo</Link>
              <Link href="/dashboard" className="btn-accent group !px-3.5 sm:!px-4 !py-2 !text-[13px]">
                Open console
                <span className="transition-transform duration-150 group-hover:translate-x-0.5"><Icon d={paths.arrow} size={14} /></span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border lg:hidden active:scale-95 transition-transform"
                style={{ borderColor: 'rgba(245,249,255,0.14)', background: 'rgba(245,249,255,0.06)', color: '#F2F6FC' }}
                aria-label="Toggle mobile menu"
              >
                <Icon d={mobileNavOpen ? paths.cross : paths.grid} size={18} />
              </button>
            </div>
          </div>

          {/* Landing Mobile Drawer */}
          {mobileNavOpen && (
            <div className="border-t px-4 py-4 lg:hidden animate-rise" style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(4, 11, 22, 0.96)' }}>
              <nav className="flex flex-col gap-2" aria-label="Product mobile">
                {NAV_LINKS.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-[14.5px] font-semibold transition-colors"
                    style={{ background: 'rgba(245,249,255,0.04)', color: '#E6EDF7' }}
                  >
                    <span>{label}</span>
                    <Icon d={paths.arrow} size={13} className="text-[#6E7E99]" />
                  </a>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
                <Link
                  href="/simulator"
                  onClick={() => setMobileNavOpen(false)}
                  className="btn-ghost w-full justify-center !py-2.5 !text-[13.5px]"
                >
                  <Icon d={paths.play} size={14} /> Run attack simulator
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileNavOpen(false)}
                  className="btn-accent w-full justify-center !py-2.5 !text-[13.5px]"
                >
                  Open live console <Icon d={paths.arrow} size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero: eyebrow, display, proof, story visual ── */}
      {/* ── Hero: eyebrow, display, proof, story visual ── */}
      <section className="console-full relative overflow-hidden pb-12 pt-10 md:pb-20 md:pt-[76px]">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-[120px]" style={{ background: 'rgba(22,119,255,0.13)' }} />
        <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] sm:text-[12px] font-semibold" style={{ borderColor: 'rgba(22,119,255,0.35)', background: 'rgba(22,119,255,0.08)', color: '#8FBFFF', letterSpacing: '0.04em' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#5B9CFF] animate-pulseDot" />
              SECURITY FOR THIRD-PARTY INTEGRATIONS
            </p>
            <h1 className="mt-4 sm:mt-5 max-w-[16ch] text-white" style={{ fontSize: 'clamp(1.9rem, 7.5vw, 4.1rem)', lineHeight: 1.05, letterSpacing: '-0.032em', fontWeight: 750 }}>
              Protect <span style={{ color: '#5B9CFF' }}>ShopX</span> from rogue third-party APIs.
            </h1>
            <p className="mt-4 sm:mt-5 max-w-[56ch]" style={{ fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.65, color: '#A9B6CC', letterSpacing: '-0.006em' }}>
              ThirdEye sits between store applications like <strong>ShopX</strong> and partner integrations (Payments, Delivery, Analytics, Marketing). Connect via our Custom API Gateway or <code>@thirdeye/sdk</code> to score every request against declared scope.
            </p>
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/dashboard" className="btn-accent group w-full sm:w-auto justify-center !px-6 !py-3 !text-[14px]" style={{ boxShadow: '0 8px 28px -10px rgba(22,119,255,0.6)' }}>
                Open live console
                <span className="transition-transform duration-150 group-hover:translate-x-0.5"><Icon d={paths.arrow} size={15} /></span>
              </Link>
              <Link href="/integrations" className="btn-ghost group w-full sm:w-auto justify-center !px-6 !py-3 !text-[14px]">
                <Icon d={paths.grid} size={14} /> Connect ShopX integrations
              </Link>
            </div>
            <dl className="mt-8 sm:mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4" style={{ borderColor: 'rgba(245,249,255,0.09)', background: 'rgba(245,249,255,0.09)' }}>
              {[
                ['Custom Gateway', 'Intercept & route'],
                ['@thirdeye/sdk', '3-line integration'],
                ['4 Tiers', 'Graded response'],
                ['SHA-256', 'Tamper-evident log'],
              ].map(([v, l]) => (
                <div key={l} className="px-3.5 py-3 sm:px-5 sm:py-4" style={{ background: '#071426' }}>
                  <dt className="mono-num text-[17px] sm:text-[19px] font-semibold text-white" style={{ letterSpacing: '-0.015em' }}>{v}</dt>
                  <dd className="mt-0.5 text-[11px] sm:text-[12px]" style={{ color: '#8494AD' }}>{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Story visual: product snapshot + live risk overlay */}
          <div className="lg:col-span-5">
            <div className="panel relative overflow-hidden">
              <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840' }} />
                <span className="mono-num ml-2 text-[11px]" style={{ color: '#6E7E99' }}>thirdeye / gateway-flow</span>
                <span className="chip ml-auto !py-0.5 !text-[10px]" style={{ color: '#19D98A' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#19D98A] animate-pulseDot" /> LIVE GATEWAY
                </span>
              </div>
              <Image src="/hero_shield.jpg" alt="ThirdEye monitoring console" width={520} height={380} className="h-auto w-full object-cover" priority />
              {critical && (
                <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 rounded-xl border p-3.5 backdrop-blur-xl" style={{ borderColor: 'rgba(245,249,255,0.12)', background: 'rgba(4,11,22,0.85)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full animate-pulseDot" style={{ background: getRiskScore(critical) >= 81 ? '#FF4D5E' : '#19D98A' }} />
                      <span className="truncate text-[13px] font-semibold text-white">{critical.name}</span>
                    </div>
                    <span className="mono-num shrink-0 text-[13px] font-semibold" style={{ color: getRiskScore(critical) >= 81 ? '#FF8090' : '#19D98A' }}>
                      {getRiskScore(critical)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px]" style={{ color: '#8494AD' }}>
                    {critical.purpose} · {critical.status}
                  </p>
                </div>
              )}
            </div>
            <p className="mono-num mt-3 text-center text-[11.5px]" style={{ color: '#5B6B85' }}>
              ShopX Gateway · 1,420 requests verified today · 0 breach exposures
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works: 3-step ShopX integration flow ── */}
      <section id="how" className="console-full scroll-mt-20 border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="section-label-soft">How it works</p>
            <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>ShopX Integration Journey</h2>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#8494AD' }}>
              ShopX merchants connect partner integrations through our Marketplace or custom SDK. ThirdEye continuously verifies scope and intent on every request.
            </p>
            <Link href="/integrations" className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#5B9CFF]">
              Browse Marketplace connectors <Icon d={paths.arrow} size={14} />
            </Link>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-3 lg:col-span-8" style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(245,249,255,0.08)' }}>
            {[
              ['1. Select Partner', 'Browse Payments, Delivery, Analytics & Marketing in the ThirdEye Marketplace.', 'Marketplace'],
              ['2. Route & Embed', 'Connect via Custom API Gateway or install lightweight @thirdeye/sdk with your API key.', 'SDK / Gateway'],
              ['3. Protect & Grade', 'Score requests 0–100. Allow sales spikes (Black Friday), auto-block data leaks.', 'Graded Defense'],
            ].map(([t, d, badge], i) => (
              <li key={t} className="group px-5 py-5 sm:px-6 sm:py-6 transition-colors duration-150 hover:bg-white/[0.02]" style={{ background: '#071426' }}>
                <div className="flex items-center justify-between">
                  <div className="mono-num text-[12px]" style={{ color: '#5B9CFF' }}>STEP 0{i + 1}</div>
                  <span className="chip !text-[10px]">{badge}</span>
                </div>
                <div className="mt-3 text-[15px] font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: '#8494AD' }}>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── SDK & Developer Code Snippet Section ── */}
      <section className="console-full border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="section-label-soft">Developer Experience</p>
            <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>Zero-friction integration for developers.</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: '#A9B6CC' }}>
              Connect ShopX in 3 lines of code using <code>@thirdeye/sdk</code> or point your HTTP client to ThirdEye Custom API Gateway: <code>https://gateway.thirdeye.sec</code>.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">npm install @thirdeye/sdk</span>
              <span className="chip">pip install thirdeye-sdk</span>
            </div>
          </div>
          <div className="lg:col-span-7">
            <CodeTypingPreview />
          </div>
        </div>
      </section>

      {/* ── Topology ── */}
      <section id="architecture" className="console-full scroll-mt-20 border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-label-soft">Topology</p>
            <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>One map of everything your partners can reach.</h2>
            <p className="mt-2 text-[14.5px] sm:text-[15px] leading-relaxed" style={{ color: '#A9B6CC' }}>Store → ThirdEye → partners. Select a node to open its trust profile.</p>
          </div>
          <Link href="/integrations" className="btn-ghost shrink-0 w-full sm:w-auto justify-center !px-4 !py-2 !text-[13px]">Open registry <Icon d={paths.arrow} size={14} /></Link>
        </div>
        <div className="panel mt-6 sm:mt-7 overflow-hidden">
          <IntegrationMap items={items} />
        </div>
      </section>

      {/* ── Response tiers ── */}
      <section id="response" className="console-full scroll-mt-20 border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="section-label-soft">Graded response</p>
            <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>Never just on or off.</h2>
            <p className="mt-2 text-[14.5px] sm:text-[15px] leading-relaxed" style={{ color: '#A9B6CC' }}>Cutting payments on a false alarm stops real money. Each tier shows its action and why.</p>
            <Link href="/simulator" className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#5B9CFF]">
              Watch it escalate live <Icon d={paths.arrow} size={14} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border lg:col-span-8" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
            {TIERS.map((t, i) => (
              <div key={t.tier} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-x-5 px-5 py-4 sm:px-6 sm:py-5 transition-colors duration-150 hover:bg-white/[0.02]" style={{ background: i % 2 ? 'rgba(245,249,255,0.015)' : 'transparent', borderTop: i ? '1px solid rgba(245,249,255,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <span className="mono-num w-12 text-[12px]" style={{ color: '#6E7E99' }}>{t.range}</span>
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <span className="h-2 w-2 rounded-full" style={{ background: t.color }} /> {t.tier}
                  </span>
                  <span className="text-[13px] font-medium sm:hidden" style={{ color: '#A9B6CC' }}>({t.action})</span>
                </div>
                <span className="hidden text-[13px] font-medium sm:inline-block" style={{ color: '#A9B6CC' }}>{t.action}</span>
                <span className="sm:ml-auto max-w-[38ch] text-[13px]" style={{ color: '#8494AD' }}>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audit + context ── */}
      <section id="audit" className="console-full scroll-mt-20 border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="panel p-6 sm:p-7">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: 'rgba(22,119,255,0.12)', color: '#5B9CFF' }}>
              <Icon d={paths.shield} size={18} />
            </div>
            <h3 className="mt-4 text-[18px] sm:text-[19px] font-semibold text-white" style={{ letterSpacing: '-0.015em' }}>Tamper-evident audit</h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#A9B6CC' }}>Every violation and quarantine is hash-chained. Verify integrity in one click for auditors.</p>
            <div className="mono-num mt-4 rounded-xl border p-3.5 sm:p-4 text-[11.5px] sm:text-[12px] leading-relaxed overflow-x-auto" style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(4,11,22,0.6)', color: '#00C8D7' }}>
              <div>genesis 000000…0000</div>
              <div>latest&nbsp;&nbsp; c5f886…194c6f</div>
              <div style={{ color: '#19D98A' }}>integrity INTACT</div>
            </div>
            <Link href="/events" className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#5B9CFF]">Inspect activity <Icon d={paths.arrow} size={14} /></Link>
          </div>
          <div className="panel p-6 sm:p-7">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: 'rgba(0,200,215,0.1)', color: '#00C8D7' }}>
              <Icon d={paths.clock} size={18} />
            </div>
            <h3 className="mt-4 text-[18px] sm:text-[19px] font-semibold text-white" style={{ letterSpacing: '-0.015em' }}>Context prevents false alarms</h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#A9B6CC' }}>Black Friday traffic is expected. Context relieves 20 points so volume alone never blocks revenue.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Black Friday', 'Campaign launch', 'Known spike'].map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
            <Link href="/settings" className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#5B9CFF]">Configure context <Icon d={paths.arrow} size={14} /></Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="console-full border-t py-12 md:py-14" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="panel flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:p-10 lg:flex-row lg:items-center" style={{ background: 'linear-gradient(180deg, rgba(22,119,255,0.08), rgba(22,119,255,0.02)), #0A172E' }}>
          <div>
            <p className="section-label-soft">Demo in one click</p>
            <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold" style={{ letterSpacing: '-0.02em' }}>See the compromise happen live.</h2>
            <p className="mt-2 text-[14.5px] sm:text-[15px]" style={{ color: '#A9B6CC' }}>Four phases. Watch 8 → 45 → 75 → 95, then quarantine.</p>
          </div>
          <div className="flex shrink-0 flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Link href="/dashboard" className="btn-accent w-full sm:w-auto justify-center !px-6 !py-3 !text-[14px]">Open console</Link>
            <Link href="/simulator" className="btn-ghost w-full sm:w-auto justify-center !px-6 !py-3 !text-[14px]">Run simulator</Link>
          </div>
        </div>
      </section>

      <footer className="console-full border-t py-6" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]" style={{ color: '#6E7E99' }}>
          <span className="flex items-center gap-2">
            <Image src="/logo.jpeg" alt="" width={18} height={18} className="h-[18px] w-[18px] rounded object-cover" />
            ThirdEye · ICSC 2026 · Track G
          </span>
          <span>Synthetic demo data · No personal data</span>
        </div>
      </footer>
    </div>
  );
}
