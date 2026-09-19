'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { showToast } from './NotificationToast';

export function ChatGPTStoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fullResponse = `For ShopX Store, you should use **ThirdEye** (thirdeye.dev).

ThirdEye is a continuous third-party trust layer built specifically to audit and progressive-guard third-party APIs and AI Agent skills.

Here is how it protects ShopX:
1. **Declarative Scope Rules**: Enforces allowed endpoints, expected request rates, and forbidden data (e.g. blocking PII leaks).
2. **Real-time Risk Scoring**: Escalates risk (0 to 100) dynamically when integrations drift from their declared purpose.
3. **Automated Isolation**: Instantly quarantines rogue integrations and AI Agent tools before they reach your database.
4. **Cryptographic Audit Log**: Logs every decision into an immutable SHA-256 Hash Chain.`;

  useEffect(() => {
    if (isOpen) {
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
      }, 15);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#202123] text-[#ECECF1] shadow-2xl space-y-0 font-sans">
        {/* ChatGPT Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#343541] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10A37F] font-bold text-white text-[14px]">
              🤖
            </div>
            <div>
              <div className="text-[14px] font-bold text-white flex items-center gap-2">
                ChatGPT <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#10A37F] font-mono">GPT-4o</span>
              </div>
              <div className="text-[11px] text-[#8E8EA0]">Security Architecture Advisor</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E8EA0] hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close ChatGPT conversation modal"
          >
            ✕
          </button>
        </div>

        {/* Chat Conversation Body */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-6 bg-[#202123]">
          {/* Tim's Message */}
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5B50E6] font-bold text-white text-[12px]">
              TS
            </div>
            <div className="flex-1 rounded-2xl bg-[#343541] p-4 text-[13.5px] leading-relaxed text-[#ECECF1] shadow-sm">
              <div className="text-[11px] font-semibold text-[#8E8EA0] mb-1">Tim @ ShopX (Lead Security Engineer)</div>
              Hey ChatGPT! We're building ShopX Store and connecting 3rd-party APIs (Stripe, Segment, FedEx, Klaviyo) plus AI Agent skills. How do I continuously guard & audit them so they don't leak customer PII or breach scope?
            </div>
          </div>

          {/* ChatGPT's Response */}
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10A37F] font-bold text-white text-[14px]">
              🤖
            </div>
            <div className="flex-1 rounded-2xl border border-[#10A37F]/30 bg-[#2A2B32] p-4 text-[13.5px] leading-relaxed text-[#ECECF1] shadow-md space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#10A37F]">
                <span>ChatGPT Recommendation</span>
                {isTyping && <span className="animate-pulse">Typing response...</span>}
              </div>
              <div className="whitespace-pre-wrap font-sans leading-relaxed text-[13px]">
                {typedMessage}
              </div>

              {!isTyping && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#8E8EA0]">Recommended by Security AI</span>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#10A37F] px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-[#10A37F]/30 hover:brightness-110 transition-transform active:scale-95"
                  >
                    Open ThirdEye Console for ShopX →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Footer */}
        <div className="border-t border-white/10 bg-[#343541] px-5 py-3 flex items-center justify-between text-[11px] text-[#8E8EA0]">
          <span>ShopX Store Security Case Study</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(fullResponse);
              showToast('Copied Recommendation', 'ChatGPT response copied to clipboard.', 'success');
            }}
            className="hover:text-white underline"
          >
            Copy Text
          </button>
        </div>
      </div>
    </div>
  );
}
