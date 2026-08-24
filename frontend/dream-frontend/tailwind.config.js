/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Palette (Donezo Theme) ──────────────────────────────
        bg: {
          base:    "#F5F6F8",   // Light gray background
          surface: "#FFFFFF",   // White cards
          card:    "#FFFFFF",
          elevated:"#F9FAFB",
        },

        brand: {
          dark:    "#1A5632", // Deep green
          primary: "#2EA76D", // Bright green
          light:   "#E7F4EB", // Very light green for backgrounds
          accent:  "#F59E0B", // Orange accent for pending/progress
        },

        text: {
          primary:   "#1F2937",  // Very dark gray/black
          secondary: "#6B7280",  // Medium gray
          muted:     "#9CA3AF",  // Light gray
          inverse:   "#FFFFFF",  // White text on dark cards
        },

        border: {
          DEFAULT: "#E5E7EB",   // Soft borders
          hover:   "#D1D5DB",
        },

        // Legacy aliases
        primary:              "#1A5632",
        "primary-light":      "#E7F4EB",
        "primary-dark":       "#113F24",
        secondary:            "#6B7280",
        background:           "var(--bg-base)",
        foreground:           "var(--text-primary)",
        
        // Semantic overrides
        ok:      "#2EA76D",
        caution: "#F59E0B",
        danger:  "#EF4444",
      },

      borderRadius: {
        DEFAULT: "12px",
        md:   "16px",
        lg:   "20px",
        xl:   "24px",
        "2xl":"28px",
        full: "9999px",
      },

      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.02)",
        card: "0 4px 20px rgba(0,0,0,0.04)",
        panel:"0 8px 30px rgba(0,0,0,0.06)",
        hover:"0 10px 25px rgba(0,0,0,0.08)",
      },

      spacing: {
        "sidebar-collapsed": "80px",
        "sidebar-expanded":  "260px",
      },

      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/forms"),
  ],
};
