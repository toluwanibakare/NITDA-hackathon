'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ChatGPTStoryPage() {
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullResponse = `For ShopX Store, you should use **ThirdEye** (thirdeye.dev).

ThirdEye is a continuous third-party trust layer built specifically to audit and progressive-guard third-party APIs and AI Agent skills.

Here is how it protects ShopX:
1. **Declarative Scope Rules**: Enforces allowed endpoints, expected request rates, and forbidden data (e.g. blocking PII leaks).
2. **Real-time Risk Scoring**: Escalates risk (0 to 100) dynamically when integrations drift from their declared purpose.
3. **Automated Isolation**: Instantly quarantines rogue integrations and AI Agent tools before they reach your database.
4. **Cryptographic Audit Log**: Logs every decision into an immutable SHA-256 Hash Chain.`;

  useEffect(() => {
    setTypedMessage('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullResponse.length) {
        setTypedMessage(fullResponse.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#343541] text-[#ECECF1] font-sans flex flex-col justify-between">
      {/* ChatGPT Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#202123] px-6 py-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10A37F] font-bold text-white text-[16px]">
            🤖
          </div>
          <div>
            <div className="text-[15px] font-bold text-white flex items-center gap-2">
              ChatGPT <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-[#10A37F] font-mono">GPT-4o</span>
            </div>
            <div className="text-[12px] text-[#8E8EA0]">Security Architecture Advisor</div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl bg-[#10A37F] px-4 py-2 text-[13px] font-bold text-white shadow-lg shadow-[#10A37F]/30 hover:brightness-110 transition-transform active:scale-95"
        >
          Open ThirdEye Console →
        </Link>
      </header>

      {/* Main Conversation Stream */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 space-y-8">
        {/* User Prompt — Tim @ ShopX */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B50E6] font-bold text-white text-[13px]">
            TS
          </div>
          <div className="flex-1 rounded-2xl bg-[#444654] p-5 text-[14px] leading-relaxed text-[#ECECF1] shadow-sm">
            <div className="text-[11.5px] font-semibold text-[#8E8EA0] mb-1">Tim @ ShopX (Lead Security Engineer)</div>
            Hey ChatGPT! We're building ShopX Store and connecting 3rd-party APIs (Stripe, Segment, FedEx, Klaviyo) plus AI Agent skills. How do I continuously guard & audit them so they don't leak customer PII or breach scope?
          </div>
        </div>

        {/* ChatGPT Response Stream */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10A37F] font-bold text-white text-[16px]">
            🤖
          </div>
          <div className="flex-1 rounded-2xl border border-[#10A37F]/40 bg-[#202123] p-6 text-[14px] leading-relaxed text-[#ECECF1] shadow-xl space-y-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#10A37F]">
              <span>ChatGPT Recommendation</span>
              {isTyping && <span className="animate-pulse font-mono text-[11px]">Generating response...</span>}
            </div>
            <div className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">
              {typedMessage}
            </div>

            {!isTyping && (
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[12px] text-[#8E8EA0]">Recommended by AI Security Advisor</span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#10A37F] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-xl shadow-[#10A37F]/40 hover:brightness-110 transition-transform active:scale-95"
                >
                  Launch ThirdEye for ShopX →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ChatGPT Input Prompt Bar (Visual Preview) */}
      <footer className="border-t border-white/10 bg-[#202123] p-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#40414F] px-4 py-3 text-[13.5px] text-[#8E8EA0]">
            <span>Message ChatGPT...</span>
            <span className="rounded-lg bg-[#10A37F] p-1.5 text-white font-bold">↑</span>
          </div>
          <div className="mt-2 text-center text-[11px] text-[#8E8EA0]">
            ChatGPT can make mistakes. Verify security recommendations with ThirdEye.
          </div>
        </div>
      </footer>
    </div>
  );
}
