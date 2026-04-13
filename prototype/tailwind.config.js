/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F2E8',
          warm: '#EDE9DC',
          dark: '#E5E0D0',
        },
        ink: {
          DEFAULT: '#2C2416',
          light: '#5A4D3A',
          muted: '#8B7D66',
        },
        accent: {
          DEFAULT: '#A63D2F',
          light: '#F5E6E3',
        },
        gold: {
          DEFAULT: '#8B6914',
          light: '#F5EBD3',
        },
        border: '#D4CDB8',
        success: '#2D5A27',
        warning: '#8B6914',
        error: '#8B2500',
      },
      fontFamily: {
        'serif-cn': ['Noto Serif SC', 'serif'],
      },
      fontSize: {
        'xs': ['0.5625rem', { lineHeight: '1.5' }],
        'sm': ['0.625rem', { lineHeight: '1.5' }],
        'base': ['0.75rem', { lineHeight: '1.6' }],
        'md': ['0.8125rem', { lineHeight: '1.35' }],
        'lg': ['0.875rem', { lineHeight: '1.6' }],
        'xl': ['0.9375rem', { lineHeight: '1.4' }],
        '2xl': ['1.75rem', { lineHeight: '1', fontWeight: '900' }],
      },
      letterSpacing: {
        'wide': '0.05em',
        'wider': '0.1em',
        'widest': '0.15em',
        'widest2': '0.2em',
        'widest3': '0.3em',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
      },
      boxShadow: {
        'offset': '2px 2px 0 #E5E0D0',
        'offset-lg': '3px 3px 0 #E5E0D0',
        'paper': '0 4px 20px rgba(26, 22, 18, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
