/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["Share Tech Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        cyber: {
          bg: "#05060a",
          panel: "#0b0e16",
          neon: "#69ff97",
          blue: "#00e5ff",
          purple: "#a855f7",
          magenta: "#ff2d95",
          yellow: "#ffd166",
          line: "#1f2635",
        },
      },
      boxShadow: {
        glow: "0 0 25px rgba(105,255,151,0.25)",
        neon: "0 0 20px rgba(0,229,255,0.35)",
      },
    },
  },
  plugins: [],
};
