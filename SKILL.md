---
name: video-vox
description: Crea un SHORT vertical (9:16) animado estilo Vox/documental educativo sobre CUALQUIER tema, de punta a punta y 100% autónomo. Escribe el guión, genera la voz (ElevenLabs), ilustraciones cartoon recortadas (Kie Nano Banana + rembg), música (Suno vía Kie) y efectos de sonido, y lo renderiza con Remotion — fondo papel crema, tipografía Anton, acento naranja, transiciones de desplazamiento (sin fades). Úsalo cuando el usuario diga "hazme un video vox de X", "crea un short animado de X", "video explicativo de X", "explica X en un short", o invoque /video-vox. La primera vez corre un setup que pide las llaves (Kie + ElevenLabs obligatorias; Apify opcional para fotos reales).
---

# video-vox — Shorts explicativos animados estilo Vox

Convierte un TEMA en un short vertical animado (9:16, ~30-45s) listo para YouTube Shorts / TikTok / Reels.
Trabaja SIEMPRE dentro de la carpeta de este skill (`~/.claude/skills/video-vox`).

## Estilo (ya está codificado en el proyecto Remotion — no lo cambies)
- Fondo **papel crema** texturizado, tipografía **Anton** gruesa, acento **naranja**.
- Imágenes = **cartoon animado** recortado (transparente) sobre el papel.
- Animaciones = **desplazamiento rápido** (slides + rebote). **Nunca fades.**
- Fotos reales SOLO cuando no se puede generar con IA (actores, logos, cosas específicas).

## Instalación (cuando el usuario pega el prompt "instala este skill: <url>")
Si el skill NO está en `~/.claude/skills/video-vox`, clónalo ahí primero. Luego SIEMPRE
trabaja dentro de esa carpeta y corre el Setup de abajo. Todo el onboarding lo haces TÚ
por chat — el usuario nunca toca la terminal.

## Flujo (100% autónomo — una vez tienes el tema, NO te detengas a pedir aprobación)

### 0. Setup (solo la primera vez — guíalo tú, paso a paso)

**a) Dependencias** — corre `node scripts/doctor.mjs --fix` (auto-instala npm + rembg/pillow).
Para lo que quede en rojo (ffmpeg, node, python), dale el comando que imprimió el doctor SEGÚN SU
sistema y ayúdale a instalarlo — NO lo dejes solo. Vuelve a correr con `--fix` hasta que todo esté ✅.

**b) Llaves** — si NO existe `.env` o faltan llaves:
  1. Explica que se necesitan 2 llaves obligatorias: **Kie.ai** (imágenes + música) y **ElevenLabs** (voz + SFX), con los links de `.env.example`. Pregunta si quiere **fotos reales** (Apify, opcional).
  2. Copia `.env.example` a `.env` y rellena lo que te dio. Verifica con `npm run test:apis`.

**c) Marca del canal (AUTOCONFIGURACIÓN)** — haz una mini-entrevista y ESCRIBE `src/brand.json`
(el proyecto lo lee solo: colores, tag y voz se aplican a TODOS los videos sin tocar código):
  1. **Canal**: nombre y/o handle (ej. `@sucanal`) + CTA + sitio (opcional).
  2. **Color de marca**: pregunta su color de acento (hex) o dedúcelo de su logo. Va en `colores.acento`. (Si no tiene, deja el naranja default.)
  3. **Voz**: lista las voces de su cuenta (`GET /v1/voices` con su key) o deja que elija; guarda el `voiceId` en `voz.voiceId`. (Si no elige, se usa la primera.)
  4. Escribe todo en `src/brand.json` (ver `src/brand.example.json`). Con eso el skill queda configurado a su marca.

Si el usuario NO quiere personalizar, deja `brand.json` como está (estilo genérico) y sigue.

### 1. Escribe el guión → `input/scenes.json`
A partir del tema, escribe un JSON con esta forma (mira `input/scenes.example.json`):
```json
{
  "title": "Título corto del video",
  "musicPrompt": "estilo de la música en INGLÉS, ej: energetic upbeat instrumental, positive, no vocals, 120 BPM",
  "scenes": [ { "id": "01", "keyword": "...", "narration": "...", "imagePrompt": "...", "from": "left" }, ... ]
}
```
Reglas del guión:
- **4-6 escenas** (~30-45s). Arco: hook → desarrollo → payoff/cierre con CTA.
- `narration`: **español**, natural y hablado, 1-2 frases por escena. Es lo que dirá la voz.
- `keyword`: **MAYÚSCULAS**, corto (1-4 palabras), es el texto en pantalla. Refuerza, no repite literal la narración.
- `imagePrompt`: **inglés**, describe UN sujeto/escena claro y concreto para ilustrar. NO pidas texto/letras en la imagen (el estilo cartoon se agrega solo).
- `from`: alterna dirección de entrada entre escenas — `left`, `right`, `bottom`, `diag`.

### 2. Genera todos los recursos (autónomo)
```bash
npm run assets
```
Genera voz + ilustración cartoon + recorte transparente por escena, y la música. No regenera lo que ya exista.
(Si el usuario activó fotos reales y alguna escena las necesita: `npm run gen:photos -- --query "..." --max 1 --out public/media/short/<id>-real` y usa esa imagen para esa escena.)

### 3. Renderiza
```bash
npm run render
```
Sale en `out/video.mp4`. Cópialo a `out/<slug-del-título>.mp4`.

### 4. Entrega
Abre el `.mp4` (`open out/<slug>.mp4`) y reporta: tema, nº de escenas, duración. Ofrece ajustes (voz, música, timing).

## Notas
- **Marca**: colores, tag del canal y voz salen de `src/brand.json` (se llena en el onboarding). Editarlo re-configura todos los videos.
- Costo aprox por video: imágenes Kie + voz/SFX ElevenLabs + 1 música Suno. Barato, pero recuérdalo al usuario si hace muchos.
- Los SFX (`public/sfx/`) vienen incluidos; no hay que regenerarlos.
