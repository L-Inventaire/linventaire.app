const defaultTheme = require("tailwindcss/defaultTheme");

let shades = [];
[
  "wood",
  "slate",
  "red",
  "orange",
  "green",
  "blue",
  "yellow",
  "rose",
  "purple",
].map((color) => {
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => {
    shades.push(`bg-${color}-${shade}`);
    shades.push(`border-${color}-${shade}`);
    shades.push(`text-${color}-${shade}`);
    shades.push(`dark:bg-${color}-${shade}`);
    shades.push(`dark:border-${color}-${shade}`);
    shades.push(`dark:text-${color}-${shade}`);
  });
});

module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xxs: "9px",
      },
      borderRadius: {
        DEFAULT: "0.3rem",
        md: "0.3rem",
        lg: "0.5rem",
        xl: "0.8rem",
      },
      colors: {
        wood: {
          50: "#f6f4f0",
          100: "#e9e4d8",
          200: "#d6c7b2",
          300: "#bea686",
          400: "#aa8a65",
          500: "#987655",
          600: "#856249",
          700: "#6b4c3d",
          800: "#5c4137",
          900: "#503933",
          950: "#241e1b",
          990: "#080403",
        },
        slate: {
          50: "#f3f3f1",
          100: "#e3e2de",
          200: "#c8c7c0",
          300: "#aaa69d",
          400: "#8e8a80",
          500: "#7f7a71",
          600: "#6d675f",
          700: "#585450",
          800: "#4d4a47",
          900: "#444240",
          950: "#231d1a",
        },
      },
    },
  },
  safelist: [
    "w-10",
    "h-10",
    "w-12",
    "h-12",
    "w-14",
    "h-14",
    "w-28",
    "h-28",
    "w-32",
    "h-32",
    "w-10",
    "h-10",
    "z-10",
    "z-20",
    "z-30",
    "z-40",
    "z-50",
    "pl-9",
    "transition-all",
    "bg-gradient-to-r",
    "from-current",
    "to-blue-600",
    "bg-red-100",
    "border-indigo-800",
    "bg-blue-50",
    "text-blue-500",
    "text-indigo-800",
    "border-green-800",
    "bg-green-50",
    "text-green-600",
    "text-green-800",
    "border-red-800",
    "bg-red-50",
    "text-red-600",
    "text-red-800",
    "border-orange-800",
    "bg-orange-50",
    "text-orange-500",
    "text-orange-600",
    "text-orange-800",
    "border-gray-800",
    "bg-gray-50",
    "text-gray-600",
    "text-gray-800",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-blue-400",
    "bg-slate-500",
    "bg-slate-200",
    "text-slate-900",
    "max-w-md",
    "bg-blue-400",
    "bg-emerald-500",
    "bg-purple-500",
    "min-w-full",
    ...shades,
  ],
  plugins: [require("@tailwindcss/forms")],
};
