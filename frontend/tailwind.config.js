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
        nexus: {
          bg: "#070B14",
          surface: "#0D1527",
          card: "#111C35",
          border: "#1E2D4D",
          hover: "#182745",
          cyan: "#00F0FF",
          electric: "#3B82F6",
          gold: "#F59E0B",
          emerald: "#10B981",
          rose: "#EF4444",
          violet: "#8B5CF6",
        },
        teams: {
          csk: "#FACC15",
          mi: "#005DA0",
          rcb: "#EC1C24",
          kkr: "#4B286D",
          dc: "#17479E",
          pbks: "#ED1B24",
          rr: "#EA1A85",
          srh: "#F26522",
          gt: "#1C2833",
          lsg: "#37A1D2",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(0, 240, 255, 0.25)",
        "glow-gold": "0 0 20px -5px rgba(245, 158, 11, 0.25)",
        "glow-rose": "0 0 20px -5px rgba(239, 68, 68, 0.25)",
      }
    },
  },
  plugins: [],
}
