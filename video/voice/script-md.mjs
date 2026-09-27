// Regenerates voice/SCRIPT.md from voice/script.json: node voice/script-md.mjs
import fs from "fs";
import path from "path";

const dir = path.dirname(new URL(import.meta.url).pathname);
const { scenes } = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
const out = [
  "# Voix off : script",
  "",
  "**Le plus simple : tout en un seul fichier.** Coller `voice/SCRIPT-full.txt` dans ElevenLabs (modèle v3 : `[pause]` entre les répliques, `[long pause]` entre les scènes, balises d'intention comme `[warmly]` déjà placées) et déposer le résultat sous `video/public/voice/full.mp3`.",
  "Avec l'API `with-timestamps`, déposer aussi la réponse JSON sous `full.json` : le découpage et le calage utilisent alors les timestamps exacts. Sinon, ils se font sur les pauses.",
  "",
  "Autre possibilité : un fichier par scène (`<scène>.mp3`, et `<scène>.json` pour les timestamps), avec les blocs ci-dessous.",
  "",
  "Ensuite : `node voice/timings.mjs` puis `npm run render`.",
  "",
  "Réglages conseillés : modèle Eleven v3, voix française chaleureuse et posée, stabilité « Natural ».",
  "",
];
let total = 0;
for (const [name, lines] of Object.entries(scenes)) {
  out.push(`## \`${name}.mp3\``, "", "```", lines.map((l) => l.text).join(" [pause] "), "```", "");
  total += lines.reduce((s, l) => s + l.text.length, 0);
}
out.push(`_${total} caractères au total, soit environ ${(total / 15 / 60).toFixed(1)} min de voix._`);
fs.writeFileSync(path.join(dir, "SCRIPT.md"), out.join("\n") + "\n");

// Whole narration in one go: short pauses between lines, longer ones between scenes
const full = Object.values(scenes)
  .map((lines) => lines.map((l) => l.text).join(" [pause] "))
  .join("\n\n[long pause]\n\n");
fs.writeFileSync(path.join(dir, "SCRIPT-full.txt"), full + "\n");
