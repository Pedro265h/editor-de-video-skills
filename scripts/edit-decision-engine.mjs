import { parseArgs } from "./lib/util.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

// Convierte el análisis + las imágenes descargadas en un plan de edición
// concreto que Remotion puede renderizar (todo en frames, sin ambigüedad).
// Escribe src/data/edit-plan.json, que es lo que lee Root.tsx.
//
// Uso:
//   node scripts/edit-decision-engine.mjs public/reel/mi-reel/analysis.json public/reel/mi-reel/images.json

const PUBLIC_DIR = resolve("public");

const args = parseArgs(process.argv.slice(2));
if (!args._[0] || !args._[1]) {
  console.error("Uso: node scripts/edit-decision-engine.mjs <analysis.json> <images.json>");
  process.exit(1);
}

const analysisPath = resolve(args._[0]);
const imagesPath = resolve(args._[1]);
for (const p of [analysisPath, imagesPath]) {
  if (!existsSync(p)) {
    console.error(`❌ No encuentro: ${p}`);
    process.exit(1);
  }
}

const data = JSON.parse(readFileSync(analysisPath, "utf8"));
const imagesData = JSON.parse(readFileSync(imagesPath, "utf8"));

const { analysis, video, videoSrc } = data;
const rec = analysis.editingRecommendations;
const fps = video.fps;

const images = imagesData.images.slice(0, Math.min(Number(rec.numImages) || 1, 3));
if (images.length === 0) {
  console.error("❌ No hay imágenes que insertar.");
  process.exit(1);
}

// Timing en frames. Cada imagen: fade in → visible → fade out.
const FADE = Math.round(0.3 * fps);
const HOLD = Math.round((images.length === 1 ? 2.0 : 1.5) * fps);
const perImage = FADE + HOLD + FADE;

const overlays = images.map((img, i) => ({
  // staticFile() resuelve desde public/, así que la ruta va relativa a esa carpeta.
  file: relative(PUBLIC_DIR, img.file),
  query: img.query,
  from: i * perImage,
  fadeIn: FADE,
  hold: HOLD,
  fadeOut: FADE,
  durationInFrames: perImage,
}));

const overlayEnd = overlays.length * perImage;
if (overlayEnd > video.durationInFrames) {
  console.error(
    `❌ Las ${images.length} imágenes ocupan ${(overlayEnd / fps).toFixed(1)}s pero el video ` +
      `dura ${video.durationSec.toFixed(1)}s. Usa menos imágenes.`
  );
  process.exit(1);
}

const plan = {
  slug: data.slug,
  videoPath: videoSrc,
  meta: {
    theme: analysis.theme,
    category: analysis.category,
    tone: analysis.tone,
    energy: analysis.energy,
  },
  strategy: { type: "minimalista-inicio", rationale: rec.minimalistRationale },
  composition: {
    fps,
    width: video.width,
    height: video.height,
    durationInFrames: video.durationInFrames,
  },
  overlays,
  transition: rec.transitionStyle === "corte" ? "corte" : "fade",
  audio: { preserveOriginal: true, addMusic: false },
  colorGrade: { apply: false },
  captions: { add: false },
};

// Copia junto al resto del material (trazabilidad) y en src/data (lo que lee Remotion).
writeFileSync(resolve(dirname(analysisPath), "edit-plan.json"), JSON.stringify(plan, null, 2));
writeFileSync(resolve("src/data/edit-plan.json"), JSON.stringify(plan, null, 2));

console.log(`✅ Plan de edición: src/data/edit-plan.json`);
console.log(`🖼️  ${overlays.length} imagen(es) en los primeros ${(overlayEnd / fps).toFixed(1)}s`);
console.log(`🎞️  ${video.durationInFrames} frames @ ${fps} fps (${video.durationSec.toFixed(1)}s)`);
