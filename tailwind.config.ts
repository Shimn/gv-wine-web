import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50:  '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d1d8',
          300: '#f4acb9',
          400: '#ec7a91',
          500: '#c44b4b',
          600: '#a83232',
          700: '#8b1a1a',
          800: '#6b1515',
          900: '#4a0d0d',
          950: '#2d0707',
        },
      },
      keyframes: {
        fadeSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
          '40%':           { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeSlideUp: 'fadeSlideUp 0.25s ease-out',
        dotBounce:   'dotBounce 1.4s infinite ease-in-out both',
        slideUp:     'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        slideLeft:   'slideLeft 0.3s cubic-bezier(0.32,0.72,0,1)',
      },
    },
  },
  plugins: [],
};

export default config;
