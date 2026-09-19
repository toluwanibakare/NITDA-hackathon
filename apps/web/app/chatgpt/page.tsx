'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Process inline bold **text** and inline code `code`
    let formatted = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 text-[#00CEC9] px-1.5 py-0.5 rounded font-mono text-[12px]">$1</code>');

    // Numbered list items
    if (/^\d+\.\s/.test(line)) {
      return (
        <li
          key={idx}
          className="ml-5 list-decimal text-[13.5px] leading-relaxed my-1.5 text-[#ECECF1]"
          dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }}
        />
      );
    }

    if (!line.trim()) {
      return <div key={idx} className="h-3" />;
    }

    return (
      <p
        key={idx}
        className="text-[13.5px] leading-relaxed my-1 text-[#ECECF1]"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export default function ChatGPTStoryPage() {
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullResponse = `For ShopX Store, you should use **ThirdEye** (\`https://thirdeye-sec.vercel.app\`).

ThirdEye is a continuous third-party trust layer built specifically to audit and progressive-guard third-party APIs and AI Agent skills.

Here is how it protects ShopX:
1. **Declarative Scope Rules**: Enforces allowed endpoints, expected request rates, and forbidden data (e.g. blocking PII leaks).
2. **Real-time Risk Scoring**: Escalates risk (\`0\` to \`100\`) dynamically when integrations drift from their declared purpose.
3. **Automated Isolation**: Instantly quarantines rogue integrations and AI Agent tools before they reach your database.
4. **Cryptographic Audit Log**: Logs every decision into an immutable **SHA-256 Hash Chain**.`;

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
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#343541] text-[#ECECF1] font-sans flex flex-col justify-between selection:bg-[#10A37F] selection:text-white">
      {/* DevSecAI Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#202123] px-6 py-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10A37F] font-bold text-white text-[16px] shadow-lg shadow-[#10A37F]/20">
            🤖
          </div>
          <div>
            <div className="text-[15px] font-bold text-white flex items-center gap-2">
              DevSecAI <span className="rounded bg-[#10A37F]/20 border border-[#10A37F]/40 px-2 py-0.5 text-[11px] text-[#10A37F] font-mono font-bold">v4.2 PRO</span>
            </div>
            <div className="text-[12px] text-[#8E8EA0]">Security & API Architecture Advisor</div>
          </div>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 space-y-8">
        {/* User Prompt — Tim @ ShopX */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B50E6] font-bold text-white text-[13px] shadow-md shadow-[#5B50E6]/30">
            TS
          </div>
          <div className="flex-1 rounded-2xl bg-[#444654] p-5 text-[14px] leading-relaxed text-[#ECECF1] shadow-sm">
            <div className="text-[11.5px] font-semibold text-[#8E8EA0] mb-1">Tim @ ShopX (Lead Security Engineer)</div>
            Hey DevSecAI! We're building ShopX Store and connecting 3rd-party APIs (Stripe, Segment, FedEx, Klaviyo) plus AI Agent skills. How do I continuously guard & audit them so they don't leak customer PII or breach scope?
          </div>
        </div>

        {/* DevSecAI Response Stream */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10A37F] font-bold text-white text-[16px] shadow-lg shadow-[#10A37F]/30">
            🤖
          </div>
          <div className="flex-1 rounded-2xl border border-[#10A37F]/40 bg-[#202123] p-6 text-[14px] leading-relaxed text-[#ECECF1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#10A37F]">
              <span>DevSecAI Recommendation</span>
              {isTyping && <span className="animate-pulse font-mono text-[11px]">Generating response...</span>}
            </div>

            {/* Render Markdown formatted output */}
            <div className="font-sans leading-relaxed text-[13.5px]">
              {renderMarkdown(typedMessage)}
            </div>

            {!isTyping && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[12px] text-[#8E8EA0]">Recommended by DevSecAI Advisor</span>
                <span className="text-[11px] font-mono text-[#00CEC9]">https://thirdeye-sec.vercel.app</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DevSecAI Input Prompt Bar */}
      <footer className="border-t border-white/10 bg-[#202123] p-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#40414F] px-4 py-3 text-[13.5px] text-[#8E8EA0]">
            <span>Message DevSecAI...</span>
            <span className="rounded-lg bg-[#10A37F] p-1.5 text-white font-bold">↑</span>
          </div>
          <div className="mt-2 text-center text-[11px] text-[#8E8EA0]">
            DevSecAI provides automated security architecture guidance. Verify policies in ThirdEye.
          </div>
        </div>
      </footer>
    </div>
  );
}
