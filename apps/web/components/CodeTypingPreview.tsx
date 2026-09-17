'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, paths } from '@/components/icons';
import { showToast } from '@/components/NotificationToast';

const CODE_SAMPLES = {
  ts: {
    filename: 'shopx-integration.ts',
    lang: 'TYPESCRIPT / NODE.JS',
    code: `import { ThirdEye } from '@thirdeye/sdk';

// Initialize ShopX integration via ThirdEye Custom Gateway
const thirdeye = new ThirdEye({
  apiKey: 'te_live_98a7b6c5d4e3',
  gatewayUrl: 'https://gateway.thirdeye.sec',
  integrationId: 'analytics_001'
});

// Verify request before passing to ShopX backend
const decision = await thirdeye.verifyRequest({
  endpoint: '/analytics/events',
  method: 'GET',
  dataRequested: ['event_type', 'session_id'],
  requestCount: 95
});

if (decision.action === 'BLOCK') {
  throw new Error('ThirdEye Security Block: Unauthorized scope breach');
}`,
  },
  py: {
    filename: 'shopx_integration.py',
    lang: 'PYTHON 3.11',
    code: `from thirdeye import ThirdEyeClient

# Initialize ShopX integration gateway shield
client = ThirdEyeClient(
    api_key="te_live_98a7b6c5d4e3",
    gateway_url="https://gateway.thirdeye.sec"
)

# Inspect payload for scope violations before processing
result = client.inspect_request(
    integration_id="stripe_pay_001",
    endpoint="/payments",
    payload={"amount": 4900, "currency": "USD"}
)

if result.is_blocked:
    raise SecurityException("ThirdEye Gateway: Forbidden endpoint or data leak detected")`,
  },
  curl: {
    filename: 'gateway-request.sh',
    lang: 'cURL / HTTP GATEWAY',
    code: `# Route third-party requests directly through ThirdEye Custom API Gateway
curl -X POST https://gateway.thirdeye.sec/api/v1/stripe_pay \\
  -H "X-ThirdEye-Project-Key: te_proj_shopx_99a8b7c6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 12500,
    "currency": "USD",
    "order_id": "ord_88f9a2"
  }'

# Response: HTTP 200 OK | X-ThirdEye-Risk-Score: 12 (ALLOWED)`,
  },
};

export function CodeTypingPreview() {
  const [activeTab, setActiveTab] = useState<'ts' | 'py' | 'curl'>('ts');
  const [displayedLength, setDisplayedLength] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const fullCode = CODE_SAMPLES[activeTab].code;

  // Scroll observer to trigger typing animation when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          startTyping();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  const startTyping = () => {
    setDisplayedLength(0);
    setIsTyping(true);
  };

  // Typing effect loop
  useEffect(() => {
    if (!isTyping) return;

    if (displayedLength < fullCode.length) {
      const timeout = setTimeout(() => {
        setDisplayedLength((prev) => prev + Math.floor(Math.random() * 3) + 1);
      }, 16);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayedLength, isTyping, fullCode]);

  // Tab switch handler
  const handleTabChange = (tab: 'ts' | 'py' | 'curl') => {
    setActiveTab(tab);
    setDisplayedLength(0);
    setIsTyping(true);
  };

  const currentSnippet = fullCode.slice(0, displayedLength);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    showToast('Code copied to clipboard', `${CODE_SAMPLES[activeTab].filename} copied.`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="panel relative overflow-hidden rounded-2xl border border-white/15 bg-[#060D1A] shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0A1324] px-4 py-3">
        {/* Language Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTabChange('ts')}
            className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-all ${
              activeTab === 'ts' ? 'bg-[#1677FF] text-white shadow-md' : 'text-[#8494AD] hover:bg-white/5 hover:text-white'
            }`}
          >
            TypeScript / Node
          </button>
          <button
            onClick={() => handleTabChange('py')}
            className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-all ${
              activeTab === 'py' ? 'bg-[#1677FF] text-white shadow-md' : 'text-[#8494AD] hover:bg-white/5 hover:text-white'
            }`}
          >
            Python SDK
          </button>
          <button
            onClick={() => handleTabChange('curl')}
            className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-all ${
              activeTab === 'curl' ? 'bg-[#1677FF] text-white shadow-md' : 'text-[#8494AD] hover:bg-white/5 hover:text-white'
            }`}
          >
            cURL / Gateway
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDisplayedLength(0);
              setIsTyping(true);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-[#8494AD] hover:border-white/20 hover:text-white transition-colors"
            title="Replay typing animation"
          >
            ↺ REPLAY
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#5B9CFF] hover:border-white/20 hover:text-white transition-colors"
          >
            <Icon d={copied ? paths.check : paths.layers} size={12} />
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Viewport */}
      <div className="relative p-5 font-mono text-[12.5px] leading-relaxed overflow-x-auto min-h-[340px]">
        <pre className="text-[#00C8D7]">
          <code>
            {currentSnippet}
            <span className="inline-block h-4 w-2 bg-[#5B9CFF] animate-pulse ml-0.5 align-middle" />
          </code>
        </pre>

        {/* Progress indicator */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10.5px] font-mono text-[#6E7E99]">
          <span className={`h-1.5 w-1.5 rounded-full ${isTyping ? 'bg-[#5B9CFF] animate-ping' : 'bg-[#10B981]'}`} />
          <span>{isTyping ? 'TYPING...' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
}
