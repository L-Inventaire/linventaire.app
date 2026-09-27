// Measures the voice-over files and writes src/voice-timings.json.
//
//   node voice/timings.mjs
//
// For every scene of voice/script.json, looks for public/voice/<scene>.(mp3|wav).
// Line start times come from, in order of preference:
//   1. public/voice/<scene>.json: an ElevenLabs "with-timestamps" response
//      (or just its `alignment` object) => exact character timings;
//   2. silence detection: the pauses between lines of the scene;
//   3. a split proportional to the number of characters (fallback).
import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = JSON.parse(fs.readFileSync(path.join(root, "voice/script.json"), "utf8")).scenes;
const voiceDir = path.join(root, "public/voice");
const remotion = path.join(root, "node_modules/.bin/remotion");

const duration = (file) =>
  parseFloat(
    execFileSync(remotion, ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );

const silences = (file) => {
  const out = spawnSync(remotion, ["ffmpeg", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.3", "-f", "null", "-"], {
    cwd: root,
    encoding: "utf8",
  });
  const log = out.stderr + out.stdout;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  return starts.map((s, i) => ({ start: s, end: ends[i] ?? Infinity }));
};

const fromAlignment = (json, lines) => {
  const a = json.alignment || json.normalized_alignment || json;
  const chars = a.characters.join("");
  const times = a.character_start_times_seconds;
  const ends = a.character_end_times_seconds;
  let from = 0;
  const cues = lines.map((l) => {
    const probe = l.text.replace(/^[.\s]+/, "").slice(0, 12);
    const idx = chars.indexOf(probe, from);
    const i = idx >= 0 ? idx : from;
    from = i + 1;
    return times[i];
  });
  return { cues, speechEnd: ends[ends.length - 1] };
};

const fromSilences = (file, dur, lines) => {
  const sil = silences(file);
  const lead = sil.find((s) => s.start < 0.05)?.end ?? 0;
  const trail = sil.find((s) => s.end === Infinity || s.end >= dur - 0.05)?.start ?? dur;
  const inner = sil.filter((s) => s.start > lead + 0.1 && s.end < trail - 0.1);
  const splits = [...inner]
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, lines.length - 1)
    .sort((a, b) => a.start - b.start);
  if (splits.length < lines.length - 1) return null;
  return { cues: [lead, ...splits.map((s) => s.end)], speechEnd: trail };
};

const proportional = (dur, lines) => {
  const total = lines.reduce((s, l) => s + l.text.length, 0);
  let acc = 0;
  const cues = lines.map((l) => {
    const t = (acc / total) * dur;
    acc += l.text.length;
    return t;
  });
  return { cues, speechEnd: dur };
};

const result = {};
for (const [scene, lines] of Object.entries(script)) {
  const file = ["mp3", "wav"].map((e) => path.join(voiceDir, `${scene}.${e}`)).find((f) => fs.existsSync(f));
  if (!file) {
    console.log(`- ${scene}: no audio`);
    continue;
  }
  const dur = duration(file);
  const alignFile = path.join(voiceDir, `${scene}.json`);
  let t = null,
    method = "";
  if (fs.existsSync(alignFile)) {
    t = fromAlignment(JSON.parse(fs.readFileSync(alignFile, "utf8")), lines);
    method = "alignment";
  }
  if (!t && lines.length > 1) {
    t = fromSilences(file, dur, lines);
    method = "silences";
  }
  if (!t) {
    t = lines.length === 1 ? { cues: [silences(file).find((s) => s.start < 0.05)?.end ?? 0], speechEnd: dur } : proportional(dur, lines);
    method = lines.length === 1 ? "single line" : "proportional";
  }
  result[scene] = {
    file: "voice/" + path.basename(file),
    duration: +dur.toFixed(3),
    speechEnd: +Math.min(dur, t.speechEnd).toFixed(3),
    cues: t.cues.map((c) => +c.toFixed(3)),
  };
  console.log(`- ${scene}: ${dur.toFixed(2)} s, lines at ${result[scene].cues.join(" / ")} s (${method})`);
}
fs.writeFileSync(path.join(root, "src/voice-timings.json"), JSON.stringify(result, null, 2) + "\n");
console.log("written src/voice-timings.json");
