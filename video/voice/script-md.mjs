// Regenerates voice/SCRIPT.md from voice/script.json: node voice/script-md.mjs
import fs from "fs";
import path from "path";

const dir = path.dirname(new URL(import.meta.url).pathname);
const { scenes } = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
const out = [
  "# Voix off : script",
  "",
  "Un fichier audio **par scène**, à déposer dans `video/public/voice/` sous le nom indiqué (mp3 ou wav).",
  'Quand une scène a plusieurs répliques, laisser une **pause d\'environ 0,6 s** entre elles : c\'est ce qui permet de caler chaque réplique sur l\'animation. Avec ElevenLabs, garder les `<break time="0.7s" />`.',
  "",
  "Si ElevenLabs fournit les timestamps (API `with-timestamps`), déposer aussi la réponse JSON sous `<scène>.json` : ils seront utilisés tels quels.",
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
