/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#0a0a0f',
          surface: '#0f0f17',
          panel: '#13131e',
          border: '#1e1e2e',
          teal: '#00f5c4',
          purple: '#a855f7',
          muted: '#4a4a6a',
          text: '#c8c8d8',
          dim: '#6b6b8a'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace']
      }
    }
  },
  plugins: []
};
