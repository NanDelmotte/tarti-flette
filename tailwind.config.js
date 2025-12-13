/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        global: "var(--global-bg)",
        box: "var(--box-bg)",
        button: "var(--button-bg)",
        "button-txt": "var(--button-txt)",
      },
    },
  },
  plugins: [],
};
