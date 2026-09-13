import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#040B16',
        navy: '#071426',
        panel: '#0B1E35',
        panel2: '#0E2440',
        brand: '#1677FF',
        aqua: '#00C8D7',
        trust: '#19D98A',
        ink: '#F5F9FF',
        muted: '#8CA3BF',
        faint: '#5B7191',
        line: 'rgba(0,200,215,0.12)',
        critical: '#FF4D5E',
        high: '#FF9F2E',
        watch: '#FFC42E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px -18px rgba(0,0,0,0.7)',
        glow: '0 0 24px -6px rgba(22,119,255,0.55)',
        aqua: '0 0 24px -8px rgba(0,200,215,0.6)',
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
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22,1,0.36,1) both',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        pingRing: 'pingRing 2.2s cubic-bezier(0,0,0.2,1) infinite',
        dashFlow: 'dashFlow 1.4s linear infinite',
        blink: 'blink 1.2s steps(2) infinite',
        spinSlow: 'spinSlow 14s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
