import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 36px -16px rgb(15 23 42 / 0.22)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top right, rgb(186 230 253 / 0.75), transparent 42%), radial-gradient(circle at bottom left, rgb(251 207 232 / 0.55), transparent 38%)',
      },
    },
  },
  plugins: [],
} satisfies Config
