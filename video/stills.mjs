// Render a list of stills: node stills.mjs scene:frame scene:frame ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.BROWSER || null;
for (const arg of process.argv.slice(2)) {
  const [scene, frame] = arg.split(":");
  const id = scene === "all" ? "Presentation" : "scene-" + scene;
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  await renderStill({ composition, serveUrl, frame: Number(frame), output: `out/stills/${scene}-${frame}.png`, scale: 0.5, browserExecutable });
  console.log("ok", arg);
}
