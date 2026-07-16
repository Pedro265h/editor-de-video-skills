import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Parser mínimo de flags: --key value  /  --flag (booleano). Positional en args._ */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

/** Descarga una URL a un archivo local. */
export async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Descarga falló ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  ensureDir(dirname(destPath));
  writeFileSync(destPath, buf);
  return { path: destPath, bytes: buf.length };
}

/** Timestamp compacto para nombres de archivo: 20260710-091530 */
export function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours()
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** slug seguro para nombres de archivo */
export function slug(s, max = 40) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

export function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
