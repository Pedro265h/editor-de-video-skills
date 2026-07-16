#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchReelImages(analysisPath) {
  if (!fs.existsSync(analysisPath)) {
    console.error(`❌ Archivo de análisis no encontrado: ${analysisPath}`);
    process.exit(1);
  }

  if (!process.env.APIFY_API_TOKEN) {
    console.error("❌ APIFY_API_TOKEN no está definida en .env");
    process.exit(1);
  }

  const analysisData = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));
  const keywords = analysisData.analysis.imageKeywords || [];
  const imageStyle = analysisData.analysis.editingRecommendations.imageStyle;

  console.log(`🖼️  Buscando imágenes para: ${keywords.join(", ")}`);

  const outputDir = path.join(__dirname, "../public/media/reel-images");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const images = [];

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];

    try {
      console.log(`🔍 Buscando: "${keyword}" (estilo: ${imageStyle})`);

      const actorInput = {
        queries: [keyword],
        resultsPerPage: 5,
        imageFormat: "any",
        minSize: 500,
        language: "es",
      };

      const runResponse = await fetch(
        "https://api.apify.com/v2/acts/apify~google-images-scraper/runs",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ actorId: "apify~google-images-scraper", input: actorInput }),
        }
      );

      if (!runResponse.ok) {
        console.warn(`⚠️  No se pudo buscar "${keyword}"`);
        continue;
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Esperar a que termine
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 30) {
        const statusResponse = await fetch(
          `https://api.apify.com/v2/acts/apify~google-images-scraper/runs/${runId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
            },
          }
        );
        const statusData = await statusResponse.json();
        if (statusData.data.status === "SUCCEEDED") {
          completed = true;
        } else if (statusData.data.status === "FAILED") {
          console.warn(`⚠️  La búsqueda de "${keyword}" falló`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;
      }

      if (completed) {
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/acts/apify~google-images-scraper/runs/${runId}/dataset/items`,
          {
            headers: {
              Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
            },
          }
        );

        const results = await resultsResponse.json();

        if (results.data && results.data.length > 0) {
          const imageUrl = results.data[0].url;
          const fileName = `${keyword.replace(/\s+/g, "-").toLowerCase()}-${i}.jpg`;
          const filePath = path.join(outputDir, fileName);

          // Descargar imagen
          const imgResponse = await fetch(imageUrl);
          const buffer = await imgResponse.buffer();
          fs.writeFileSync(filePath, buffer);

          images.push({
            keyword,
            fileName,
            filePath,
            url: imageUrl,
            downloadedAt: new Date().toISOString(),
          });

          console.log(`✅ Imagen guardada: ${fileName}`);
        }
      }

      // Delay entre búsquedas para no saturar
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.warn(`⚠️  Error buscando "${keyword}":`, error.message);
    }
  }

  const result = {
    analysisPath,
    imageStyle,
    totalRequested: keywords.length,
    totalDownloaded: images.length,
    images,
    outputDir,
    timestamp: new Date().toISOString(),
  };

  const resultPath = path.join(
    path.dirname(analysisPath),
    `${path.basename(analysisPath, path.extname(analysisPath))}-images.json`
  );

  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

  console.log(`\n✅ Descarga de imágenes completada`);
  console.log(`📊 ${images.length}/${keywords.length} imágenes descargadas`);
  console.log(`💾 Resultado guardado en: ${resultPath}`);

  return result;
}

const analysisPath = process.argv[2];
if (!analysisPath) {
  console.error("Uso: node fetch-reel-images.mjs <archivo-analysis.json>");
  process.exit(1);
}

const result = await fetchReelImages(analysisPath);
console.log(JSON.stringify(result, null, 2));
