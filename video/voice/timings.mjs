// Measures the voice-over files and writes src/voice-timings.json.
//
//   node voice/timings.mjs
//
// If public/voice/full.(mp3|wav) exists (the whole narration in one file), it is
// first split into one file per scene, using its ElevenLabs timestamps
// (public/voice/full.json) or, without them, the long pauses between scenes.
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

// Text as spoken: without [audio tags] nor leading dots
const spoken = (text) => text.replace(/\[[^\]]*\]\s*/g, "").replace(/^[.\s]+/, "");
// Start of a line to look for in the timestamps: spoken text before any inner tag
const probeOf = (text) =>
  text
    .replace(/^(\s*\[[^\]]*\]\s*)+/, "")
    .split("[")[0]
    .replace(/^[.\s]+/, "")
    .trim()
    .slice(0, 12);

const fromAlignment = (json, lines) => {
  const a = json.alignment || json.normalized_alignment || json;
  const chars = a.characters.join("");
  const times = a.character_start_times_seconds;
  const ends = a.character_end_times_seconds;
  let from = 0;
  const cues = lines.map((l) => {
    const probe = probeOf(l.text);
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
  const total = lines.reduce((s, l) => s + spoken(l.text).length, 0);
  let acc = 0;
  const cues = lines.map((l) => {
    const t = (acc / total) * dur;
    acc += spoken(l.text).length;
    return t;
  });
  return { cues, speechEnd: dur };
};

// --- 1. Split the full narration into scenes --------------------------------
const cut = (src, from, to, dest) =>
  execFileSync(remotion, ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ss", String(from), "-to", String(to), "-c:a", "pcm_s16le", dest], {
    cwd: root,
  });

const fullFile = ["mp3", "wav"].map((e) => path.join(voiceDir, `full.${e}`)).find((f) => fs.existsSync(f));
if (fullFile) {
  const names = Object.keys(script);
  const total = duration(fullFile);
  const fullAlign = path.join(voiceDir, "full.json");
  let bounds; // start time of each scene
  let align = null;
  if (fs.existsSync(fullAlign)) {
    const j = JSON.parse(fs.readFileSync(fullAlign, "utf8"));
    align = j.alignment || j.normalized_alignment || j;
    const chars = align.characters.join("");
    let from = 0;
    bounds = names.map((n) => {
      const probe = probeOf(script[n][0].text);
      const idx = chars.indexOf(probe, from);
      if (idx < 0) throw new Error(`"${probe}" not found in full.json alignment`);
      from = idx + 1;
      return { t: align.character_start_times_seconds[idx], idx };
    });
    console.log("full narration: split with timestamps");
  } else {
    const sil = silences(fullFile)
      .filter((x) => x.start > 0.1 && x.end < total - 0.1)
      .sort((a, b) => b.end - b.start - (a.end - a.start))
      .slice(0, names.length - 1)
      .sort((a, b) => a.start - b.start);
    if (sil.length < names.length - 1) throw new Error("not enough pauses to split the scenes");
    bounds = [{ t: 0 }, ...sil.map((x) => ({ t: x.end }))];
    console.log("full narration: split on the pauses between scenes");
  }
  names.forEach((n, i) => {
    const from = Math.max(0, bounds[i].t - 0.12);
    const to = i + 1 < names.length ? Math.max(from + 0.1, bounds[i + 1].t - 0.25) : total;
    for (const e of ["mp3", "wav", "json"]) fs.rmSync(path.join(voiceDir, `${n}.${e}`), { force: true });
    cut(fullFile, from, to, path.join(voiceDir, `${n}.wav`));
    if (align) {
      // per-scene alignment, shifted to the start of the cut
      const end = i + 1 < names.length ? bounds[i + 1].idx : align.characters.length;
      const sl = (a) => a.slice(bounds[i].idx, end);
      fs.writeFileSync(
        path.join(voiceDir, `${n}.json`),
        JSON.stringify({
          characters: sl(align.characters),
          character_start_times_seconds: sl(align.character_start_times_seconds).map((t) => t - from),
          character_end_times_seconds: sl(align.character_end_times_seconds).map((t) => t - from),
        }),
      );
    }
  });
}

// --- 2. Measure every scene --------------------------------------------------
const result = {};
for (const [scene, lines] of Object.entries(script)) {
  const file = ["wav", "mp3"].map((e) => path.join(voiceDir, `${scene}.${e}`)).find((f) => fs.existsSync(f));
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
