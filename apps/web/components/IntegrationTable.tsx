'use client';
import Link from 'next/link';
import { getCurrentRate, getRiskScore, riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';
import { RiskBadge, StatusDot } from './RiskBadge';
import { EmptyState } from './chrome';
import { timeAgo } from '@/lib/mock';

export function IntegrationTable({
  items,
  quarantining = null,
  onQuarantine,
  onRelease,
  compact = false,
}: {
  items: IntegrationRow[];
  quarantining?: string | null;
  onQuarantine?: (id: string) => void;
  onRelease?: (id: string) => void;
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="No integrations found"
        body="No third-party integrations are registered yet. Connect one from the marketplace."
      />
    );
  }

  const rows = compact ? items.slice(0, 5) : items;

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr className="data-table__head">
            <th className="data-table__cell font-semibold">Integration</th>
            <th className="data-table__cell font-semibold hidden lg:table-cell">Purpose</th>
            <th className="data-table__cell font-semibold text-right">Req/min</th>
            <th className="data-table__cell font-semibold">Risk</th>
            <th className="data-table__cell font-semibold">Status</th>
            <th className="data-table__cell font-semibold hidden md:table-cell">Last activity</th>
            <th className="data-table__cell font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="data-table__divider divide-y">
          {rows.map(it => {
            const score = getRiskScore(it);
            const rate = getCurrentRate(it);
            const c = riskColor(score);
            const isQ = it.status === 'QUARANTINED';
            const busy = quarantining === it.id;
            return (
              <tr key={it.id} className="data-table__row">
                <td className="data-table__cell">
                  <Link href={`/integrations/${it.id}`} className="group block min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-[#F5F9FF] group-hover:text-[#5B9CFF]">
                      {it.name}
                    </div>
                    <div className="mono-num truncate text-[11px] text-[#64748B]">{it.id}</div>
                    <div className="mt-1 lg:hidden truncate text-[12px] text-[#94A3B8]">{it.purpose}</div>
                  </Link>
                </td>
                <td className="data-table__cell hidden lg:table-cell max-w-[220px]">
                  <span className="line-clamp-2 text-[12.5px] text-[#94A3B8]">{it.purpose}</span>
                </td>
                <td className="data-table__cell text-right">
                  <span className="mono-num text-[13px] font-bold tabular-nums text-[#F5F9FF]">{rate}</span>
                  <span className="mono-num text-[11px] text-[#64748B]">/min</span>
                  {rate > 500 && (
                    <span
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full animate-pulseDot align-middle"
                      style={{ background: c }}
                    />
                  )}
                </td>
                <td className="data-table__cell">
                  <RiskBadge score={score} size="sm" />
                </td>
                <td className="data-table__cell">
                  <StatusDot status={it.status} />
                </td>
                <td className="data-table__cell hidden md:table-cell">
                  <span className="mono-num text-[12px] text-[#94A3B8]">
                    {it.lastActivity && !it.lastActivity.includes('T')
                      ? it.lastActivity
                      : (() => {
                          try {
                            return timeAgo(
                              it.lastActivity ?? it.updated_at ?? it.updatedAt ?? new Date().toISOString()
                            );
                          } catch {
                            return 'just now';
                          }
                        })()}
                  </span>
                </td>
                <td className="data-table__cell text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/integrations/${it.id}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#B8C4D8] transition-colors hover:border-[#5B50E6] hover:text-white"
                    >
                      View
                    </Link>
                    {isQ ? (
                      <button
                        onClick={() => onRelease?.(it.id)}
                        disabled={busy}
                        className="rounded-lg border border-[#19D98A]/30 bg-[#19D98A]/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#19D98A] transition-colors hover:bg-[#19D98A]/20 disabled:opacity-50"
                      >
                        {busy ? '…' : 'Release'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onQuarantine?.(it.id)}
                        disabled={busy}
                        className="rounded-lg border border-[#FF4D5E]/30 bg-[#FF4D5E]/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#FF8090] transition-colors hover:bg-[#FF4D5E]/20 disabled:opacity-50"
                      >
                        {busy ? '…' : 'Quarantine'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {compact && items.length > 5 && (
        <div className="border-t px-5 py-3" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
          <Link
            href="/integrations"
            className="font-mono text-[11.5px] font-semibold text-[#5B9CFF] hover:underline"
          >
            View all {items.length} integrations →
          </Link>
        </div>
      )}
    </div>
  );
}
