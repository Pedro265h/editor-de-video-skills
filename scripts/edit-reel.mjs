#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

async function runScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const script = spawn("node", [path.join(__dirname, scriptName), ...args], {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env },
    });

    script.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} falló con código ${code}`));
      }
    });
  });
}

async function editReel(videoPath) {
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Video no encontrado: ${videoPath}`);
    process.exit(1);
  }

  console.log("\n🎬 ═══════════════════════════════════════");
  console.log("   VIDEO-VOX EDITOR — Edición de Reels");
  console.log("═══════════════════════════════════════\n");

  const videoDir = path.dirname(videoPath);
  const videoBaseName = path.basename(videoPath, path.extname(videoPath));

  try {
    // 1. Transcribir
    console.log("📍 Paso 1/5: Transcribiendo video...\n");
    await runScript("transcribe-video.mjs", [videoPath]);

    const transcriptPath = path.join(videoDir, `${videoBaseName}-transcript.json`);

    // 2. Analizar
    console.log("\n📍 Paso 2/5: Analizando temática y estilo...\n");
    await runScript("analyze-video.mjs", [transcriptPath]);

    const analysisPath = path.join(videoDir, `${videoBaseName}-transcript-analysis.json`);

    // 3. Buscar imágenes
    console.log("\n📍 Paso 3/5: Buscando imágenes temáticas con Apify...\n");
    await runScript("fetch-reel-images.mjs", [analysisPath]);

    const imagesPath = path.join(videoDir, `${videoBaseName}-transcript-analysis-images.json`);

    // 4. Generar plan de edición
    console.log("\n📍 Paso 4/5: Generando plan de edición inteligente...\n");
    await runScript("edit-decision-engine.mjs", [analysisPath, imagesPath]);

    const editPlanPath = path.join(videoDir, `${videoBaseName}-transcript-analysis-edit-plan.json`);

    // 5. Renderizar
    console.log("\n📍 Paso 5/5: Renderizando video editado...\n");
    console.log("⏳ Esto puede tomar unos minutos...\n");

    const editPlan = JSON.parse(fs.readFileSync(editPlanPath, "utf-8"));

    const editConfig = {
      videoPath,
      editPlan,
    };

    fs.writeFileSync(path.join(projectRoot, "src/editReel.config.json"), JSON.stringify(editConfig, null, 2));

    // Renderizar con Remotion
    const renderProcess = spawn(
      "npx",
      ["remotion", "render", "EditReel", path.join(projectRoot, `out/reel-editado-${videoBaseName}.mp4`)],
      {
        cwd: projectRoot,
        stdio: "inherit",
      }
    );

    await new Promise((resolve, reject) => {
      renderProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Render falló con código ${code}`));
        }
      });
    });

    // Resumen final
    const outputPath = path.join(projectRoot, `out/reel-editado-${videoBaseName}.mp4`);

    console.log("\n✅ ═══════════════════════════════════════");
    console.log("   EDICIÓN COMPLETADA");
    console.log("═══════════════════════════════════════");
    console.log(`\n📹 Video editado: ${outputPath}`);
    console.log(`📊 Imágenes usadas: ${editPlan.imageInsertion.count}`);
    console.log(`🎵 Música: ${editPlan.audio.addMusic ? "Sí" : "No"}`);
    console.log(`📝 Captions: ${editPlan.captions.add ? "Sí" : "No"}`);
    console.log(`\n💡 Análisis guardado en: ${analysisPath}`);
    console.log(`💡 Plan de edición en: ${editPlanPath}\n`);

  } catch (error) {
    console.error("\n❌ Error en el flujo de edición:", error.message);
    process.exit(1);
  }
}

const videoPath = process.argv[2];
if (!videoPath) {
  console.error("Uso: node edit-reel.mjs <ruta-del-video.mp4>");
  console.error("\nEjemplo: node edit-reel.mjs ./videos/mi-reel.mp4");
  process.exit(1);
}

await editReel(videoPath);
