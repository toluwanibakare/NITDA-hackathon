import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#FFFFFF',
        navy: '#F4F6FB',
        panel: '#FFFFFF',
        panel2: '#F1F5F9',
        brand: '#0A65FF',
        branddeep: '#0A1830',
        aqua: '#0891B2',
        trust: '#0E9F6E',
        ink: '#0A1830',
        muted: '#51617A',
        faint: '#8B9BB4',
        line: '#E4EAF3',
        critical: '#E5484D',
        high: '#F59E0B',
        watch: '#D9930D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16,24,40,0.05), 0 12px 32px -16px rgba(16,24,40,0.18)',
        pop: '0 1px 2px rgba(16,24,40,0.06), 0 16px 40px -16px rgba(10,101,255,0.25)',
        glow: '0 8px 24px -8px rgba(10,101,255,0.5)',
        aqua: '0 8px 24px -10px rgba(8,145,178,0.5)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.45', transform: 'scale(0.8)' } },
        pingRing: { '0%': { opacity: '0.7', transform: 'scale(0.6)' }, '80%,100%': { opacity: '0', transform: 'scale(1.6)' } },
        dashFlow: { to: { strokeDashoffset: '-28' } },
        scanY: { '0%': { top: '0%', opacity: '0' }, '12%': { opacity: '1' }, '88%': { opacity: '1' }, '100%': { top: '100%', opacity: '0' } },
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        eyeScan: { '0%,100%': { transform: 'translateX(-28px)', opacity: '0.6' }, '50%': { transform: 'translateX(28px)', opacity: '1' } },
        barSlide: { from: { transform: 'translateX(-110%)' }, to: { transform: 'translateX(320%)' } },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22,1,0.36,1) both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        pingRing: 'pingRing 2.2s cubic-bezier(0,0,0.2,1) infinite',
        dashFlow: 'dashFlow 1.4s linear infinite',
        blink: 'blink 1.2s steps(2) infinite',
        spinSlow: 'spinSlow 14s linear infinite',
        eyeScan: 'eyeScan 1.6s ease-in-out infinite',
        barSlide: 'barSlide 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
