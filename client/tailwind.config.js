/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch "Institutional Integrity" design tokens
        primary: {
          DEFAULT: '#001e40',
          container: '#003366',
          fixed: '#d5e3ff',
          'fixed-dim': '#a7c8ff',
          hover: '#002b5c',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#799dd6',
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
          hover: '#00855a',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714d',
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          'container-lowest': '#ffffff',
          variant: '#d3e4fe',
        },
        'on-surface': '#0b1c30',
        'on-surface-variant': '#43474f',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        'inverse-primary': '#a7c8ff',
        outline: {
          DEFAULT: '#737780',
          variant: '#c3c6d1',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        background: '#f8f9ff',
        'on-background': '#0b1c30',

        // Legacy palette fallbacks
        darkbg: {
          950: '#061324',
          900: '#0c1f36',
          800: '#142c4a',
          700: '#1f3c60',
        },
        risk: {
          low: '#006c49',
          medium: '#d97706',
          high: '#ea580c',
          critical: '#ba1a1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['"Atkinson Hyperlegible Next"', 'Inter', 'sans-serif'],
        display: ['"Atkinson Hyperlegible Next"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
