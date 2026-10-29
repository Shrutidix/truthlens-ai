import type { Config } from "tailwindcss";

// Design tokens: single source of truth for the editorial palette.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F8F6F1",       // main background
        paper: "#FFFFFF",       // cards
        linen: "#F0EEE7",       // secondary surface
        sage: { DEFAULT: "#526B5D", soft: "#DCE6DD" }, // accent / muted highlight
        ink: { DEFAULT: "#292D29", muted: "#706F68" }, // main / secondary text
        rule: "#E9E5DC",        // borders & dividers
        // muted semantic tones (status only; always paired with text/icon)
        clay: { DEFAULT: "#8A4B3F", soft: "#F1E3DE" }, // FAKE / errors (AA on soft bg)
        amber: { DEFAULT: "#7A5C1E", soft: "#F4ECD6" }, // warnings
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "Lora", "Georgia", "serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { card: "14px" },
      boxShadow: { lift: "0 6px 24px -12px rgba(41,45,41,0.18)" },
      maxWidth: { page: "1160px", prose: "68ch" },
      transitionDuration: { DEFAULT: "180ms" },
    },
  },
  plugins: [],
};
export default config;
