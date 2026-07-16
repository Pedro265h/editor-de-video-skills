import { loadEnv, need } from "./lib/env.mjs";
import { parseArgs } from "./lib/util.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Analiza la transcripción con Claude y decide cómo editar el reel.
// Salida: analysis.json junto a la transcripción.
//
// Uso:
//   node scripts/analyze-video.mjs work/mi-reel/transcript.json

loadEnv();
const args = parseArgs(process.argv.slice(2));

const transcriptPath = resolve(args._[0] || "");
if (!args._[0]) {
  console.error("Uso: node scripts/analyze-video.mjs <work/…/transcript.json>");
  process.exit(1);
}
if (!existsSync(transcriptPath)) {
  console.error(`❌ No encuentro la transcripción: ${transcriptPath}`);
  process.exit(1);
}

const apiKey = need("ANTHROPIC_API_KEY");
const transcript = JSON.parse(readFileSync(transcriptPath, "utf8"));

console.log("🧠 Analizando temática y estilo de edición…");

const prompt = `Analiza este reel y decide cómo editarlo. El estilo de edición es MINIMALISTA:
solo se insertan 1-3 imágenes al INICIO del video, nada más. Sin efectos innecesarios.

DURACIÓN: ${transcript.video.durationSec.toFixed(1)} segundos

TRANSCRIPCIÓN:
"""
${transcript.text}
"""

Responde SOLO con un JSON válido (sin markdown, sin explicaciones) con esta forma exacta:
{
  "theme": "tema principal, 1-3 palabras",
  "category": "educativo|viral|tutorial|lifestyle|noticia|humor|otro",
  "tone": "energético|calmado|informativo|satírico|inspirador",
  "energy": 7,
  "pacing": "rápido|moderado|lento",
  "imageKeywords": ["búsqueda concreta 1", "búsqueda concreta 2", "búsqueda concreta 3"],
  "editingRecommendations": {
    "numImages": 2,
    "imageStyle": "foto-real|cartoon|infografía|minimalista",
    "transitionStyle": "fade|corte",
    "musicNeeded": false,
    "musicGenre": null,
    "colorGradeNeeded": false,
    "suggestedColorTone": "cálido|frío|neutral",
    "captionsNeeded": false,
    "minimalistRationale": "por qué esta edición es la correcta para este video"
  },
  "contentAnalysis": "análisis breve de cómo abordar la edición"
}

Reglas:
- "imageKeywords": entre 3 y 5 búsquedas CONCRETAS y visuales para Google Images, en español.
  Deben ilustrar el tema del video. Nada abstracto.
- "numImages": entre 1 y 3. Si el video ya es visualmente rico o muy corto, usa 1.`;

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  }),
});

if (!res.ok) {
  console.error(`❌ Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

const body = await res.json();
const raw = body.content?.find((c) => c.type === "text")?.text ?? "";
const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/```\s*$/, "").trim();

let analysis;
try {
  analysis = JSON.parse(cleaned);
} catch {
  console.error(`❌ Claude no devolvió JSON válido:\n${cleaned.slice(0, 300)}`);
  process.exit(1);
}

const result = {
  transcriptPath,
  fileName: transcript.fileName,
  video: transcript.video,
  analysis,
};

const outPath = resolve(dirname(transcriptPath), "analysis.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

const rec = analysis.editingRecommendations;
console.log(`\n✅ Análisis: ${outPath}`);
console.log(`📊 Tema: ${analysis.theme} (${analysis.category}, tono ${analysis.tone})`);
console.log(`🎨 Plan: ${rec.numImages} imagen(es) estilo ${rec.imageStyle}`);
console.log(`🔎 Búsquedas: ${analysis.imageKeywords.join(", ")}`);
