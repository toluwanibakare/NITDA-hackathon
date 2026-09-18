export default function Loading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="section-card animate-pulse" style={{ animationDelay: `${i * 120}ms` }}>
          <div className="h-3 w-1/3 rounded-full" style={{ background: 'rgba(245,249,255,0.10)' }} />
          <div className="mt-3 h-8 w-2/3 rounded-xl" style={{ background: 'rgba(245,249,255,0.06)' }} />
        </div>
      ))}
    </div>
  );
}
