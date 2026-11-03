/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#090D16",      // Deep midnight charcoal
        surface: "#131B2E",         // Elevated card surface
        surfaceHighlight: "#1E293B",// Interactive borders/pressed state
        brand: "#10B981",           // Vibrant mint/emerald (positive balance)
        brandDark: "#047857",
        debt: "#F43F5E",            // Vibrant rose/coral (negative balance/owe)
        textPrimary: "#F8FAFC",     // Crisp white text
        textSecondary: "#94A3B8",   // Muted gray labels
      },
      fontFamily: {
        mono: ["Courier", "monospace"], // For strict tabular numbers
      }
    },
  },
  plugins: [],
};
