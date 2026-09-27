// Scene retiming: animations are authored on a fixed timeline ("visual" frames).
// When a voice-over exists, the scene is stretched to the audio and the visual
// timeline is remapped so that each cue lands on its spoken line.
import React, { createContext, useContext } from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import script from "../voice/script.json";
import timings from "./voice-timings.json";

type Timing = { file: string; duration: number; speechEnd: number; cues: number[] };
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
};

// Computes the final duration of a scene and its frame remapping
export const planScene = (name: string, base: number): Plan => {
  const t = (timings as Record<string, Timing>)[name];
  const lines = ((script as { scenes: Record<string, Line[]> }).scenes[name] || []) as Line[];
  if (!t || !lines.length) return { duration: base, remap: (f) => f };

  const audioAt = t.cues.map((c) => LEAD + c * FPS);
  const lastV = lines[lines.length - 1].at;
  const speechEnd = LEAD + t.speechEnd * FPS;
  // keep at least 80% of the authored time after the last cue, and the whole voice
  const duration = Math.ceil(
    Math.max(speechEnd + TAIL, audioAt[audioAt.length - 1] + (base - lastV) * 0.8, LEAD + t.duration * FPS),
  );

  const input = [0];
  const output = [0];
  lines.forEach((l, i) => {
    const a = audioAt[i];
    if (a > input[input.length - 1] + 1 && l.at >= output[output.length - 1]) {
      input.push(a);
      output.push(l.at);
    }
  });
  input.push(Math.max(duration, input[input.length - 1] + 1));
  output.push(base);

  return {
    duration,
    remap: (f) => interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    audio: { src: t.file, from: LEAD },
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
