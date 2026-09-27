// Scene retiming: animations are authored on a fixed timeline ("visual" frames).
// When a voice-over exists, the scene is stretched to the audio and the visual
// timeline is remapped so that each cue lands on its spoken line.
import React, { createContext, useContext } from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import script from "../voice/script.json";
import timings from "./voice-timings.json";

type Timing = { file: string; duration: number; speechEnd: number; cues: number[]; points?: { t: number; at: number }[]; speech?: number[][] };
type Line = { at: number; text: string };

const Ctx = createContext<{ remap: (f: number) => number; duration: number } | null>(null);

// Current frame on the authored timeline of the scene
export const useSceneFrame = () => {
  const frame = useCurrentFrame();
  const ctx = useContext(Ctx);
  return ctx ? ctx.remap(frame) : frame;
};

// Same as useVideoConfig, with the authored duration of the scene
export const useSceneConfig = () => {
  const cfg = useVideoConfig();
  const ctx = useContext(Ctx);
  return ctx ? { ...cfg, durationInFrames: ctx.duration } : cfg;
};

const FPS = 30;
const LEAD = 6; // frames of silence before the voice starts in a scene
const TAIL = 14; // frames kept after the last word

export type Plan = {
  duration: number; // final duration in frames
  remap: (f: number) => number;
  audio?: { src: string; from: number };
  speech: [number, number][]; // frames of the scene where the voice talks
};

// Computes the final duration of a scene and its frame remapping
export const planScene = (name: string, base: number): Plan => {
  const t = (timings as Record<string, Timing>)[name];
  const lines = ((script as { scenes: Record<string, Line[]> }).scenes[name] || []) as Line[];
  if (!t || !lines.length) return { duration: base, remap: (f) => f, speech: [] };

  // sync points: audio time -> authored frame (line starts, plus marked words)
  const points = (t.points || t.cues.map((c, i) => ({ t: c, at: lines[i]?.at ?? 0 }))).map((p) => ({
    a: LEAD + p.t * FPS,
    v: p.at,
  }));
  const lastPoint = points[points.length - 1];
  const speechEnd = LEAD + t.speechEnd * FPS;
  // keep at least 80% of the authored time after the last point, and the whole voice
  const duration = Math.ceil(
    Math.max(speechEnd + TAIL, lastPoint.a + (base - lastPoint.v) * 0.8, LEAD + t.duration * FPS),
  );

  const input = [0];
  const output = [0];
  for (const p of points) {
    if (p.a > input[input.length - 1] + 1 && p.v > output[output.length - 1]) {
      input.push(p.a);
      output.push(p.v);
    }
  }
  input.push(Math.max(duration, input[input.length - 1] + 1));
  output.push(base);

  return {
    duration,
    remap: (f) => interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    audio: { src: t.file, from: LEAD },
    speech: (t.speech || []).map(([a, b]) => [LEAD + a * FPS, LEAD + b * FPS] as [number, number]),
  };
};

export const TimedScene: React.FC<{ plan: Plan; base: number; children: React.ReactNode }> = ({
  plan,
  base,
  children,
}) => (
  <Ctx.Provider value={{ remap: plan.remap, duration: base }}>
    {children}
    {plan.audio && (
      <Sequence from={plan.audio.from} layout="none">
        <Audio src={staticFile(plan.audio.src)} />
      </Sequence>
    )}
  </Ctx.Provider>
);

// Background music, slowed down slightly if needed so that it ends with the
// video, and ducked under the voice.
export const Music: React.FC<{ src: string; musicSeconds: number; plans: { plan: Plan }[] }> = ({
  src,
  musicSeconds,
  plans,
}) => {
  const { durationInFrames } = useVideoConfig();
  const speech: [number, number][] = [];
  let offset = 0;
  for (const { plan } of plans) {
    plan.speech.forEach(([a, b]) => speech.push([offset + a, offset + b]));
    offset += plan.duration;
  }
  const HIGH = 0.3; // music alone
  const LOW = 0.07; // under the voice
  const RAMP = 9; // frames
  const volume = (f: number) => {
    let duck = 0;
    for (const [a, b] of speech) {
      const d = f < a ? a - f : f > b ? f - b : 0;
      duck = Math.max(duck, 1 - Math.min(1, d / RAMP));
    }
    const fade = interpolate(f, [0, 20, durationInFrames - 60, durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (HIGH - (HIGH - LOW) * duck) * fade;
  };
  const rate = Math.min(1, Math.max(0.88, musicSeconds / (durationInFrames / FPS)));
  return <Audio src={staticFile(src)} volume={volume} playbackRate={rate} />;
};
