// Render a handful of frames to PNG for a quick visual check.
// Usage: node tools/stills.mjs <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [outDir, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const composition = await selectComposition({ serveUrl, id: "Reel", browserExecutable });
for (const f of frames) {
  await renderStill({
    composition,
    serveUrl,
    frame: Number(f),
    output: path.join(outDir, `f${String(f).padStart(4, "0")}.png`),
    browserExecutable,
    scale: 0.5,
  });
  console.log("rendered", f);
}
