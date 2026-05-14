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
        // ─── Luxury Dark Theme ─────────────────────────────────────────
        // Brand & Accent (Emerald → Emerald-Cyan gradient system)
        primary: {
          DEFAULT: "#3ecf8e",
          deep: "#24b47e",
          soft: "#4ade80",
          cyan: "#06b6d4",
          foreground: "#0a0a0f",
        },
        // Surface (Deep dark with glass layers)
        canvas: {
          DEFAULT: "#0a0a0f",       // Deep navy-black base
          soft: "#12121a",          // Slightly lifted surface
          card: "#14141f",          // Card background
          elevated: "#1a1a2e",      // Elevated panels
          night: "#1c1c1c",         // Legacy compat
          "night-soft": "#202020",  // Legacy compat
        },
        // Glass borders (subtle white opacity)
        hairline: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.15)",
          cool: "rgba(255,255,255,0.05)",
        },
        // Text (Light on dark)
        ink: {
          DEFAULT: "#f0f0f5",       // Primary text (off-white)
          secondary: "#e0e0ea",     // Slightly dimmer
          mute: "#8b8b9e",          // Muted (lavender-gray)
          "mute-2": "#6b6b80",     // More muted
          faint: "#4a4a5e",         // Very faint (disabled)
        },
        // Semantic (with glow-friendly colors)
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#fbbf24",
          bg: "rgba(245,158,11,0.1)",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#fca5a5",
          bg: "rgba(239,68,68,0.1)",
        },
        info: {
          DEFAULT: "#3b82f6",
          foreground: "#93c5fd",
          bg: "rgba(59,130,246,0.1)",
        },
        success: {
          DEFAULT: "#3ecf8e",
          foreground: "#6ee7b7",
          bg: "rgba(62,207,142,0.1)",
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
        "glow-cyan": "0 0 20px rgba(6,182,212,0.15)",
        glass: "0 8px 32px rgba(0,0,0,0.4)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #3ecf8e 0%, #06b6d4 100%)",
        "gradient-dark": "linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)",
        "mesh-gradient": "radial-gradient(at 20% 20%, rgba(62,207,142,0.06) 0%, transparent 50%), radial-gradient(at 80% 80%, rgba(6,182,212,0.04) 0%, transparent 50%)",
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
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
