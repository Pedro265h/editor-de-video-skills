import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../../.env");

/** Carga el .env de la raíz del proyecto en process.env (sin dependencias). */
export function loadEnv() {
  let raw;
  try {
    raw = readFileSync(ENV_PATH, "utf8");
  } catch {
    throw new Error(`No encuentro .env en ${ENV_PATH}. Copia .env.example a .env`);
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

/** Devuelve una env var obligatoria o lanza error claro. */
export function need(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Falta ${key} en .env`);
  return v;
}

/** Enmascara un secreto para logs: abcd…wxyz */
export function mask(s) {
  if (!s) return "(vacío)";
  if (s.length <= 8) return "****";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
