/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#FF6A00',
          greenHover: '#E85E00',
          greenLight: '#FFF2E8',
          greenBorder: '#FFD1AD',
          greenText: '#7A2E00',
          orange: '#FF6A00',
          orangeLight: '#FFBA3D',
          navy: '#0B1320',
          neutral: '#6B7280',
          offWhite: '#F6F7F5',
          darkBg: '#0B1320',
          darkSurface: '#111C2A',
          darkCard: '#182433',
          lightBg: '#F6F7F5',
          glass: 'rgba(255, 255, 255, 0.68)',
          glassBorder: 'rgba(255, 255, 255, 0.86)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        mercosul: {
          blue: '#003399',
          yellow: '#FED100',
          green: '#009739',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        plate: ['"FE-Schrift"', 'Impact', '"Arial Black"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'plate': '0 10px 30px -5px rgba(0, 51, 153, 0.3), 0 0 0 1px rgba(0, 51, 153, 0.1)',
        'card-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
        'glow-green': '0 0 25px -5px rgba(34, 197, 94, 0.4)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce-subtle 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-3%)' },
          '50%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
