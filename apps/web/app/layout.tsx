import './globals.css';
export const metadata = { title: 'ThirdEye — watches your third parties', description: 'Continuous trust layer for third-party integrations. ICSC G1.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen bg-[#05070d] text-slate-100">
      <header className="border-b border-white/10 px-6 py-3 flex items-center gap-3">
        <span className="text-xl">👁️</span><strong>ThirdEye</strong>
        <span className="text-xs text-slate-400">G1 · ICSC 2nd Edition</span>
        <nav className="ml-auto flex gap-4 text-sm text-slate-300">
          <a href="/dashboard">Dashboard</a><a href="/integrations">Integrations</a>
          <a href="/events">Events</a><a href="/simulator">Simulator</a><a href="/settings">Settings</a>
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </body></html>
  );
}
