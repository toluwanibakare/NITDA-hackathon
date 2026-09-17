import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#071426',
        navy: '#0B132B',
        panel: '#0E1A33',
        panel2: '#12233F',
        brand: '#1677FF',
        branddeep: '#071426',
        aqua: '#00C8D7',
        trust: '#19D98A',
        ink: '#F5F9FF',
        muted: '#94A3B8',
        faint: '#64748B',
        line: 'rgba(245,249,255,0.10)',
        critical: '#FF4D5E',
        high: '#FF9F2E',
        watch: '#FFC42E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"Cascadia Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.30), 0 16px 40px -20px rgba(0,0,0,0.60)',
        pop: '0 1px 2px rgba(0,0,0,0.30), 0 16px 40px -16px rgba(22,119,255,0.45)',
        glow: '0 8px 24px -8px rgba(22,119,255,0.55)',
        aqua: '0 8px 24px -10px rgba(0,200,215,0.45)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
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
        rise: 'rise 0.18s cubic-bezier(0.23,1,0.32,1) both',
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
