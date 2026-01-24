/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#FFD535",
          "primary-content": "#1E2329",
          secondary: "#6b7280",
          "secondary-content": "#ffffff",
          accent: "#FFD535",
          "accent-content": "#1E2329",
          neutral: "#2D333B",
          "neutral-content": "#d1d5db",
          "base-100": "#1E2329",
          "base-200": "#161B22",
          "base-300": "#0D1117",
          "base-content": "#f3f4f6",
          info: "#3b82f6",
          "info-content": "#ffffff",
          success: "#22c55e",
          "success-content": "#ffffff",
          warning: "#f59e0b",
          "warning-content": "#1f2937",
          error: "#ef4444",
          "error-content": "#ffffff",
        },
      },
    ],
    darkTheme: "dark",
  },
};
