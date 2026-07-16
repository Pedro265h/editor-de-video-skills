import { loadEnv, need } from "./lib/env.mjs";
import { parseArgs, ensureDir, stamp, slug, kb } from "./lib/util.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Uso:
//   node scripts/generate-voice.mjs --text "Hola, esto es una prueba"
//   node scripts/generate-voice.mjs --text "..." --out assets/audio/intro.mp3 --voice <voiceId>
loadEnv();
const args = parseArgs(process.argv.slice(2));

const text = args.text || args._.join(" ") || "Hola, esta es una prueba de voz para el canal.";
const model = args.model || process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const key = need("ELEVENLABS_API_KEY");

async function resolveVoice() {
  if (args.voice) return args.voice;
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  const j = await res.json();
  const v = (j.voices || [])[0];
  if (!v) throw new Error("No hay voces disponibles en tu cuenta de ElevenLabs");
  console.log(`ℹ️  Usando primera voz de la cuenta: ${v.name} (${v.voice_id})`);
  return v.voice_id;
}

const voiceId = await resolveVoice();
const out = resolve(args.out || `assets/audio/voz-${stamp()}-${slug(text)}.mp3`);

console.log(`🎙️  Generando voz (${model})…`);
const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  }
);

if (!res.ok) {
  throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

const buf = Buffer.from(await res.arrayBuffer());
ensureDir(resolve(out, ".."));
writeFileSync(out, buf);
console.log(`✅ Voz lista: ${out} (${kb(buf.length)})`);
