
import type { Config } from 'tailwindcss'
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          500: '#33B1FF'
        }
      },
      boxShadow: {
        neon: '0 0 12px rgba(51,177,255,0.6)'
      }
    }
  },
  plugins: []
} satisfies Config
