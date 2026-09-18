'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Icon, paths } from '@/components/icons';

interface CodeSnippetProps {
  code: string;
  lang?: string;
  title?: string;
}

function CodeBlock({ code, lang = 'bash', title }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-white/10 bg-[#0B132B]/90 font-mono text-[13px] shadow-2xl backdrop-blur-md">
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="text-[12px] font-medium text-[#8E92A4]">{title}</span>
          <span className="text-[10.5px] uppercase tracking-wider text-white/40">{lang}</span>
        </div>
      )}
      <div className="relative p-4 overflow-x-auto text-[#E6EDF7]">
        <pre>
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11.5px] font-sans font-medium text-[#B8C4D8] transition-all hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Icon d={paths.check} size={13} className="text-[#19D98A]" />
              <span className="text-[#19D98A]">Copied</span>
            </>
          ) : (
            <>
              <Icon d={paths.copy} size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'overview', title: 'Product Overview', icon: paths.shield },
  { id: 'risk-engine', title: 'Risk Engine & Scoring', icon: paths.zap },
  { id: 'agent-skill', title: 'Agent Skill & Coding Agents', icon: paths.sparkles },
  { id: 'sdk-ts', title: 'TypeScript SDK (@the-third-eye/sdk)', icon: paths.code },
  { id: 'sdk-py', title: 'Python SDK (thirdeye-sdk)', icon: paths.layers },
  { id: 'api-reference', title: 'API Specification', icon: paths.database },
  { id: 'security-events', title: 'Tamper-Evident Audit Chain', icon: paths.lock },
  { id: 'platform-setup', title: 'Platform Architecture & Self-Host', icon: paths.cpu },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sdkTab, setSdkTab] = useState<'ts' | 'py'>('ts');
  const [installTab, setInstallTab] = useState<'curl' | 'degit'>('curl');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(s => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [searchQuery]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] text-[#F5F9FF] selection:bg-[#5B50E6]/40 selection:text-white">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071426]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-6 xl:px-8">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="ThirdEye"
                width={40}
                height={40}
                className="h-9 w-9 rounded-xl object-contain transition-transform group-hover:scale-105"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold tracking-tight text-white">ThirdEye</span>
                  <span className="rounded-full border border-[#5B50E6]/30 bg-[#5B50E6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8C7CFF]">
                    DOCS
                  </span>
                </div>
                <span className="block text-[11px] text-[#64748B]">Continuous Trust Layer</span>
              </div>
            </Link>
          </div>

          {/* Quick Badges & Outbound Links */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="https://www.npmjs.com/package/@the-third-eye/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[12px] font-medium text-red-300 transition-colors hover:bg-red-500/20"
            >
              <span className="font-bold text-red-400">npm</span>
              <span>@the-third-eye/sdk</span>
              <span className="text-[10px] text-white/50">v0.1.0</span>
            </a>

            <a
              href="https://pypi.org/project/thirdeye-sdk/0.1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[12px] font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
            >
              <span className="font-bold text-blue-400">PyPI</span>
              <span>thirdeye-sdk</span>
              <span className="text-[10px] text-white/50">v0.1.0</span>
            </a>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-[#5B50E6] hover:border-[#5B50E6]"
            >
              <Icon d={paths.grid} size={14} />
              <span className="hidden md:inline">Open Console</span>
            </Link>

            <a
              href="https://github.com/toluwanibakare/thirdeye"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 transition-colors"
              aria-label="GitHub Repository"
            >
              <Icon d={paths.external} size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="w-full px-4 py-8 sm:px-6 lg:pl-5 lg:pr-8 xl:pl-6 xl:pr-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] lg:gap-10 xl:gap-12">
          {/* Left Navigation Sidebar */}
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto lg:block pr-3">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0E1A33] px-3.5 py-2 pl-9 text-[12.5px] text-white outline-none placeholder:text-[#64748B] focus:border-[#5B50E6]"
                />
                <span className="absolute left-3 top-2.5 text-[#64748B]">
                  <Icon d={paths.grid} size={14} />
                </span>
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-3 mb-2">
              Navigation
            </div>
            <nav className="space-y-1">
              {filteredSections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all ${
                    activeSection === sec.id
                      ? 'bg-[#5B50E6] text-white font-semibold shadow-lg shadow-[#5B50E6]/30'
                      : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon d={sec.icon} size={16} />
                  <span className="truncate">{sec.title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[12px] text-[#94A3B8]">
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                <Icon d={paths.sparkles} size={14} className="text-[#FFC42E]" />
                Coding Agents
              </div>
              <p className="leading-relaxed">
                Add ThirdEye to Claude Code, Antigravity, or Cursor with 1 command.
              </p>
              <button
                onClick={() => scrollTo('agent-skill')}
                className="mt-2.5 block text-[#8C7CFF] font-medium hover:underline text-[11.5px]"
              >
                View Agent Skill Guide →
              </button>
            </div>
          </aside>

          {/* Right Main Content Stream */}
          <main className="min-w-0 max-w-4xl xl:max-w-5xl space-y-16 pb-24">
            {/* Hero / Intro Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0E1A33] via-[#071426] to-[#12233F] p-6 sm:p-8 shadow-2xl">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#19D98A]/30 bg-[#19D98A]/10 px-3 py-1 text-[12px] font-semibold text-[#19D98A] mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#19D98A] animate-pulse" />
                  Continuous Trust Verification
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  ThirdEye Documentation
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#94A3B8] max-w-2xl">
                  ThirdEye continuously verifies that authorized third-party integrations and AI coding agents
                  stay within their intended purpose, approved data scope, and expected volumetric baselines.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => scrollTo('agent-skill')}
                    className="flex items-center gap-2 rounded-xl bg-[#5B50E6] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-[#5B50E6]/40 transition-transform active:scale-95 hover:bg-[#4E43D8]"
                  >
                    <Icon d={paths.sparkles} size={16} />
                    Agent Skill Quickstart
                  </button>
                  <button
                    onClick={() => scrollTo('sdk-ts')}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <Icon d={paths.code} size={16} />
                    Official SDKs
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION 1: OVERVIEW & ARCHITECTURE ── */}
            <section id="overview" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-[#5B50E6]/20 p-2 text-[#8C7CFF]">
                  <Icon d={paths.shield} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    The Core Problem & Architecture
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Why API gateways and static keys fail to protect data
                  </p>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-[#94A3B8]">
                Modern applications rely on external third-party services for payments, analytics, marketing,
                and delivery. Once API keys or OAuth tokens are granted, they are{' '}
                <strong className="text-white">trusted forever</strong>. When an integration credential is
                compromised, an attacker can silently query customer data or exfiltrate private records
                without triggering authentication errors.
              </p>

              {/* Visual Flow Topology */}
              <div className="my-6 rounded-2xl border border-white/10 bg-[#0E1A33]/70 p-6 backdrop-blur-md">
                <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#64748B] mb-4">
                  Request Topology
                </div>
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-4 text-center">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[12px] font-bold text-white">Your Application</div>
                    <div className="text-[11px] text-[#64748B] mt-1">Next.js / FastAPI / Express</div>
                  </div>
                  <div className="flex items-center justify-center text-[#5B50E6]">
                    <span className="hidden sm:inline font-bold">──────▶</span>
                    <span className="sm:hidden font-bold">▼</span>
                  </div>
                  <div className="rounded-xl border border-[#5B50E6] bg-[#5B50E6]/20 p-4 shadow-lg shadow-[#5B50E6]/20">
                    <div className="text-[12px] font-bold text-white">ThirdEye Guard</div>
                    <div className="text-[11px] text-[#8C7CFF] mt-1">Continuous Trust Engine</div>
                  </div>
                  <div className="flex items-center justify-center text-[#19D98A]">
                    <span className="hidden sm:inline font-bold">──────▶</span>
                    <span className="sm:hidden font-bold">▼</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-start-4">
                    <div className="text-[12px] font-bold text-white">Third-Party API</div>
                    <div className="text-[11px] text-[#64748B] mt-1">Stripe, Twilio, SendGrid</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 2: RISK ENGINE & SCORING ── */}
            <section id="risk-engine" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-[#19D98A]/20 p-2 text-[#19D98A]">
                  <Icon d={paths.zap} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Risk Engine & Graded Responses
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Deterministic scoring from 0 to 100 on every outbound request
                  </p>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-[#94A3B8]">
                Every request is evaluated against the integration’s declared{' '}
                <strong className="text-white">Trust Profile</strong>. Violations add risk points up to a hard
                cap of 100:
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#19D98A]/30 bg-[#19D98A]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#19D98A]">0 – 30 TRUSTED</span>
                    <span className="rounded-full bg-[#19D98A]/20 px-2 py-0.5 text-[11px] font-bold text-[#19D98A]">
                      ALLOW
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-[#94A3B8]">
                    Normal behavior matching declared endpoint, method, and permissible payload fields.
                  </p>
                </div>

                <div className="rounded-xl border border-[#FFC42E]/30 bg-[#FFC42E]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#FFC42E]">31 – 60 SUSPICIOUS</span>
                    <span className="rounded-full bg-[#FFC42E]/20 px-2 py-0.5 text-[11px] font-bold text-[#FFC42E]">
                      MONITOR
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-[#94A3B8]">
                    Drift detected (e.g. unknown endpoint or purpose mismatch). Request allowed; audit alert
                    logged.
                  </p>
                </div>

                <div className="rounded-xl border border-[#FF9F2E]/30 bg-[#FF9F2E]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#FF9F2E]">61 – 80 HIGH RISK</span>
                    <span className="rounded-full bg-[#FF9F2E]/20 px-2 py-0.5 text-[11px] font-bold text-[#FF9F2E]">
                      RATE LIMIT
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-[#94A3B8]">
                    Abnormal traffic spike (&gt;3x baseline) or unauthorized data access. Backoff enforced.
                  </p>
                </div>

                <div className="rounded-xl border border-[#FF4D5E]/30 bg-[#FF4D5E]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#FF4D5E]">81 – 100 CRITICAL</span>
                    <span className="rounded-full bg-[#FF4D5E]/20 px-2 py-0.5 text-[11px] font-bold text-[#FF4D5E]">
                      BLOCK + QUARANTINE
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-[#94A3B8]">
                    Forbidden data exfiltration or credential abuse. Immediate rejection and quarantine
                    isolation.
                  </p>
                </div>
              </div>
            </section>

            {/* ── SECTION 3: AGENT SKILL & CODING AGENTS ── */}
            <section id="agent-skill" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-[#5B50E6]/20 p-2 text-[#8C7CFF]">
                  <Icon d={paths.sparkles} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Agent Skill (for Coding Agents)
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Autonomous AI pair programmer runbook for Claude Code, Antigravity, Cursor, and Copilot
                  </p>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-[#94A3B8]">
                ThirdEye includes an open <strong className="text-white">Agent Skill</strong> (
                <code className="text-[#8C7CFF]">skills/thirdeye/SKILL.md</code>) following the emerging
                multi-agent skill standard. When installed, any AI coding agent can autonomously scan your
                codebase, discover external API calls, draft Trust Profiles, inject guards, and run validation
                probes.
              </p>

              {/* Install Switcher */}
              <div className="rounded-2xl border border-white/10 bg-[#0E1A33]/80 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setInstallTab('curl')}
                    className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-all ${
                      installTab === 'curl'
                        ? 'bg-[#5B50E6] text-white'
                        : 'bg-white/5 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    1-Line cURL Installer
                  </button>
                  <button
                    onClick={() => setInstallTab('degit')}
                    className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-all ${
                      installTab === 'degit'
                        ? 'bg-[#5B50E6] text-white'
                        : 'bg-white/5 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    npx degit
                  </button>
                </div>

                {installTab === 'curl' ? (
                  <CodeBlock
                    title="Install directly from GitHub into any repository"
                    lang="bash"
                    code="curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye/main/skills/install.sh | bash"
                  />
                ) : (
                  <CodeBlock
                    title="Pull folder via degit without cloning"
                    lang="bash"
                    code={`# For Antigravity / Gemini CLI / Cursor:\nnpx degit toluwanibakare/thirdeye/skills/thirdeye .agents/skills/thirdeye\n\n# For Claude Code:\nnpx degit toluwanibakare/thirdeye/skills/thirdeye .claude/skills/thirdeye`}
                  />
                )}
              </div>

              {/* Agent Commands Table */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Included Autonomous CLI Tools</h3>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0E1A33]/50">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-[#64748B]">
                      <tr>
                        <th className="p-3.5">Script</th>
                        <th className="p-3.5">Purpose</th>
                        <th className="p-3.5">How the Agent Uses It</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[#B8C4D8]">
                      <tr>
                        <td className="p-3.5 font-mono text-[#8C7CFF]">audit_codebase.py</td>
                        <td className="p-3.5">Codebase scanner</td>
                        <td className="p-3.5">
                          Discovers outbound HTTP calls, endpoints, and sensitive fields (PII).
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-mono text-[#8C7CFF]">register_integration.py</td>
                        <td className="p-3.5">Trust Profile registration</td>
                        <td className="p-3.5">Registers generated policies against the ThirdEye API.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-mono text-[#8C7CFF]">test_guard_probe.py</td>
                        <td className="p-3.5">Golden verification probes</td>
                        <td className="p-3.5">
                          Runs deterministic ALLOW (≤30), MONITOR (45), and BLOCK (95) test probes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Plain English Prompts */}
              <div className="rounded-2xl border border-white/10 bg-[#0E1A33]/70 p-5 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Icon d={paths.sparkles} size={16} className="text-[#FFC42E]" />
                  What to say to your coding agent:
                </h3>
                <ul className="space-y-2 text-[13.5px] text-[#94A3B8]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#5B50E6] font-bold">1.</span>
                    <span>
                      &ldquo;Audit this project with ThirdEye to find all external API calls and sensitive
                      parameters.&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#5B50E6] font-bold">2.</span>
                    <span>&ldquo;Draft a Trust Profile for Stripe and SendGrid and register it.&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#5B50E6] font-bold">3.</span>
                    <span>
                      &ldquo;Guard our checkout payment endpoints with{' '}
                      <code className="text-white">@the-third-eye/sdk</code>.&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#5B50E6] font-bold">4.</span>
                    <span>
                      &ldquo;Guard our LangChain / OpenAI tool calls so the AI agent cannot leak PII.&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#5B50E6] font-bold">5.</span>
                    <span>&ldquo;Run the ThirdEye golden probes to verify our protection.&rdquo;</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* ── SECTION 4: TYPESCRIPT SDK ── */}
            <section id="sdk-ts" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-red-500/20 p-2 text-red-400">
                  <Icon d={paths.code} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">TypeScript SDK</h2>
                  <p className="text-[13px] text-[#64748B]">Official package: @the-third-eye/sdk on npm</p>
                </div>
              </div>

              <CodeBlock title="Installation" lang="bash" code="npm install @the-third-eye/sdk" />

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Next.js App Router & Server Actions Example
                </h3>
                <CodeBlock
                  title="Guard outbound vendor call in Next.js"
                  lang="ts"
                  code={`import { ThirdEyeClient, ThirdEyeBlockedError } from '@the-third-eye/sdk';

const te = new ThirdEyeClient({ baseUrl: process.env.THIRDEYE_API_URL });

export async function processStripePayment(orderId: string, amount: number) {
  // 1. Check trust scoring before calling outbound API
  try {
    await te.checkOrBlock({
      integrationId: 'stripe_001',
      method: 'POST',
      endpoint: '/payments',
      dataRequested: ['order_id', 'amount'],
      requestCount: 1,
    });
  } catch (err) {
    if (err instanceof ThirdEyeBlockedError) {
      console.error(\`[ThirdEye BLOCK] \${err.message} (Score: \${err.result.riskScore})\`);
      throw new Error('Payment rejected by ThirdEye trust security policy');
    }
    throw err;
  }

  // 2. Outbound call proceeds only if permitted
  const res = await fetch('https://api.stripe.com/v1/payments', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount }),
  });
  return res.json();
}`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Fetch Wrapper Pattern (wrapOutbound)</h3>
                <CodeBlock
                  title="Automatically wraps fetch and throws on BLOCK"
                  lang="ts"
                  code={`import { ThirdEyeClient, wrapOutbound } from '@the-third-eye/sdk';

const te = new ThirdEyeClient();

const safeFetch = wrapOutbound(
  te,
  { integrationId: 'analytics_001', endpoint: '/analytics/events' },
  fetch
);

// safeFetch scores call, records request, and halts execution if BLOCKED
const { result, data } = await safeFetch('https://api.mixpanel.com/track', {
  method: 'POST',
  body: JSON.stringify({ event: 'page_view', timestamp: Date.now() }),
});`}
                />
              </div>
            </section>

            {/* ── SECTION 5: PYTHON SDK ── */}
            <section id="sdk-py" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-blue-500/20 p-2 text-blue-400">
                  <Icon d={paths.layers} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Python SDK</h2>
                  <p className="text-[13px] text-[#64748B]">
                    Official package: thirdeye-sdk on PyPI (stdlib-only)
                  </p>
                </div>
              </div>

              <CodeBlock title="Installation" lang="bash" code="pip install thirdeye-sdk" />

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Decorator Pattern (@guard)</h3>
                <CodeBlock
                  title="Guard Python functions"
                  lang="python"
                  code={`from thirdeye import ThirdEyeClient, guard, ThirdEyeBlockedError

te = ThirdEyeClient()  # Reads THIRDEYE_API_URL (default: http://localhost:4000)

@guard("stripe_001", "/payments", client=te)
def charge_customer(order_id: str, amount: float):
    import requests
    return requests.post(
        "https://api.stripe.com/payments",
        json={"order_id": order_id, "amount": amount},
        timeout=10
    ).json()

# Execute: automatically blocked if suspicious or exfiltrating data
try:
    res = charge_customer("ord_99", 120.00, thirdeye_data=["order_id", "amount"])
except ThirdEyeBlockedError as e:
    print(f"Call blocked by ThirdEye: {e} (Risk: {e.result.get('riskScore')})")`}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">AI Agent Tool Calling Guard</h3>
                <CodeBlock
                  title="Protect LangChain / OpenAI LLM tool calling"
                  lang="python"
                  code={`from thirdeye import ThirdEyeClient, ThirdEyeBlockedError

te = ThirdEyeClient()

def execute_agent_tool(tool_name: str, arguments: dict):
    """Safely execute an LLM agent tool call through ThirdEye."""
    tool_map = {
        "send_customer_email": ("marketing_001", "/campaigns/send"),
        "refund_payment": ("payment_001", "/payments/refund"),
    }

    if tool_name in tool_map:
        integration_id, endpoint = tool_map[tool_name]
        try:
            te.check_or_block({
                "integrationId": integration_id,
                "method": "POST",
                "endpoint": endpoint,
                "dataRequested": list(arguments.keys()),
                "requestCount": 1,
            })
        except ThirdEyeBlockedError as e:
            return {
                "error": f"Tool execution BLOCKED by ThirdEye: {e}",
                "riskScore": e.result.get("riskScore"),
            }

    return run_tool(tool_name, arguments)`}
                />
              </div>
            </section>

            {/* ── SECTION 6: API REFERENCE ── */}
            <section id="api-reference" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-[#00CEC9]/20 p-2 text-[#00CEC9]">
                  <Icon d={paths.database} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">API Specification</h2>
                  <p className="text-[13px] text-[#64748B]">
                    Core HTTP endpoints exposed by the Express API engine
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-[#0E1A33]/70 p-5">
                  <div className="flex items-center gap-2 font-mono text-[14px]">
                    <span className="rounded bg-[#5B50E6] px-2 py-0.5 text-xs font-bold text-white">
                      POST
                    </span>
                    <span className="text-white font-bold">/api/check-request</span>
                  </div>
                  <p className="mt-2 text-[13px] text-[#94A3B8]">
                    Evaluates an outbound call against the integration&apos;s Trust Profile and returns the
                    risk score and action.
                  </p>

                  <CodeBlock
                    title="Request Payload (CheckRequest)"
                    lang="json"
                    code={`{
  "integrationId": "analytics_001",
  "method": "GET",
  "endpoint": "/customers/payment-details",
  "dataRequested": ["payment", "phone"],
  "requestCount": 1780,
  "timestamp": "2026-09-18T04:00:00Z",
  "contextEvent": "none"
}`}
                  />

                  <CodeBlock
                    title="Response (CheckResult)"
                    lang="json"
                    code={`{
  "riskScore": 95,
  "level": "CRITICAL",
  "action": "BLOCK",
  "violations": [
    { "code": "FORBIDDEN_DATA", "detail": ["payment", "phone"], "points": 30 },
    { "code": "ABNORMAL_VOLUME", "points": 20 }
  ],
  "reason": "Forbidden data accessed and volume 17.8x above baseline"
}`}
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E1A33]/70 p-5">
                  <div className="flex items-center gap-2 font-mono text-[14px]">
                    <span className="rounded bg-[#19D98A]/30 px-2 py-0.5 text-xs font-bold text-[#19D98A]">
                      POST
                    </span>
                    <span className="text-white font-bold">/api/integrations</span>
                  </div>
                  <p className="mt-2 text-[13px] text-[#94A3B8]">
                    Registers or updates a Trust Profile with approved endpoints, verbs, and forbidden
                    sensitive fields.
                  </p>

                  <CodeBlock
                    title="Trust Profile Schema"
                    lang="json"
                    code={`{
  "id": "stripe_001",
  "name": "Stripe Payments",
  "purpose": "Process checkout payments",
  "allowedEndpoints": ["/payments", "/payments/status"],
  "allowedMethods": ["GET", "POST"],
  "allowedData": ["order_id", "amount", "currency"],
  "forbiddenData": ["password", "ssn", "phone"],
  "expectedRequestRate": 120
}`}
                  />
                </div>
              </div>
            </section>

            {/* ── SECTION 7: TAMPER-EVIDENT AUDIT CHAIN ── */}
            <section id="security-events" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-[#FF9F2E]/20 p-2 text-[#FF9F2E]">
                  <Icon d={paths.lock} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Tamper-Evident Audit Chain</h2>
                  <p className="text-[13px] text-[#64748B]">
                    Cryptographic SHA-256 hash chaining on all security events
                  </p>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-[#94A3B8]">
                Every violation, quarantine trigger, or risk escalation produces a cryptographic security
                event linked to the previous event:
              </p>

              <CodeBlock
                title="Cryptographic Hash Chaining Formula"
                lang="text"
                code={`hash = SHA256(prevHash + ":" + integrationId + ":" + riskScore + ":" + timestamp + ":" + reason)`}
              />

              <p className="text-[13.5px] text-[#94A3B8]">
                You can verify the entire immutable chain anytime via{' '}
                <code className="text-white">GET /api/security-events/verify</code>:
              </p>

              <CodeBlock
                title="Verification Response"
                lang="json"
                code={`{
  "verified": true,
  "integrity": "INTACT",
  "totalEvents": 42,
  "lastHash": "7f9a8b1c4d2e5f6a...",
  "chainValid": true
}`}
              />
            </section>

            {/* ── SECTION 8: PLATFORM SETUP & DEPLOYMENT ── */}
            <section id="platform-setup" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <Icon d={paths.cpu} size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Platform Setup & Deployment
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    How to run the full ThirdEye stack locally or in the cloud
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[14px] text-[#94A3B8]">
                <div className="rounded-xl border border-white/10 bg-[#0E1A33]/70 p-5">
                  <h3 className="font-bold text-white text-base mb-2">1. Clone & Install Dependencies</h3>
                  <CodeBlock
                    lang="bash"
                    code={`git clone https://github.com/toluwanibakare/thirdeye.git\ncd thirdeye\nnpm install`}
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E1A33]/70 p-5">
                  <h3 className="font-bold text-white text-base mb-2">2. Supabase Setup</h3>
                  <p className="mb-2">In your Supabase SQL Editor, run:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[13px] text-[#B8C4D8]">
                    <li>
                      Execute <code className="text-white">supabase/migrations.sql</code> to create tables,
                      RLS, and realtime publications.
                    </li>
                    <li>
                      Execute <code className="text-white">supabase/seed.sql</code> to seed the 4 initial
                      integrations.
                    </li>
                    <li>
                      Enable Realtime for{' '}
                      <code className="text-white">integrations, requests, security_events</code>.
                    </li>
                  </ol>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0E1A33]/70 p-5">
                  <h3 className="font-bold text-white text-base mb-2">3. Start Services</h3>
                  <CodeBlock
                    lang="bash"
                    code={`# Run both Express API (:4000) and Next.js Web (:3000):\nnpm run dev:all`}
                  />
                  <p className="text-[12.5px] mt-2">
                    Verify health: <code className="text-[#19D98A]">curl http://localhost:4000/healthz</code>{' '}
                    → <code className="text-white">{`{"ok": true}`}</code>
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
