# 🎬 video-vox

Crea **shorts verticales animados estilo Vox / documental educativo** sobre cualquier tema, de punta a punta, con [Claude Code](https://claude.com/claude-code) + [Remotion](https://remotion.dev).

Le das un tema → sale un video 9:16 (~30-45s) con guión, voz, ilustraciones cartoon recortadas, música y efectos de sonido. Listo para YouTube Shorts, TikTok y Reels.

![estilo](https://img.shields.io/badge/formato-9%3A16-orange) ![stack](https://img.shields.io/badge/Remotion-4-blue)

## ✨ Qué hace
- **Guión** automático (hook → desarrollo → cierre).
- **Voz** en español (ElevenLabs).
- **Ilustraciones cartoon** generadas con IA (Kie · Nano Banana) y **recortadas** con fondo transparente (rembg).
- **Música** de fondo (Suno vía Kie).
- **Efectos de sonido** (whoosh en transiciones, pop en los textos).
- **Render** con Remotion: papel crema, tipografía Anton, acento naranja, transiciones de desplazamiento (sin fades).

## 📦 Requisitos
- **Node.js 18+**, **ffmpeg** (`brew install ffmpeg`), **Python 3** con `rembg` (`pip3 install rembg pillow onnxruntime`).
- **Llaves de API** (obligatorias): [Kie.ai](https://kie.ai) y [ElevenLabs](https://elevenlabs.io).
- **Opcional**: [Apify](https://apify.com) (solo si quieres usar fotos reales de internet — actores, logos).

## 🚀 Instalación (solo pégale esto a Claude Code)
No necesitas tocar la terminal. Abre Claude Code y pega este prompt:

> **Instala este skill de Claude Code y configúralo conmigo:**
> `https://github.com/santmun/video-vox`
> Clónalo en `~/.claude/skills/video-vox`, abre su `SKILL.md`, instálame las dependencias que falten (corre `node scripts/doctor.mjs --fix` y ayúdame con lo que quede en rojo), y luego guíame en el onboarding: mis llaves (Kie.ai y ElevenLabs) y mi marca (nombre del canal, CTA, color de acento y voz). Cuando esté listo, dime cómo hago mi primer video.

Claude hace todo: clona, instala, pide tus llaves y configura tu marca. Al terminar solo le dices *"hazme un video vox de \<tu tema\>"*.

<details><summary>Instalación manual (avanzado)</summary>

```bash
git clone https://github.com/santmun/video-vox ~/.claude/skills/video-vox
cd ~/.claude/skills/video-vox && npm install && cp .env.example .env
node scripts/doctor.mjs --fix
```
</details>

## 🎯 Uso (con Claude Code)
Abre Claude Code en la carpeta del skill y di:
```
/video-vox  hazme un short sobre por qué el café te despierta
```
o simplemente: *"hazme un video vox de cómo funciona el interés compuesto"*.
Claude escribe el guión, genera todos los recursos y renderiza el video solo.

## 🔧 Uso manual (sin Claude)
1. Escribe tu guión en `input/scenes.json` (copia el formato de `input/scenes.example.json`).
2. `npm run assets` — genera voz, ilustraciones, recortes y música.
3. `npm run render` — renderiza a `out/video.mp4`.
4. `npm run dev` — abre Remotion Studio para ajustar en vivo.

## 🎨 Personalizar el estilo
Los colores y la tipografía viven en `src/theme.ts`. Las animaciones en `src/anim/SlideIn.tsx` y `src/Short.tsx`.

## 💸 Costo aproximado por video
Unas cuantas imágenes (Kie) + voz y SFX (ElevenLabs) + 1 pista de música (Suno). Es barato por video; tenlo en cuenta si generas muchos.

## 🙌 Créditos
Hecho por [Horizontes IA](https://horizontesia.com). Stack: Remotion · Kie.ai (Nano Banana + Suno) · ElevenLabs · Apify · rembg.
