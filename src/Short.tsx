import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import data from "./data/short.json";
import { EscenaShort, SceneData } from "./scenes/EscenaShort";
import { BrandTag } from "./components/BrandTag";
import { COLORS } from "./theme";
import { TRANSITION_FRAMES } from "./config";

// Direcciones de push alternadas -> transiciones de desplazamiento constantes.
const DIRS = ["from-left", "from-bottom", "from-right", "from-top"] as const;

export const Short: React.FC = () => {
  const scenes = data.scenes as SceneData[];
  const children: React.ReactNode[] = [];

  scenes.forEach((s, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s-${s.id}`} durationInFrames={s.durationInFrames}>
        <EscenaShort scene={s} />
      </TransitionSeries.Sequence>
    );
    if (i < scenes.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${s.id}`}
          presentation={slide({ direction: DIRS[(i + 1) % DIRS.length] })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
        />
      );
    }
  });

  const total =
    scenes.reduce((a, s) => a + s.durationInFrames, 0) -
    (scenes.length - 1) * TRANSITION_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* Cama de música (Suno) — volumen bajo, con rampa de entrada/salida de audio */}
      <Audio
        src={staticFile("media/short/music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 12, total - 28, total], [0, 0.15, 0.15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <TransitionSeries>{children}</TransitionSeries>
      {/* Marca del canal persistente (se autoconfigura desde brand.json) */}
      <BrandTag />
    </AbsoluteFill>
  );
};
