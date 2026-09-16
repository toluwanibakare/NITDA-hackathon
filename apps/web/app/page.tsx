'use client';
import Image from 'next/image';
import Link from 'next/link';
import { IntegrationMap } from '@/components/IntegrationMap';
import { Icon, paths } from '@/components/icons';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070D18] text-white selection:bg-brand selection:text-white font-sans overflow-x-hidden">
      {/* Background Radial Glow & Ambient Particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-tr from-brand/20 via-purple-600/20 to-cyan-500/10 blur-[130px]" />
        <div className="absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-[70%] -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      {/* ═══ TOP NAVBAR ═══ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070D18]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-purple-600 p-[1px] shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#070D18]">
                <Image src="/logo.jpeg" alt="ThirdEye" width={32} height={32} className="rounded-md object-contain" />
              </div>
            </div>
            <div>
              <span className="block text-[20px] font-extrabold tracking-tight text-white leading-none">ThirdEye</span>
              <span className="block text-[10px] font-mono tracking-widest text-brand uppercase mt-0.5">Risk Engine · Track G</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-[13.5px] font-medium text-slate-300 transition-colors hover:text-white">
              Features
            </a>
            <a href="#graded-response" className="text-[13.5px] font-medium text-slate-300 transition-colors hover:text-white">
              Graded Response
            </a>
            <a href="#architecture" className="text-[13.5px] font-medium text-slate-300 transition-colors hover:text-white">
              Architecture Map
            </a>
            <a href="#audit-trail" className="text-[13.5px] font-medium text-slate-300 transition-colors hover:text-white">
              Tamper-Evident Audit
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/simulator"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-white/10 hover:border-white/25"
            >
              <Icon d={paths.play} size={14} className="text-cyan-400" />
              Attack Demo
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-purple-600 px-5 py-2.5 text-[13.5px] font-bold text-white shadow-lg shadow-brand/30 transition-all hover:scale-[1.02] hover:shadow-brand/40"
            >
              Console Login
              <Icon d={paths.arrow} size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulseDot" />
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Track G · Commerce & Consumer Protection
                </span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]">
                Middleware Solutions Enhancing Privacy for{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-brand to-purple-400 bg-clip-text text-transparent">
                  E-Commerce & Merchants
                </span>
              </h1>

              <p className="max-w-2xl text-[16px] leading-relaxed text-slate-300 md:text-[17.5px]">
                ThirdEye continuously verifies authorized third-party integrations against declared purpose and scope.
                Protects customer data, payment details, and operational APIs from credential compromise, scope drift, and unauthorized exfiltration.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand via-purple-600 to-indigo-600 px-7 py-4 text-[15px] font-bold text-white shadow-xl shadow-brand/25 transition-all hover:scale-[1.02] hover:shadow-brand/40"
                >
                  Launch Live Console
                  <Icon d={paths.arrow} size={16} />
                </Link>
                <Link
                  href="/simulator"
                  className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30"
                >
                  <Icon d={paths.play} size={16} className="text-cyan-400" />
                  Run Attack Simulator
                </Link>
              </div>

              {/* Key Specs Bar */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
                <div>
                  <div className="text-[22px] font-mono font-bold text-white">&lt; 1ms</div>
                  <div className="text-[12px] text-slate-400 font-medium mt-0.5">Latency Overhead</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-cyan-400">100% SHA-256</div>
                  <div className="text-[12px] text-slate-400 font-medium mt-0.5">Tamper-Evident Audit</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-purple-400">4 Tiers</div>
                  <div className="text-[12px] text-slate-400 font-medium mt-0.5">Graded Escalation</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-emerald-400">Zero</div>
                  <div className="text-[12px] text-slate-400 font-medium mt-0.5">False Alarms</div>
                </div>
              </div>
            </div>

            {/* Right Column 3D Shield Hero Image */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[460px] aspect-square rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-3 shadow-2xl backdrop-blur-2xl group">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 via-purple-500/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Image
                  src="/hero_shield.jpg"
                  alt="ThirdEye 3D Shield Security"
                  width={460}
                  height={460}
                  className="h-full w-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Floating Live Badge */}
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-[#070D18]/85 p-4 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[13px] font-bold text-white">Active Engine Sentinel</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">VERIFIED INTEL</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-slate-300">
                    Intercepted 1,420 requests today. 0 breach exposures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LIVE TOPOLOGY ARCHITECTURE SECTION ═══ */}
      <section id="architecture" className="relative py-20 border-t border-white/10 bg-[#0B132B]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-[11.5px] font-mono font-semibold text-cyan-300 uppercase tracking-widest">
              Live Network Architecture
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Continuous Verification Topology Map
            </h2>
            <p className="text-[15.5px] text-slate-300 leading-relaxed">
              ThirdEye sits between store applications and third-party partner integrations. Traffic flows through live verification ports with real-time risk scoring.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
            <IntegrationMap items={MOCK_INTEGRATIONS} />
          </div>
        </div>
      </section>

      {/* ═══ GRADED RESPONSE & FEATURES SECTION ═══ */}
      <section id="graded-response" className="relative py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11.5px] font-mono font-semibold text-purple-300 uppercase tracking-widest">
              Graded Escalation Policy
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Why Binary On/Off Security Fails Retail
            </h2>
            <p className="text-[15.5px] text-slate-300 leading-relaxed">
              Cutting off integrations completely during false alarms halts revenue. ThirdEye grades risk into 4 response tiers so business flows safely.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                range: '0–30',
                tier: 'TRUSTED',
                action: 'ALLOW',
                color: '#0E9F6E',
                bg: 'bg-emerald-500/10 border-emerald-500/30',
                text: 'text-emerald-400',
                desc: 'Request matches declared purpose, endpoint scope, and expected method.',
              },
              {
                range: '31–60',
                tier: 'WATCH',
                action: 'ALLOW + MONITOR',
                color: '#D9930D',
                bg: 'bg-amber-500/10 border-amber-500/30',
                text: 'text-amber-400',
                desc: 'Unusual endpoint or mild purpose drift detected. Logged for audit review.',
              },
              {
                range: '61–80',
                tier: 'HIGH RISK',
                action: 'RATE LIMIT + MONITOR',
                color: '#F59E0B',
                bg: 'bg-orange-500/10 border-orange-500/30',
                text: 'text-orange-400',
                desc: 'Attempted access to restricted data fields or abnormal traffic surge.',
              },
              {
                range: '81–100',
                tier: 'CRITICAL',
                action: 'BLOCK + QUARANTINE',
                color: '#E5484D',
                bg: 'bg-rose-500/10 border-rose-500/30',
                text: 'text-rose-400',
                desc: 'Sustained abuse or unauthorized sensitive payload exfiltration. Isolated immediately.',
              },
            ].map((f) => (
              <div
                key={f.tier}
                className={`rounded-2xl border ${f.bg} p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[11px] font-extrabold uppercase tracking-widest ${f.text}`}>
                    Score {f.range}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full`} style={{ background: f.color }} />
                </div>
                <h3 className="mt-4 text-[20px] font-extrabold text-white">{f.tier}</h3>
                <div className={`mt-1 font-mono text-[12px] font-bold ${f.text}`}>{f.action}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AUDIT & CONTEXT PILLARS SECTION ═══ */}
      <section id="audit-trail" className="relative py-20 border-t border-white/10 bg-[#0B132B]/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Card: Audit Trail */}
            <div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 text-brand">
                  <Icon d={paths.shield} size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white">Cryptographic SHA-256 Audit Chain</h3>
              </div>
              <p className="text-[14.5px] leading-relaxed text-slate-300">
                Every violation, quarantine action, and policy enforcement is recorded into a tamper-evident SHA-256 hash sequence log. Auditors and regulators can verify unbroken chain integrity in one click.
              </p>
              <div className="rounded-2xl border border-white/10 bg-[#070D18] p-4 font-mono text-[12px] text-cyan-300 space-y-2">
                <div>genesisHash: 000000000000000000000000...</div>
                <div>latestHash:  c5f886f4a86b5c3e7d991b1a7...</div>
                <div className="text-emerald-400 font-bold">status: INTEGRITY_VERIFIED_INTACT</div>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-cyan-400 transition-colors"
              >
                Inspect Audit Log Page <Icon d={paths.arrow} size={14} />
              </Link>
            </div>

            {/* Right Card: Business Context Engine */}
            <div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Icon d={paths.clock} size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white">Business Context Anti-False-Alarm</h3>
              </div>
              <p className="text-[14.5px] leading-relaxed text-slate-300">
                Track G explicitly evaluates false-alarm safety: busy sales days like Black Friday trigger high volume. ThirdEye's context engine subtracts risk dynamically so high traffic alone never auto-blocks revenue.
              </p>
              <div className="flex flex-wrap gap-2">
                {['BLACK FRIDAY', 'CAMPAIGN LAUNCH', 'KNOWN SPIKE'].map((tag) => (
                  <span key={tag} className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 font-mono text-[11px] font-bold text-purple-300">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-[14px] font-bold text-purple-400 hover:text-cyan-400 transition-colors"
              >
                Configure Context Engine <Icon d={paths.arrow} size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CALL TO ACTION FOOTER BANNER ═══ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-brand via-purple-700 to-indigo-900 p-10 md:p-16 shadow-2xl text-center">
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Ready to Experience ThirdEye in Action?
              </h2>
              <p className="text-[16.5px] text-slate-200 leading-relaxed">
                Explore the live security dashboard, test credential compromise simulations, or review the tamper-evident audit trail.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-white px-8 py-4 text-[15px] font-extrabold text-[#070D18] shadow-xl hover:bg-slate-100 transition-all hover:scale-[1.03]"
                >
                  Enter Security Console
                </Link>
                <Link
                  href="/simulator"
                  className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-[15px] font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  Run Attack Simulator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#040810] py-8 text-slate-400 font-mono text-[12px]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 lg:px-10">
          <span>THIRDEYE RISK ENGINE · ICSC 2026 · TRACK G</span>
          <span>Synthetic Demo Data · Consumer & Merchant Protection</span>
        </div>
      </footer>
    </div>
  );
}
