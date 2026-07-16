import { loadEnv, need } from "./lib/env.mjs";
import { parseArgs, ensureDir, slug, kb } from "./lib/util.mjs";
import { probe, extractAudio } from "./lib/video.mjs";
import { readFileSync, writeFileSync, statSync, existsSync, copyFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

// Transcribe un reel con OpenAI Whisper.
// Extrae primero el audio con ffmpeg (mp3 mono 16 kHz) para no chocar con el
// límite de 25 MB de la API, y copia el video a public/reel/<slug>/ para que
// Remotion pueda servirlo con staticFile().
//
// Uso:
//   node scripts/transcribe-video.mjs ./videos/mi-reel.mp4

const MAX_BYTES = 25 * 1024 * 1024;

loadEnv();
const args = parseArgs(process.argv.slice(2));

if (!args._[0]) {
  console.error("Uso: node scripts/transcribe-video.mjs <video.mp4>");
  process.exit(1);
}
const videoPath = resolve(args._[0]);
if (!existsSync(videoPath)) {
  console.error(`❌ No encuentro el video: ${videoPath}`);
  process.exit(1);
}

const apiKey = need("OPENAI_API_KEY");
const name = slug(basename(videoPath, extname(videoPath)));

// Todo el material del reel vive bajo public/ para que staticFile() lo encuentre.
const workDir = resolve(`public/reel/${name}`);
ensureDir(workDir);

console.log(`🎬 Transcribiendo ${basename(videoPath)}…`);

const meta = await probe(videoPath);
console.log(`   ${meta.width}x${meta.height} · ${meta.durationSec.toFixed(1)}s · ${meta.fps} fps`);

// Copia local con nombre estable; la ruta que usa Remotion es relativa a public/.
const sourceExt = extname(videoPath) || ".mp4";
const sourcePath = resolve(workDir, `source${sourceExt}`);
copyFileSync(videoPath, sourcePath);

const audioPath = resolve(workDir, "audio.mp3");
console.log("🔊 Extrayendo audio…");
await extractAudio(videoPath, audioPath);

const bytes = statSync(audioPath).size;
console.log(`   ${kb(bytes)}`);
if (bytes > MAX_BYTES) {
  console.error(
    `❌ El audio pesa ${kb(bytes)} y Whisper acepta máximo 25 MB.\n` +
      `   El video dura ${(meta.durationSec / 60).toFixed(1)} min — recórtalo antes.`
  );
  process.exit(1);
}

const form = new FormData();
form.append("file", new Blob([readFileSync(audioPath)], { type: "audio/mpeg" }), "audio.mp3");
form.append("model", "whisper-1");
form.append("language", "es");
form.append("response_format", "verbose_json");

const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: form,
});

if (!res.ok) {
  console.error(`❌ Whisper ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

const data = await res.json();

const result = {
  originalPath: videoPath,
  fileName: basename(videoPath),
  slug: name,
  // Ruta relativa a public/ — es lo que consume staticFile() en Remotion.
  videoSrc: `reel/${name}/source${sourceExt}`,
  video: meta,
  language: "es",
  text: data.text,
  segments: (data.segments || []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  })),
};

const outPath = resolve(workDir, "transcript.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`\n✅ Transcripción: ${outPath}`);
console.log(`📄 "${result.text.slice(0, 120).trim()}${result.text.length > 120 ? "…" : ""}"`);
console.log(`🗣️  ${result.segments.length} segmentos`);
