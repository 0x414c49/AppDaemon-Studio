/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ha: {
          bg: 'var(--ha-bg)',
          card: 'var(--ha-card)',
          surface: 'var(--ha-surface)',
          'surface-hover': 'var(--ha-surface-hover)',
          'surface-active': 'var(--ha-surface-active)',
          border: 'var(--ha-border)',
          primary: 'var(--ha-primary)',
          'primary-dark': 'var(--ha-primary-dark)',
          accent: 'var(--ha-accent)',
          text: 'var(--ha-text)',
          'text-secondary': 'var(--ha-text-secondary)',
          'text-disabled': 'var(--ha-text-disabled)',
          error: 'var(--ha-error)',
          'error-bg': 'var(--ha-error-bg)',
          success: 'var(--ha-success)',
          'success-bg': 'var(--ha-success-bg)',
          warning: 'var(--ha-warning)',
          'warning-bg': 'var(--ha-warning-bg)',
          'info-bg': 'var(--ha-info-bg)',
          sidebar: 'var(--ha-sidebar)',
          topbar: 'var(--ha-topbar)',
          status: 'var(--ha-status)',
        },
      },
    },
  },
  plugins: [],
};
