/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary blue theme (from design language)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#1e40af', // Main sidebar/primary color
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Extended gray scale (from design language)
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Status colors (from design language)
        status: {
          new: {
            bg: '#dbeafe',
            text: '#1d4ed8',
          },
          qualified: {
            bg: '#d1fae5',
            text: '#047857',
          },
          contacted: {
            bg: '#fef3c7',
            text: '#92400e',
          },
          proposal: {
            bg: '#ede9fe',
            text: '#7c3aed',
          },
          negotiation: {
            bg: '#fed7d7',
            text: '#c53030',
          },
        },
        // Semantic colors
        success: {
          50: '#d1fae5',
          500: '#10b981',
          600: '#047857',
        },
        error: {
          50: '#fed7d7',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Background variants
        background: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f3f4f6',
        },
      },
      spacing: {
        // 8px grid system
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      boxShadow: {
        // Design language shadows
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'lg': ['16px', { lineHeight: '24px' }],
        'xl': ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
      },
    },
  },
  plugins: [],
}