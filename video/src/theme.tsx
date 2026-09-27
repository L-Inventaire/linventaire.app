import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const colors = {
  bg: "#0f172a",
  bgSoft: "#1e293b",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  muted: "#94a3b8",
  accent: "#3b82f6",
  accent2: "#22c55e",
  warn: "#f59e0b",
};

export const font =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const mono = "'JetBrains Mono', 'Fira Code', Menlo, monospace";

// Fade in / fade out the whole scene
export const Scene: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 20% 0%, #1e3a8a 0%, ${colors.bg} 55%)`,
        color: colors.text,
        fontFamily: font,
        padding: 100,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const useAppear = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
  };
};

export const Appear: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const a = useAppear(delay);
  return <div style={{ ...style, ...a }}>{children}</div>;
};

export const Title: React.FC<{ kicker?: string; children: React.ReactNode }> = ({
  kicker,
  children,
}) => (
  <Appear>
    {kicker && (
      <div
        style={{
          color: colors.accent,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {kicker}
      </div>
    )}
    <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 50 }}>
      {children}
    </div>
  </Appear>
);

export const Card: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => (
  <Appear
    delay={delay}
    style={{
      background: colors.card,
      border: `2px solid ${colors.border}`,
      borderRadius: 24,
      padding: 36,
      ...style,
    }}
  >
    {children}
  </Appear>
);
