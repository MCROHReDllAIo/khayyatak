import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#071A33",
          light: "#0F2A4A",
        },
        omani: {
          green: "#0F7654",
          gold: "#C8A45D",
          cream: "#F5F0E7",
        },
        foreground: "#101828",
        background: "#FFFFFF",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "#0F7654",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F0E7",
          foreground: "#071A33",
        },
        accent: {
          DEFAULT: "#C8A45D",
          foreground: "#071A33",
        },
        muted: {
          DEFAULT: "#F5F0E7",
          foreground: "#667085",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#101828",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        premium: "0 4px 24px -4px rgba(11, 19, 43, 0.08)",
        card: "0 2px 12px -2px rgba(11, 19, 43, 0.06)",
        glow: "0 0 40px -10px rgba(22, 130, 91, 0.3)",
      },
      animation: {
        "scan-line": "scan-line 2s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "scan-line": {
          "0%, 100%": { top: "10%" },
          "50%": { top: "85%" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
