#!/usr/bin/env node
import fs from "fs";
import path from "path";

async function generateEditPlan(analysisPath, imagesPath) {
  if (!fs.existsSync(analysisPath) || !fs.existsSync(imagesPath)) {
    console.error("❌ Archivos de análisis e imágenes requeridos");
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));
  const images = JSON.parse(fs.readFileSync(imagesPath, "utf-8"));

  console.log(`🎬 Generando plan de edición inteligente...`);

  const editingRec = analysis.analysis.editingRecommendations;
  const availableImages = images.images.length;

  // Lógica inteligente de decisión
  const imagesToUse = Math.min(parseInt(editingRec.numImages), availableImages, 3);

  const editPlan = {
    videoMetadata: {
      theme: analysis.analysis.theme,
      category: analysis.analysis.category,
      tone: analysis.analysis.tone,
      energy: analysis.analysis.energy,
    },
    editingStrategy: {
      type: "minimalista-inicio",
      description: "Agregar imágenes inteligentes al inicio del video",
      principle: "Menos es más - solo lo esencial para complementar",
    },
    imageInsertion: {
      count: imagesToUse,
      position: "inicio (primeros 0-2 segundos)",
      selectedImages: images.images.slice(0, imagesToUse),
      timing: {
        fadeIn: 300,
        displayDuration: imagesToUse === 1 ? 2000 : 1500,
        fadeOut: 300,
        totalDuration: imagesToUse * 2000,
      },
    },
    transitions: {
      type: editingRec.transitionStyle,
      duration: 400,
      easing: "ease-in-out",
    },
    audio: {
      preserveOriginal: true,
      addMusic: editingRec.musicNeeded,
      musicGenre: editingRec.musicGenre || "subtle-background",
      addSFX: false,
      description: "Mantener audio original, fondo musical opcional",
    },
    colorGrade: {
      apply: editingRec.colorGradeNeeded,
      tone: editingRec.suggestedColorTone || "neutral",
      intensity: "suave",
      description: editingRec.colorGradeNeeded
        ? `Aplicar tono ${editingRec.suggestedColorTone} ligero`
        : "No aplicar cambios de color",
    },
    captions: {
      add: editingRec.captionsNeeded,
      placement: "bottom",
      style: "minimalista",
      description: editingRec.captionsNeeded
        ? "Agregar captions en puntos clave (minimalista)"
        : "No agregar captions",
    },
    vfx: {
      apply: editingRec.vfxNeeded || false,
      description: "Evitar efectos innecesarios - mantener minimalismo",
    },
    outputFormat: {
      aspectRatio: "9:16",
      duration: "original",
      codec: "h264",
      bitrate: "8000k",
    },
    rationale: editingRec.minimalistRationale,
    contentAnalysis: analysis.analysis.contentAnalysis,
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(
    path.dirname(analysisPath),
    `${path.basename(analysisPath, path.extname(analysisPath))}-edit-plan.json`
  );

  fs.writeFileSync(outputPath, JSON.stringify(editPlan, null, 2));

  console.log(`✅ Plan de edición generado`);
  console.log(`🖼️  ${imagesToUse} imagen(s) al inicio`);
  console.log(`🎵 Música: ${editingRec.musicNeeded ? "Sí" : "No"}`);
  console.log(`📝 Captions: ${editingRec.captionsNeeded ? "Sí" : "No"}`);
  console.log(`💾 Plan guardado: ${outputPath}`);

  return editPlan;
}

const analysisPath = process.argv[2];
const imagesPath = process.argv[3];

if (!analysisPath || !imagesPath) {
  console.error(
    "Uso: node edit-decision-engine.mjs <archivo-analysis.json> <archivo-images.json>"
  );
  process.exit(1);
}

const plan = await generateEditPlan(analysisPath, imagesPath);
console.log(JSON.stringify(plan, null, 2));
