export function Icon({ d, size = 16, strokeWidth = 1.6, className = '' }: { d: string; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}


export const paths = {
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z',
  pulse: 'M3 12h4l2.5-6 4 12L16 12h5',
  grid: 'M4 4h16v16H4z M4 9h16 M9 4v16',
  clock: 'M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5z',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18.5v.01',
  check: 'M4 12.5l5 5L20 6.5',
  cross: 'M6 6l12 12 M18 6L6 18',
  play: 'M7 4.5l13 7.5-13 7.5z',
  stop: 'M6 6h12v12H6z',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5',
  radio: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0 M5.5 5.5a9 9 0 0 0 0 13 M18.5 5.5a9 9 0 0 1 0 13',
};
