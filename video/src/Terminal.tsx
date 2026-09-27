import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, mono } from "./theme";

export type Line = { cmd: string; comment?: string; at: number };

const CHARS_PER_FRAME = 1.2;

// A fake terminal that types each command, starting at frame `at`
export const Terminal: React.FC<{ lines: Line[]; title?: string }> = ({
  lines,
  title = "terminal",
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        background: "#020617",
        border: `2px solid ${colors.border}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "16px 22px",
          background: colors.bgSoft,
        }}
      >
        {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
          <div
            key={c}
            style={{ width: 16, height: 16, borderRadius: 8, background: c }}
          />
        ))}
        <div style={{ marginLeft: 16, color: colors.muted, fontSize: 22 }}>
          {title}
        </div>
      </div>
      <div style={{ padding: 36, fontFamily: mono, fontSize: 34, lineHeight: 1.7 }}>
        {lines.map((l, i) => {
          if (frame < l.at) return null;
          const typed = Math.floor((frame - l.at) * CHARS_PER_FRAME);
          const done = typed >= l.cmd.length;
          const next = lines[i + 1];
          const active = !next || frame < next.at;
          return (
            <div key={i}>
              {l.comment && (
                <div style={{ color: "#64748b" }}># {l.comment}</div>
              )}
              <span style={{ color: colors.accent2 }}>$ </span>
              <span>{l.cmd.slice(0, typed)}</span>
              {active && (
                <span
                  style={{
                    opacity: done && Math.floor(frame / 15) % 2 ? 0 : 1,
                    background: colors.text,
                    marginLeft: 2,
                  }}
                >
                  &nbsp;
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
