import { loadEnv, need } from "./lib/env.mjs";
import { parseArgs, download, ensureDir, slug, kb } from "./lib/util.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Fotos reales de Google Images (actor automation-lab/google-images-scraper).
// Pide el número EXACTO de imágenes (5-10) -> barato (~$0.065 por 5).
//
// Uso:
//   node scripts/fetch-photos.mjs --query "persona levantando pesas" --max 6
//   node scripts/fetch-photos.mjs --query "..." --max 8 --type photo --out assets/fotos/musculo
//   Filtros: --type photo|face|clipart|lineart  --color orange|transparent|...  --size large|medium|icon
//            --rights creative_commons|commercial   --country mx --language es
loadEnv();
const args = parseArgs(process.argv.slice(2));

const query = args.query || args._.join(" ");
if (!query) {
  console.error('Falta --query "qué buscar"');
  process.exit(1);
}
const max = Number(args.max || 6);
const token = need("APIFY_TOKEN");
const actor = process.env.APIFY_IMAGES_ACTOR || "automation-lab~google-images-scraper";
const outDir = resolve(args.out || `assets/fotos/${slug(query)}`);

const input = {
  queries: [query],
  maxResultsPerQuery: max, // el actor cobra por resultado real
  language: args.language || process.env.APIFY_LANGUAGE || "es",
  country: args.country || process.env.APIFY_COUNTRY || "mx",
  safeSearch: "moderate",
};
if (args.type) input.imageType = args.type; // face | photo | clipart | lineart | animated
if (args.color) input.imageColor = args.color; // orange | transparent | grayscale | ...
if (args.size) input.imageSize = args.size; // large | medium | icon
if (args.rights) input.usageRights = args.rights; // creative_commons | commercial

console.log(`🔎 Buscando ${max} imágenes de "${query}" (${input.language}/${input.country})…`);

const res = await fetch(
  `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }
);

if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 300)}`);

const items = await res.json();
if (!Array.isArray(items)) throw new Error(`Respuesta inesperada: ${JSON.stringify(items).slice(0, 200)}`);
if (items.length === 0) {
  console.log("⚠️  Sin resultados.");
  process.exit(0);
}

const pickUrl = (it) => it.imageUrl || it.image || it.original || it.contentUrl || it.url;

ensureDir(outDir);
const manifest = [];
let saved = 0;
for (const it of items) {
  if (saved >= max) break;
  const url = pickUrl(it);
  if (!url || !/^https?:\/\//.test(url)) continue;
  const ext = (url.split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i) || [, "jpg"])[1];
  const dest = resolve(outDir, `${String(saved + 1).padStart(2, "0")}.${ext.toLowerCase()}`);
  try {
    const { bytes } = await download(url, dest);
    saved++;
    manifest.push({
      file: dest,
      url,
      title: it.title || null,
      source: it.sourceUrl || it.origin || it.sourceDomain || null,
    });
    const label = (it.title || it.sourceDomain || "").slice(0, 45);
    console.log(`  ✅ ${saved}. ${dest} (${kb(bytes)})  ${label}`);
  } catch (e) {
    console.log(`  ⚠️  saltada (${e.message.slice(0, 40)})`);
  }
}

writeFileSync(resolve(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\n✅ ${saved} fotos en ${outDir}  (+ _manifest.json)`);
