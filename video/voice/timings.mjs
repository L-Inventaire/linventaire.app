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

// --- Word timestamps (ElevenLabs speech-to-text export: { words: [{ type, text, start, end }] })
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9']+/g, " ")
    .split(" ")
    .map((w) => w.replace(/^(?:qu|[a-z])'/, "")) // d'installation -> installation
    .filter(Boolean);
const same = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));

// Aligns the script on the transcript (longest common subsequence, tolerant to
// small wording differences) and returns the start time of every line.
const alignWords = (lines, words) => {
  const script = lines.flatMap((l, li) => norm(spoken(l.text)).map((w) => ({ w, li })));
  const heard = words
    .filter((x) => x.type === "word")
    .flatMap((x) => norm(x.text).map((w) => ({ w, start: x.start, end: x.end })));
  const n = script.length,
    m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = same(script[i].w, heard[j].w) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const match = new Array(n).fill(-1);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (same(script[i].w, heard[j].w) && dp[i][j] === dp[i + 1][j + 1] + 1) match[i++] = j++;
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const cues = lines.map((_, li) => {
    const i = script.findIndex((s, k) => s.li === li && match[k] >= 0);
    if (i < 0) throw new Error(`line ${li + 1} ("${lines[li].text.slice(0, 30)}") not found in the transcript`);
    return heard[match[i]].start;
  });
  // extra sync points: a given word of a line lands on a given animation frame
  const points = [];
  lines.forEach((l, li) => {
    points.push({ t: cues[li], at: l.at });
    let from = script.findIndex((s) => s.li === li);
    for (const mk of l.marks || []) {
      const w = norm(mk.word)[0];
      const k = script.findIndex((s, i) => i >= from && s.li === li && same(s.w, w));
      if (k < 0 || match[k] < 0) {
        console.warn(`  mark "${mk.word}" not found`);
        continue;
      }
      points.push({ t: heard[match[k]].start, at: mk.at });
      from = k + 1;
    }
  });
  // when the voice is talking (merged word intervals), for the music ducking
  const speech = [];
  for (const h of heard) {
    const prev = speech[speech.length - 1];
    if (prev && h.start - prev[1] < 1.2) prev[1] = Math.max(prev[1], h.end);
    else speech.push([h.start, h.end]);
  }
  const last = match.filter((j) => j >= 0).pop();
  return { cues, points, speech, speechEnd: heard[last].end, matched: match.filter((j) => j >= 0).length / n };
};

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
  let fullWords = null;
  if (fs.existsSync(fullAlign) && JSON.parse(fs.readFileSync(fullAlign, "utf8")).words) {
    fullWords = JSON.parse(fs.readFileSync(fullAlign, "utf8")).words;
    const all = names.flatMap((n) => script[n]);
    const { cues } = alignWords(all, fullWords);
    let k = 0;
    bounds = names.map((n) => {
      const b = { t: cues[k] };
      k += script[n].length;
      return b;
    });
    console.log("full narration: split with word timestamps");
  } else if (fs.existsSync(fullAlign)) {
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
    if (fullWords) {
      // per-scene word timestamps, shifted to the start of the cut
      const sub = fullWords
        .filter((w) => w.start >= from && w.start < to)
        .map((w) => ({ ...w, start: w.start - from, end: w.end - from }));
      fs.writeFileSync(path.join(voiceDir, `${n}.json`), JSON.stringify({ words: sub }));
    }
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
    const j = JSON.parse(fs.readFileSync(alignFile, "utf8"));
    if (j.words) {
      t = alignWords(lines, j.words);
      method = `word timestamps, ${Math.round(t.matched * 100)}% of the words matched`;
    } else {
      t = fromAlignment(j, lines);
      method = "alignment";
    }
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
    speech: (t.speech || [[t.cues[0], t.speechEnd]]).map(([a, b]) => [+a.toFixed(2), +b.toFixed(2)]),
    points: (t.points || t.cues.map((c, i) => ({ t: c, at: lines[i].at }))).map((p) => ({ t: +p.t.toFixed(3), at: p.at })),
  };
  console.log(`- ${scene}: ${dur.toFixed(2)} s, lines at ${result[scene].cues.join(" / ")} s (${method})`);
}
fs.writeFileSync(path.join(root, "src/voice-timings.json"), JSON.stringify(result, null, 2) + "\n");
console.log("written src/voice-timings.json");
