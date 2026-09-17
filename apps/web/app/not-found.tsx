import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="section-card flex flex-col items-center py-12 text-center">
      <div className="section-label">404 · outside trust scope</div>
      <div className="section-heading mt-2">This route is not in the registry</div>
      <p className="section-sub mt-2">The page you requested is outside the allowed scope.</p>
      <Link href="/dashboard" className="btn-accent mt-5">Back to dashboard</Link>
    </div>
  );
}
