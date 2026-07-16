import { loadEnv } from "./lib/env.mjs";
import { parseArgs, download, stamp, slug, kb } from "./lib/util.mjs";
import { stylePrompt } from "./lib/styles.mjs";
import * as kie from "./lib/kie.mjs";
import { resolve } from "node:path";

// Uso:
//   Ilustración cartoon: node scripts/generate-image.mjs --prompt "un músculo" --preset cartoon --ar 3:4
//   Recorte transparente: node scripts/generate-image.mjs --prompt "una pesa" --preset cutout
//   Editar imagen base:   node scripts/generate-image.mjs --prompt "recorta el sujeto" --edit https://url/foto.jpg
//   Opciones: --preset cartoon|cutout|none   --model nano-banana-pro|nano-banana|nano-banana-2   --out ruta.png
loadEnv();
const args = parseArgs(process.argv.slice(2));

const rawPrompt = args.prompt || args._.join(" ");
if (!rawPrompt) {
  console.error('Falta --prompt "descripción de la imagen"');
  process.exit(1);
}
const preset = args.preset || (args.edit ? "none" : "cartoon");
const prompt = stylePrompt(rawPrompt, preset);

const aspectRatio = args.ar || "3:4";
const model = args.model; // undefined => usa KIE_MODEL del .env
const imageInput = args.edit ? [args.edit] : undefined; // recortes / edición
const out = resolve(args.out || `assets/img/${stamp()}-${slug(prompt)}.png`);

console.log(`🎨 Generando imagen con Kie (${model || process.env.KIE_MODEL})…`);
if (imageInput) console.log(`   modo edición sobre: ${args.edit}`);

const url = await kie.generateImage({ prompt, aspectRatio, model, imageInput });
console.log(`   URL remota: ${url}`);

const { path, bytes } = await download(url, out);
console.log(`✅ Imagen lista: ${path} (${kb(bytes)})`);
