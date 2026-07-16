import { loadEnv, need } from "./lib/env.mjs";
import { parseArgs, download, ensureDir, slug, kb } from "./lib/util.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Descarga las imágenes que pidió el análisis (Google Images vía Apify).
// Mismo actor y misma llamada que scripts/fetch-photos.mjs.
//
// Uso:
//   node scripts/fetch-reel-images.mjs work/mi-reel/analysis.json

loadEnv();
const args = parseArgs(process.argv.slice(2));

const analysisPath = resolve(args._[0] || "");
if (!args._[0]) {
  console.error("Uso: node scripts/fetch-reel-images.mjs <work/…/analysis.json>");
  process.exit(1);
}
if (!existsSync(analysisPath)) {
  console.error(`❌ No encuentro el análisis: ${analysisPath}`);
  process.exit(1);
}

const token = need("APIFY_TOKEN");
const actor = process.env.APIFY_IMAGES_ACTOR || "automation-lab~google-images-scraper";

const data = JSON.parse(readFileSync(analysisPath, "utf8"));
const { imageKeywords, editingRecommendations: rec } = data.analysis;

// Pide una imagen extra por si alguna descarga falla, pero sin pasarse:
// el actor cobra por resultado.
const wanted = Math.min(Number(rec.numImages) || 1, 3);
const perQuery = 2;
const queries = imageKeywords.slice(0, wanted + 1);

const outDir = resolve(dirname(analysisPath), "images");
ensureDir(outDir);

console.log(`🔎 Buscando imágenes para: ${queries.join(", ")}`);

const input = {
  queries,
  maxResultsPerQuery: perQuery,
  language: process.env.APIFY_LANGUAGE || "es",
  country: process.env.APIFY_COUNTRY || "mx",
  safeSearch: "moderate",
};
if (rec.imageStyle === "foto-real") input.imageType = "photo";
if (rec.imageStyle === "cartoon") input.imageType = "clipart";
input.imageSize = "large";

const res = await fetch(
  `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }
);

if (!res.ok) {
  console.error(`❌ Apify ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

const items = await res.json();
if (!Array.isArray(items) || items.length === 0) {
  console.error("❌ Apify no devolvió imágenes. Revisa tus créditos o las búsquedas.");
  process.exit(1);
}

const pickUrl = (it) => it.imageUrl || it.image || it.original || it.contentUrl || it.url;

// Una imagen por búsqueda, para que no salgan tres variantes de lo mismo.
const byQuery = new Map();
for (const it of items) {
  const q = it.searchQuery || it.query || queries[0];
  if (!byQuery.has(q)) byQuery.set(q, []);
  byQuery.get(q).push(it);
}

const images = [];
for (const [query, candidates] of byQuery) {
  if (images.length >= wanted) break;
  for (const it of candidates) {
    const url = pickUrl(it);
    if (!url || !/^https?:\/\//.test(url)) continue;
    const ext = (url.split("?")[0].match(/\.(jpe?g|png|webp)$/i) || [, "jpg"])[1].toLowerCase();
    const file = resolve(outDir, `${String(images.length + 1).padStart(2, "0")}-${slug(query, 20)}.${ext}`);
    try {
      const { bytes } = await download(url, file);
      images.push({ query, file, url, title: it.title || null });
      console.log(`  ✅ ${images.length}. ${slug(query, 20)} (${kb(bytes)})`);
      break;
    } catch (e) {
      console.log(`  ⚠️  saltada (${e.message.slice(0, 40)})`);
    }
  }
}

if (images.length === 0) {
  console.error("❌ No se pudo descargar ninguna imagen.");
  process.exit(1);
}

const result = { analysisPath, imageStyle: rec.imageStyle, wanted, images, outDir };
const outPath = resolve(dirname(analysisPath), "images.json");
writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`\n✅ ${images.length}/${wanted} imágenes en ${outDir}`);
console.log(`💾 ${outPath}`);
