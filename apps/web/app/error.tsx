'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="section-card flex flex-col items-center py-12 text-center">
      <div className="text-[16px] font-bold text-[#F5F9FF]">Console hiccup — showing last known state</div>
      <p className="section-sub-soft mt-2 max-w-md">
        {error.message || 'The engine did not respond. Your demo data is intact.'} Check that the API at{' '}
        <span className="mono-num">{process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}</span> is running, then retry.
      </p>
      <button onClick={reset} className="btn-accent mt-5">Retry</button>
    </div>
  );
}
