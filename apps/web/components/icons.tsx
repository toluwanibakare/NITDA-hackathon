export function Icon({
  d,
  size = 16,
  strokeWidth = 1.6,
  className = '',
}: {
  d: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
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
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  cpu: 'M4 4h16v16H4z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M1 9h3 M1 15h3 M20 9h3 M20 15h3',
  sparkles:
    'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M18.36 5.64l-2.83 2.83 M8.46 15.54l-2.82 2.83 M5.64 5.64l2.83 2.83 M15.54 15.54l2.83 2.83',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  database:
    'M12 3c-4.97 0-9 1.79-9 4v10c0 2.21 4.03 4 9 4s9-1.79 9-4V7c0-2.21-4.03-4-9-4z M3 7c0 2.21 4.03 4 9 4s9-1.79 9-4 M3 12c0 2.21 4.03 4 9 4s9-1.79 9-4',
  plus: 'M12 5v14 M5 12h14',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  copy: 'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2',
  terminal: 'M4 17l6-6-6-6 M12 19h8',
  code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
};

