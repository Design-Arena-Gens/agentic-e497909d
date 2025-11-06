import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#9333ea",
          foreground: "#ffffff"
        },
        accent: {
          DEFAULT: "#06b6d4",
          foreground: "#0f172a"
        }
      }
    }
  },
  plugins: []
};

export default config;
