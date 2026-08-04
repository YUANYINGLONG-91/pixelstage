import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-0": "var(--bg-0)",
        "bg-1": "var(--bg-1)",
        "bg-2": "var(--bg-2)",
        "bg-3": "var(--bg-3)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "text-1": "var(--text-1)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        amber: "var(--amber)",
        "amber-hover": "var(--amber-hover)",
        teal: "var(--teal)",
        danger: "var(--danger)",
        success: "var(--success)",
        "code-bg": "var(--code-bg)",
        magenta: "var(--magenta)",
      },
      backgroundColor: {
        "amber-dim": "var(--amber-dim)",
        "teal-dim": "var(--teal-dim)",
      },
      fontFamily: {
        pixel: ["Silkscreen", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "caret-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
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
        marquee: "marquee 30s linear infinite",
        "caret-blink": "caret-blink 1s step-end infinite",
        "pulse-dot": "pulse-dot 600ms ease-in-out infinite",
        "accordion-down": "accordion-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
