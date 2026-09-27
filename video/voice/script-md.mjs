// Regenerates voice/SCRIPT.md from voice/script.json: node voice/script-md.mjs
import fs from "fs";
import path from "path";

const dir = path.dirname(new URL(import.meta.url).pathname);
const { scenes } = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
const out = [
  "# Voix off : script",
  "",
  "**Le plus simple : tout en un seul fichier.** Coller `voice/SCRIPT-full.txt` dans ElevenLabs (pauses déjà incluses : 0,7 s entre répliques, 1,5 s entre scènes) et déposer le résultat sous `video/public/voice/full.mp3`.",
  "Avec l'API `with-timestamps`, déposer aussi la réponse JSON sous `full.json` : le découpage et le calage utilisent alors les timestamps exacts. Sinon, ils se font sur les pauses.",
  "",
  "Autre possibilité : un fichier par scène (`<scène>.mp3`, et `<scène>.json` pour les timestamps), avec les blocs ci-dessous.",
  "",
  "Ensuite : `node voice/timings.mjs` puis `npm run render`.",
  "",
  "Réglages conseillés : modèle `eleven_multilingual_v2`, voix française chaleureuse et posée, stabilité ~50 %.",
  "",
];
let total = 0;
for (const [name, lines] of Object.entries(scenes)) {
  out.push(`## \`${name}.mp3\``, "", "```", lines.map((l) => l.text).join(' <break time="0.7s" /> '), "```", "");
  total += lines.reduce((s, l) => s + l.text.length, 0);
}
out.push(`_${total} caractères au total, soit environ ${(total / 15 / 60).toFixed(1)} min de voix._`);
fs.writeFileSync(path.join(dir, "SCRIPT.md"), out.join("\n") + "\n");

// Whole narration in one go: short pauses between lines, longer ones between scenes
const full = Object.values(scenes)
  .map((lines) => lines.map((l) => l.text).join(' <break time="0.7s" /> '))
  .join('\n<break time="1.5s" />\n');
fs.writeFileSync(path.join(dir, "SCRIPT-full.txt"), full + "\n");
