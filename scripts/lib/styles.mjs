// Preset de estilo visual para las imágenes generadas con Kie (Nano Banana).
// Cartoon animado, líneas gruesas, colores planos, acento naranja, sobre papel crema.

const CARTOON_SUFFIX =
  "flat 2D cartoon illustration, bold thick black outlines, vibrant flat colors, " +
  "bright orange (#FF5A1F) as the main accent color, playful modern animated explainer style " +
  "(like a fun educational documentary), simple clean shapes, strong readable silhouette, " +
  "centered composition, plain warm cream paper background (#F4ECD6) with subtle paper texture, " +
  "no text, no words, no letters, high quality";

const CUTOUT_SUFFIX =
  "flat 2D cartoon illustration, bold thick black outlines, vibrant flat colors, " +
  "bright orange (#FF5A1F) accent, playful modern animated explainer style, simple clean shapes, " +
  "single isolated subject, fully transparent background, no scene, no floor, no shadow on ground, " +
  "cut-out sticker style, PNG with alpha, no text, no words, high quality";

/** Envuelve el sujeto con el estilo elegido. preset: 'cartoon' | 'cutout' | 'none' */
export function stylePrompt(subject, preset = "cartoon") {
  if (preset === "none") return subject;
  const suffix = preset === "cutout" ? CUTOUT_SUFFIX : CARTOON_SUFFIX;
  return `${subject}. ${suffix}`;
}
