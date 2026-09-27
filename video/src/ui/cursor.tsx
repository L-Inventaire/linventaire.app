import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export type CursorKey = { f: number; x: number; y: number; click?: boolean };

// Mouse pointer following keyframes (in app coordinates) with click ripples
export const Cursor: React.FC<{ keys: CursorKey[] }> = ({ keys }) => {
  const frame = useCurrentFrame();
  const fs = keys.map((k) => k.f);
  const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.2, 1) } as const;
  const x = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k.x), opt) : keys[0].x;
  const y = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k.y), opt) : keys[0].y;
  const click = keys.filter((k) => k.click).find((k) => frame >= k.f && frame < k.f + 18);
  const t = click ? (frame - click.f) / 18 : 0;
  const down = click && frame - click.f < 5;
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 100, pointerEvents: "none" }}>
      {click && (
        <div
          style={{
            position: "absolute",
            left: -22 * (0.4 + t),
            top: -22 * (0.4 + t),
            width: 44 * (0.4 + t),
            height: 44 * (0.4 + t),
            borderRadius: "50%",
            background: `rgba(59,130,246,${0.45 * (1 - t)})`,
          }}
        />
      )}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        style={{ transform: `scale(${down ? 0.85 : 1})`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}
      >
        <path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#111" stroke="white" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
