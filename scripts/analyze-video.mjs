#!/usr/bin/env node
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function analyzeVideo(transcriptPath) {
  if (!fs.existsSync(transcriptPath)) {
    console.error(`❌ Archivo de transcripción no encontrado: ${transcriptPath}`);
    process.exit(1);
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));

  console.log(`🧠 Analizando temática y estilo de edición...`);

  const analysisPrompt = `Analiza este video y proporciona recomendaciones inteligentes de edición para un reel minimalista en estilo Vox.

TRANSCRIPCIÓN DEL VIDEO:
"${transcript.text}"

Por favor, proporciona un análisis JSON con la siguiente estructura:
{
  "theme": "tema principal del video (1-3 palabras)",
  "category": "categoría (educativo/viral/tutorial/lifestyle/noticia/humor/otro)",
  "tone": "tono detectado (energético/calmado/informativo/satírico/inspirador/etc)",
  "energy": "nivel de energía de 1 a 10",
  "pacing": "ritmo (rápido/moderado/lento)",
  "keyMoments": [
    {
      "timestamp": "descripción del momento",
      "type": "gancho/punto-clave/cierre",
      "importance": "alta/media/baja"
    }
  ],
  "imageKeywords": [
    "palabra clave 1",
    "palabra clave 2",
    "palabra clave 3",
    "palabra clave 4",
    "palabra clave 5"
  ],
  "imageInsertionPoint": "momento exacto donde insertar imágenes (al inicio, en la intro, etc)",
  "editingRecommendations": {
    "numImages": "cantidad de imágenes sugeridas (1-3)",
    "imageStyle": "estilo recomendado (cartoon/foto-real/infografía/minimalista/otra)",
    "transitionStyle": "tipo de transición (fade/slide/zoom/corte)",
    "musicNeeded": true/false,
    "musicGenre": "género sugerido si es necesario",
    "colorGradeNeeded": true/false,
    "suggestedColorTone": "tono de color (cálido/frío/neutral)",
    "captionsNeeded": true/false,
    "vfxNeeded": false,
    "minimalistRationale": "explicación de por qué esta es una buena edición minimalista"
  },
  "contentAnalysis": "análisis breve de cómo abordar la edición"
}

Responde SOLO con el JSON válido, sin explicaciones adicionales.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
    });

    let analysisText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Limpiar si tiene markdown
    analysisText = analysisText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis = JSON.parse(analysisText);

    const result = {
      transcriptPath,
      videoTheme: transcript.fileName,
      analysis,
      timestamp: new Date().toISOString(),
    };

    const outputPath = path.join(
      path.dirname(transcriptPath),
      `${path.basename(transcriptPath, path.extname(transcriptPath))}-analysis.json`
    );

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`✅ Análisis completado: ${outputPath}`);
    console.log(`📊 Temática: ${analysis.theme}`);
    console.log(`🎬 Categoría: ${analysis.category}`);
    console.log(`🎨 Recomendaciones: ${analysis.editingRecommendations.numImages} imágenes, estilo ${analysis.editingRecommendations.imageStyle}`);

    return result;
  } catch (error) {
    console.error("❌ Error en análisis:", error.message);
    process.exit(1);
  }
}

const transcriptPath = process.argv[2];
if (!transcriptPath) {
  console.error("Uso: node analyze-video.mjs <archivo-transcript.json>");
  process.exit(1);
}

const result = await analyzeVideo(transcriptPath);
console.log(JSON.stringify(result, null, 2));
