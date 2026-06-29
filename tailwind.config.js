/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // APMS dark palette
        bg: {
          primary:   '#0f1117',
          secondary: '#0d0f16',
          card:      '#1a1d28',
          border:    '#252a3a',
          hover:     '#1e2330',
        },
        brand: {
          blue:   '#3b82f6',
          green:  '#22c55e',
          yellow: '#eab308',
          red:    '#ef4444',
          purple: '#a855f7',
        },
        text: {
          primary:   '#f1f5f9',
          secondary: '#94a3b8',
          muted:     '#4a5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        lg:   '12px',
      },
    },
  },
  plugins: [],
}
