/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ipl: {
          navy: "#031453",
          midnight: "#061645",
          blue: "#19398a",
          feature: "#132e73",
          secondary: "#0d245c",
          sky: "#33a3dc",
          electric: "#56bdf9",
          sindoor: "#ef4123",
          spice: "#ffcb05",
          gold: "#f59e0b",
        },
        nexus: {
          bg: "#031453",
          surface: "#061645",
          card: "#0d245c",
          border: "#19398a",
          hover: "#132e73",
          cyan: "#33a3dc",
          electric: "#56bdf9",
          gold: "#ffcb05",
          emerald: "#10B981",
          rose: "#ef4123",
          violet: "#8B5CF6",
        },
        teams: {
          csk: "#f9ed25",
          mi: "#005289",
          rcb: "#d6272e",
          kkr: "#602f92",
          dc: "#253e8a",
          pbks: "#d52027",
          rr: "#ed1164",
          srh: "#f04e23",
          gt: "#0b1d34",
          lsg: "#aa003b",
        }
      },
      fontFamily: {
        sans: ["'Bricolage Grotesque'", "'Plus Jakarta Sans'", "'Inter'", "-apple-system", "sans-serif"],
        display: ["'Bricolage Grotesque'", "'Outfit'", "sans-serif"],
        expressive: ["'Bricolage Grotesque'", "sans-serif"],
        num: ["'Bricolage Grotesque'", "'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(51, 163, 220, 0.35)",
        "glow-gold": "0 0 20px -5px rgba(255, 203, 5, 0.35)",
        "glow-rose": "0 0 20px -5px rgba(239, 65, 35, 0.35)",
        "ipl-card": "0 8px 32px rgba(3, 20, 83, 0.45)",
      }
    },
  },
  plugins: [],
}
