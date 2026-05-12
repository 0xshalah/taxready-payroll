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
        // Brand & Accent
        primary: {
          DEFAULT: "#3ecf8e",
          deep: "#24b47e",
          soft: "#4ade80",
          foreground: "#171717",
        },
        // Surface
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#fafafa",
          night: "#1c1c1c",
          "night-soft": "#202020",
        },
        // Borders
        hairline: {
          DEFAULT: "#dfdfdf",
          strong: "#c7c7c7",
          cool: "#ededed",
        },
        // Text
        ink: {
          DEFAULT: "#171717",
          secondary: "#212121",
          mute: "#707070",
          "mute-2": "#9a9a9a",
          faint: "#b2b2b2",
        },
        // Semantic
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#92400e",
          bg: "#fffbeb",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#991b1b",
          bg: "#fef2f2",
        },
        info: {
          DEFAULT: "#3b82f6",
          foreground: "#1e40af",
          bg: "#eff6ff",
        },
        success: {
          DEFAULT: "#3ecf8e",
          foreground: "#065f46",
          bg: "#ecfdf5",
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
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "Monaco", "Consolas", "monospace"],
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
