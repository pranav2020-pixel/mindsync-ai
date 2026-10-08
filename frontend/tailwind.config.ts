import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const stitchPlugin = plugin(function ({ addUtilities, addComponents }) {
  // Stitch Design System: Micro-textures, grids, and tactile borders
  addUtilities({
    ".stitch-grid": {
      backgroundImage:
        "linear-gradient(to right, rgba(128, 128, 128, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.08) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
    },
    ".stitch-dots": {
      backgroundImage: "radial-gradient(rgba(128, 128, 128, 0.15) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
    ".stitch-border": {
      borderStyle: "dashed",
      borderWidth: "1px",
      borderColor: "rgba(128, 128, 128, 0.28)",
    },
    ".stitch-border-subtle": {
      borderStyle: "dashed",
      borderWidth: "1px",
      borderColor: "rgba(128, 128, 128, 0.14)",
    },
    ".hover-lift-subtle": {
      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".hover-lift-subtle:hover": {
      transform: "translateY(-2px)",
    },
    ".hover-press": {
      transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease",
    },
    ".hover-press:hover": {
      transform: "translateY(-1.5px)",
    },
    ".hover-press:active": {
      transform: "translateY(1px) scale(0.98)",
    },
    ".hover-scale": {
      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".hover-scale:hover": {
      transform: "scale(1.025)",
    },
  });

  // Stitch Component Presets
  addComponents({
    ".stitch-card": {
      position: "relative",
      borderRadius: "1rem",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".stitch-card:hover": {
      transform: "translateY(-4px)",
    },
  });
});

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        primary: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e" },
        wellness: { calm: "#10b981", energy: "#f59e0b", stress: "#ef4444", focus: "#8b5cf6", sleep: "#6366f1" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      animation: { "fade-in": "fadeIn 0.5s ease-out", "slide-up": "slideUp 0.5s ease-out", "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
      keyframes: { fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } }, slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } } },
    },
  },
  plugins: [require("@tailwindcss/forms"), stitchPlugin],
};
export default config;
