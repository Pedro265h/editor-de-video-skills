import { loadEnv } from "./lib/env.mjs";
import { parseArgs, ensureDir, kb } from "./lib/util.mjs";
import { generateMusic } from "./lib/music.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Música de fondo con Suno vía Kie AI.
//   node scripts/generate-music.mjs --prompt "energetic instrumental, 120 BPM" --out public/media/short/music.mp3
loadEnv();
const args = parseArgs(process.argv.slice(2));

const prompt =
  args.prompt || args._.join(" ") ||
  "energetic upbeat motivational documentary background instrumental, driving drums, positive, modern, no vocals, 120 BPM";
const out = resolve(args.out || "public/media/short/music.mp3");

console.log("🎵 Pidiendo música a Suno (vía Kie)… (~1-2 min)");
const url = await generateMusic({ prompt, model: args.model || "V4_5", instrumental: !args.vocals });
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
ensureDir(resolve(out, ".."));
writeFileSync(out, buf);
console.log(`✅ Música: ${out} (${kb(buf.length)})`);
