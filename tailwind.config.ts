import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Geist Variable"', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))', hover: 'hsl(var(--primary-hover))', subtle: 'hsl(var(--primary-subtle))' },
        brand: { DEFAULT: 'hsl(var(--brand))', deep: 'hsl(var(--brand-deep))' },
        lime: { DEFAULT: 'hsl(var(--lime))', ink: 'hsl(var(--lime-ink))', wash: 'hsl(var(--lime-wash))' },
        label: 'hsl(var(--label))',
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        status: {
          success: { fg: 'hsl(var(--status-success-fg))', bg: 'hsl(var(--status-success-bg))' },
          warning: { fg: 'hsl(var(--status-warning-fg))', bg: 'hsl(var(--status-warning-bg))' },
          danger: { fg: 'hsl(var(--status-danger-fg))', bg: 'hsl(var(--status-danger-bg))' },
          info: { fg: 'hsl(var(--status-info-fg))', bg: 'hsl(var(--status-info-bg))' },
          neutral: { fg: 'hsl(var(--status-neutral-fg))', bg: 'hsl(var(--status-neutral-bg))' },
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
      },
      fontSize: {
        '2xs': ['12px', { lineHeight: '16px' }],
        xs: ['13px', { lineHeight: '20px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        xl: ['24px', { lineHeight: '32px' }],
      },
      transitionDuration: { DEFAULT: '150ms' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
    },
  },
  plugins: [animate],
} satisfies Config;
