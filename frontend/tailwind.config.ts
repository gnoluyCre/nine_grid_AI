import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        ink: "#221b2d",
        plum: "#655387",
        iris: "#8f7bb8",
        mist: "#f7f3fb",
        shell: "#fffdf8",
        line: "#e8deef",
        danger: "#b62626",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(101, 83, 135, 0.10)",
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(circle at top left, rgba(143,123,184,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(101,83,135,0.14), transparent 30%), linear-gradient(180deg, #fcfbfe 0%, #f7f3fb 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
