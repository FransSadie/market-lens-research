/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a101a",
        panel: "#152033",
        plate: "#1f2b3e",
        line: "#566783",
        ink: "#f0f5ff",
        mute: "#b5c0d7",
        good: "#3ad8ab",
        warn: "#f2b46f",
        bad: "#ff7b95",
        accent: "#7fb8ff"
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(127,184,255,.18), 0 22px 60px rgba(0,0,0,.36)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,.08), inset 0 0 0 1px rgba(127,184,255,.08)",
        "pane-edge": "inset 0 1px 0 rgba(255,255,255,.05), 0 0 0 1px rgba(86,103,131,.7), 0 18px 40px rgba(0,0,0,.28)"
      },
      backgroundImage: {
        "app-shell": "radial-gradient(circle at top left, rgba(64,104,182,.82) 0%, rgba(31,48,84,.92) 28%, rgba(17,24,39,.96) 56%, #09101a 100%)"
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-rise": "fade-rise 220ms ease-out"
      }
    }
  },
  plugins: []
};
