#!/usr/bin/env node
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeVideo(videoPath) {
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Video no encontrado: ${videoPath}`);
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY no está definida en .env");
    process.exit(1);
  }

  console.log(`🎬 Transcribiendo: ${path.basename(videoPath)}`);

  try {
    const transcript = await client.audio.transcriptions.create({
      file: fs.createReadStream(videoPath),
      model: "whisper-1",
      language: "es",
      response_format: "verbose_json",
    });

    const result = {
      videoPath,
      fileName: path.basename(videoPath),
      duration: transcript.duration || null,
      language: "es",
      text: transcript.text,
      segments: transcript.segments || [],
      timestamp: new Date().toISOString(),
    };

    const outputPath = path.join(
      path.dirname(videoPath),
      `${path.basename(videoPath, path.extname(videoPath))}-transcript.json`
    );

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`✅ Transcripción guardada: ${outputPath}`);
    console.log(`📄 Texto: "${result.text.substring(0, 100)}..."`);

    return result;
  } catch (error) {
    console.error("❌ Error en transcripción:", error.message);
    process.exit(1);
  }
}

const videoPath = process.argv[2];
if (!videoPath) {
  console.error("Uso: node transcribe-video.mjs <ruta-del-video.mp4>");
  process.exit(1);
}

const result = await transcribeVideo(videoPath);
console.log(JSON.stringify(result, null, 2));
