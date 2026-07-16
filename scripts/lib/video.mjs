import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { ensureDir } from "./util.mjs";

/** Corre un binario y devuelve stdout. Lanza error con stderr si falla. */
function run(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) =>
      reject(
        new Error(
          e.code === "ENOENT"
            ? `No encuentro "${bin}". Instálalo con: brew install ffmpeg`
            : e.message
        )
      )
    );
    p.on("close", (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(`${bin} falló:\n${err.slice(-500)}`))
    );
  });
}

/** Metadata del video: duración en segundos, fps, ancho y alto. */
export async function probe(videoPath) {
  if (!existsSync(videoPath)) throw new Error(`No encuentro el video: ${videoPath}`);

  const out = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate:format=duration",
    "-of", "json",
    videoPath,
  ]);

  const data = JSON.parse(out);
  const stream = data.streams?.[0];
  if (!stream) throw new Error(`El archivo no tiene pista de video: ${videoPath}`);

  // r_frame_rate viene como "30/1" o "30000/1001"
  const [num, den] = String(stream.r_frame_rate).split("/").map(Number);
  const fps = Math.round(num / (den || 1));

  const durationSec = Number(data.format?.duration);
  if (!Number.isFinite(durationSec)) throw new Error(`No pude leer la duración de ${videoPath}`);

  return {
    durationSec,
    fps: fps || 30,
    width: stream.width,
    height: stream.height,
    durationInFrames: Math.ceil(durationSec * (fps || 30)),
  };
}

/**
 * Extrae el audio a mp3 mono 16 kHz — el formato que Whisper prefiere y que
 * mantiene el archivo muy por debajo del límite de 25 MB de la API.
 */
export async function extractAudio(videoPath, destPath) {
  ensureDir(dirname(destPath));
  await run("ffmpeg", [
    "-y",
    "-i", videoPath,
    "-vn",
    "-ac", "1",
    "-ar", "16000",
    "-b:a", "64k",
    destPath,
  ]);
  return destPath;
}
