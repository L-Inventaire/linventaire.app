import "@fontsource-variable/inter";
import { Easing, interpolate, spring } from "remotion";

// Colors taken from frontend/tailwind.config.js (warm slate scale) and the
// Radix accent (#231f23) used by the app.
export const c = {
  ink: "#11110F",
  accent: "#231F23",
  bgApp: "#EDEDED",
  white: "#FFFFFF",
  s25: "#F9F9F9",
  s50: "#EDEDED",
  s100: "#E0E0E0",
  s200: "#C6C6C6",
  s300: "#ACACA5",
  s400: "#92928C",
  s500: "#767673",
  s600: "#575753",
  s700: "#393935",
  blue: "#3B82F6",
  blueBg: "#DBEAFE",
  blueText: "#1D4ED8",
  orange: "#F97316",
  orangeBg: "#FCE7D3",
  orangeText: "#C2410C",
  green: "#22C55E",
  greenBg: "#DCFCE7",
  greenText: "#15803D",
  red: "#EF4444",
  redBg: "#FEE2E2",
  redText: "#DC2626",
  purple: "#A855F7",
};

export const font = "'Inter Variable', Inter, sans-serif";

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 0 → 1 between two frames, eased
export const prog = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

export const pop = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 } });

export const bouncy = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 13, mass: 0.7 } });

export const euros = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202f\u00a0 ]/g, "\u00a0") +
  " €";
