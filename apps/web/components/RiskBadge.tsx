export function RiskBadge({ score }: { score: number }) {
  const c = score >= 81 ? 'bg-red-600' : score >= 61 ? 'bg-orange-500' : score >= 31 ? 'bg-yellow-500 text-black' : 'bg-green-600';
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${c}`}>{score}</span>;
}
