import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        pitch: "var(--pitch)",
        "pitch-2": "var(--pitch-2)",
        chalk: "var(--chalk)",
        gold: "var(--gold)",
        "gold-soft": "var(--gold-soft)",
        win: "var(--win)",
        draw: "var(--draw)",
        loss: "var(--loss)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        num: ["var(--font-num)", "Arial Narrow", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
