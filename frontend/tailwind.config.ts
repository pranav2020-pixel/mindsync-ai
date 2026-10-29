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
      transition: "border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".hover-lift-subtle:hover": {
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.08)",
    },
    ".hover-press": {
      transition: "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
    },
    ".hover-press:hover": {
      opacity: "0.94",
    },
    ".hover-press:active": {
      opacity: "0.85",
    },
    ".hover-scale": {
      transition: "border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".hover-scale:hover": {
      opacity: "0.96",
    },
  });

  // Stitch Component Presets (Smooth Borderless Surface)
  addComponents({
    ".stitch-card": {
      position: "relative",
      borderRadius: "24px",
      border: "none",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transition: "box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    ".stitch-card:hover": {
      boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.08)",
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
    borderRadius: {
      none: "0px",
      xs: "6px",
      sm: "10px",
      DEFAULT: "16px",
      md: "16px",
      lg: "20px",
      xl: "24px",
      "2xl": "28px",
      "3xl": "36px",
      full: "9999px",
    },
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
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0095F6", // Instagram / Modern Clean Action Blue
          600: "#0081D6",
          700: "#0064A7",
          800: "#004B7D",
          900: "#003254",
        },
        wellness: {
          calm: "#1AAE39",
          energy: "#FFB110",
          stress: "#E32D14",
          focus: "#0075DE",
          sleep: "#1313BA",
        },
        notion: {
          ink: "#000000",
          secondary: "#615D59",
          muted: "#A39E98",
          surface: "#FFFFFF",
          warm: "#F6F5F4",
          hairline: "#DFDCD9",
          tint: "#E6F3FE",
          lavender: "#EADBFA",
          successTint: "#D0F4D8",
          amber: "#FFB110",
          amberDeep: "#E89D01",
          coral: "#F64932",
          red: "#E32D14",
          success: "#1AAE39",
          indigo: "#1313BA",
        },
      },
      fontFamily: {
        sans: [
          "NotionInter",
          "Inter",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Helvetica",
          "Apple Color Emoji",
          "Arial",
          "sans-serif",
        ],
        serif: [
          "Lyon Text",
          "Georgia",
          "YuMincho",
          "Yu Mincho",
          "Hiragino Mincho ProN",
          "serif",
        ],
      },
      animation: { "fade-in": "fadeIn 0.5s ease-out", "slide-up": "slideUp 0.5s ease-out", "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
      keyframes: { fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } }, slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } } },
    },
  },
  plugins: [require("@tailwindcss/forms"), stitchPlugin],
};
export default config;
