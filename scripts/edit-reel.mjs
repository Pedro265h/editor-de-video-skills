import { parseArgs, slug } from "./lib/util.mjs";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

// Orquesta el flujo completo de edición de un reel:
// transcribir → analizar → buscar imágenes → planear → renderizar.
//
// Uso:
//   npm run edit:reel -- ./videos/mi-reel.mp4

const args = parseArgs(process.argv.slice(2));
if (!args._[0]) {
  console.error("Uso: npm run edit:reel -- <video.mp4>");
  process.exit(1);
}

const videoPath = resolve(args._[0]);
if (!existsSync(videoPath)) {
  console.error(`❌ No encuentro el video: ${videoPath}`);
  process.exit(1);
}

const name = slug(basename(videoPath, extname(videoPath)));
const workDir = `public/reel/${name}`;
const outPath = `out/reel-editado-${name}.mp4`;

function step(label, bin, cmdArgs) {
  return new Promise((done, fail) => {
    console.log(`\n📍 ${label}\n`);
    const p = spawn(bin, cmdArgs, { stdio: "inherit" });
    p.on("error", (e) => fail(new Error(`${bin}: ${e.message}`)));
    p.on("close", (code) =>
      code === 0 ? done() : fail(new Error(`${label} falló (código ${code})`))
    );
  });
}

console.log("\n🎬 ═══════════════════════════════════");
console.log("   VIDEO-VOX EDITOR — Edición de Reels");
console.log("═══════════════════════════════════════");
console.log(`\n📹 ${basename(videoPath)}`);

try {
  await step("Paso 1/5 · Transcribiendo (Whisper)", "node", [
    "scripts/transcribe-video.mjs",
    videoPath,
  ]);

  await step("Paso 2/5 · Analizando temática (Claude)", "node", [
    "scripts/analyze-video.mjs",
    `${workDir}/transcript.json`,
  ]);

  await step("Paso 3/5 · Buscando imágenes (Apify)", "node", [
    "scripts/fetch-reel-images.mjs",
    `${workDir}/analysis.json`,
  ]);

  await step("Paso 4/5 · Generando plan de edición", "node", [
    "scripts/edit-decision-engine.mjs",
    `${workDir}/analysis.json`,
    `${workDir}/images.json`,
  ]);

  await step("Paso 5/5 · Renderizando (esto tarda unos minutos)", "npx", [
    "remotion",
    "render",
    "EditReel",
    outPath,
  ]);

  console.log("\n✅ ═══════════════════════════════════");
  console.log("   LISTO");
  console.log("═══════════════════════════════════════");
  console.log(`\n📹 Video editado: ${outPath}`);
  console.log(`📊 Análisis y plan: ${workDir}/\n`);
} catch (e) {
  console.error(`\n❌ ${e.message}\n`);
  process.exit(1);
}
