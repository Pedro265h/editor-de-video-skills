import { loadEnv, need } from "./lib/env.mjs";
import { ensureDir, kb } from "./lib/util.mjs";
import { stylePrompt } from "./lib/styles.mjs";
import { generateMusic } from "./lib/music.mjs";
import * as kie from "./lib/kie.mjs";
import { writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

// Genera TODOS los recursos del short a partir de input/scenes.json:
//   - voz por escena (ElevenLabs)
//   - ilustración cartoon por escena (Kie Nano Banana) + recorte transparente (rembg)
//   - música de fondo (Suno vía Kie)
// Mide la duración de cada audio y escribe src/data/short.json (lo lee Remotion).
loadEnv();

const FPS = 30;
const AR = "3:4";
const TAIL_S = 0.55;
const MIN_S = 2.6;

const INPUT = resolve(process.argv[2] || "input/scenes.json");
if (!existsSync(INPUT)) {
  console.error(`No encuentro ${INPUT}. Crea el guión (ver input/scenes.example.json).`);
  process.exit(1);
}
const brief = JSON.parse(readFileSync(INPUT, "utf8"));
const SCENES = brief.scenes || [];
if (!SCENES.length) {
  console.error("input/scenes.json no tiene escenas.");
  process.exit(1);
}

const OUT_DIR = resolve("public/media/short");
ensureDir(OUT_DIR);

const key = need("ELEVENLABS_API_KEY");
const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

function brandVoiceId() {
  try {
    const b = JSON.parse(readFileSync(resolve("src/brand.json"), "utf8"));
    return b?.voz?.voiceId || "";
  } catch {
    return "";
  }
}

async function resolveVoice() {
  // Prioridad: env > brand.json (autoconfigurado en el onboarding) > primera voz de la cuenta
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const fromBrand = brandVoiceId();
  if (fromBrand) return fromBrand;
  const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
  const v = ((await res.json()).voices || [])[0];
  if (!v) throw new Error("Sin voces en ElevenLabs");
  return v.voice_id;
}

async function makeVoice(voiceId, text, dest) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

async function makeImage(prompt, dest) {
  const url = await kie.generateImage({ prompt: stylePrompt(prompt, "cartoon"), aspectRatio: AR });
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

function audioDurationS(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]);
  return parseFloat(out.toString().trim());
}

console.log(`\n🎬 Generando recursos (${SCENES.length} escenas)…\n`);
const voiceIdP = resolveVoice();

const results = await Promise.all(
  SCENES.map(async (s, idx) => {
    const id = s.id || String(idx + 1).padStart(2, "0");
    const audioPath = resolve(OUT_DIR, `${id}-voz.mp3`);
    const imagePath = resolve(OUT_DIR, `${id}-img.png`);
    const cutPath = resolve(OUT_DIR, `${id}-cut.png`);
    const [aBytes] = await Promise.all([
      existsSync(audioPath)
        ? Promise.resolve(statSync(audioPath).size)
        : voiceIdP.then((vid) => makeVoice(vid, s.narration, audioPath)),
      existsSync(imagePath) ? Promise.resolve(0) : makeImage(s.imagePrompt, imagePath),
    ]);
    if (!existsSync(cutPath)) {
      execFileSync("python3", ["scripts/cutout.py", imagePath, cutPath], { stdio: "inherit" });
    }
    const dur = audioDurationS(audioPath);
    const durationInFrames = Math.max(Math.ceil(MIN_S * FPS), Math.ceil((dur + TAIL_S) * FPS));
    console.log(`  ✅ Escena ${id}: voz ${kb(aBytes)} (${dur.toFixed(1)}s) · ${durationInFrames}f`);
    return {
      id,
      keyword: s.keyword,
      narration: s.narration,
      from: s.from || "bottom",
      audio: `media/short/${id}-voz.mp3`,
      image: `media/short/${id}-cut.png`,
      durationInFrames,
    };
  })
);

// Música de fondo (una sola)
const musicPath = resolve(OUT_DIR, "music.mp3");
if (!existsSync(musicPath)) {
  console.log("\n🎵 Generando música (Suno vía Kie)… (~1-2 min)");
  const url = await generateMusic({
    prompt:
      brief.musicPrompt ||
      "energetic upbeat motivational documentary background instrumental, positive, modern, no vocals, 120 BPM",
  });
  writeFileSync(musicPath, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log("   ✅ music.mp3");
}

const data = {
  fps: FPS,
  width: 1080,
  height: 1920,
  title: brief.title || "video",
  totalFrames: results.reduce((a, r) => a + r.durationInFrames, 0),
  scenes: results,
};
ensureDir(resolve("src/data"));
writeFileSync(resolve("src/data/short.json"), JSON.stringify(data, null, 2));

const totalS = (data.totalFrames / FPS).toFixed(1);
console.log(`\n✨ Listo. ${results.length} escenas · ~${totalS}s. Ahora: npm run render`);
