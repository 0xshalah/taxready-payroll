import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand (same in both themes)
        primary: {
          DEFAULT: "#3ecf8e",
          deep: "#24b47e",
          soft: "#4ade80",
          cyan: "#06b6d4",
          foreground: "#171717",
        },
        // Surface — light default, dark override via dark: prefix
        canvas: {
          DEFAULT: "var(--color-canvas)",
          soft: "var(--color-canvas-soft)",
          card: "var(--color-canvas-card)",
          elevated: "var(--color-canvas-elevated)",
        },
        // Borders
        hairline: {
          DEFAULT: "var(--color-hairline)",
          strong: "var(--color-hairline-strong)",
          cool: "var(--color-hairline-cool)",
        },
        // Text
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          mute: "var(--color-ink-mute)",
          "mute-2": "var(--color-ink-mute-2)",
          faint: "var(--color-ink-faint)",
        },
        // Semantic
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "var(--color-warning-fg)",
          bg: "var(--color-warning-bg)",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "var(--color-error-fg)",
          bg: "var(--color-error-bg)",
        },
        info: {
          DEFAULT: "#3b82f6",
          foreground: "var(--color-info-fg)",
          bg: "var(--color-info-bg)",
        },
        success: {
          DEFAULT: "#3ecf8e",
          foreground: "var(--color-success-fg)",
          bg: "var(--color-success-bg)",
        },
        // shadcn/ui CSS variable mappings
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(62,207,142,0.15)",
        "glow-lg": "0 0 40px rgba(62,207,142,0.2)",
        glass: "0 8px 32px rgba(0,0,0,0.4)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
