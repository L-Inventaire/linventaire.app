const defaultTheme = require("tailwindcss/defaultTheme");

let shades = [];
["slate", "red", "orange", "green", "blue", "yellow", "rose", "purple"].map(
  (color) => {
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => {
      shades.push(`bg-${color}-${shade}`);
      shades.push(`border-${color}-${shade}`);
      shades.push(`text-${color}-${shade}`);
      shades.push(`dark:bg-${color}-${shade}`);
      shades.push(`dark:border-${color}-${shade}`);
      shades.push(`dark:text-${color}-${shade}`);
    });
  }
);

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
        DEFAULT: "2rem",
        md: "2rem",
        lg: "2rem",
        xl: "2rem",
      },
      colors: {
        green: {
          50: "#f0fdf3",
          100: "#dbfde5",
          200: "#b4f8c8",
          300: "#83f2a5",
          400: "#46e276",
          500: "#1ec953",
          600: "#12a741",
          700: "#128336",
          800: "#14672f",
          900: "#125529",
          950: "#042f14",
        },
        orange: {
          50: "#fef8ee",
          100: "#fbe7c6",
          200: "#f8dbb0",
          300: "#f4c07d",
          400: "#ee9b49",
          500: "#ea8025",
          600: "#db671b",
          700: "#b64e18",
          800: "#913e1b",
          900: "#753519",
          950: "#3f190b",
        },
        red: {
          50: "#fff1f3",
          100: "#ffe3e6",
          200: "#ffccd5",
          300: "#ffaebc",
          400: "#fe6e8a",
          500: "#f83b64",
          600: "#e51950",
          700: "#c20e43",
          800: "#a20f3f",
          900: "#8b103c",
          950: "#4e031c",
        },
        blue: {
          50: "#effcfb",
          100: "#d8f5f3",
          200: "#a0e7e5",
          300: "#81dfde",
          400: "#47c9c9",
          500: "#2badaf",
          600: "#278c93",
          700: "#267278",
          800: "#265d64",
          900: "#244e55",
          950: "#133339",
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
