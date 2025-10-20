import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#0a0a0a',
        'molten-gold': '#FFD700',
        'neural-emerald': '#FFFFFF',
        'text-white': '#FFFFFF',
        'text-gray': '#CCCCCC',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'ember-fade': 'ember-fade 3s ease-in-out infinite',
        'spark-flow': 'spark-flow 1.5s ease-out',
        'chain-break': 'chain-break 0.8s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', textShadow: '0 0 10px #FFB800' },
          '50%': { opacity: '1', textShadow: '0 0 20px #FFB800, 0 0 30px #FFB800' },
        },
        'ember-fade': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'spark-flow': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-20px) scale(0)', opacity: '0' },
        },
        'chain-break': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(5deg)', opacity: '0.7' },
          '100%': { transform: 'scale(0) rotate(15deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
export default config

