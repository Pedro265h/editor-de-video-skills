import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Anton";
import { COLORS } from "../theme";
import { PaperBackground } from "../components/PaperBackground";
import { SlideIn, Dir } from "../anim/SlideIn";

const { fontFamily } = loadFont();

export type SceneData = {
  id: string;
  keyword: string;
  narration: string;
  from: Dir;
  audio: string;
  image: string;
  durationInFrames: number;
};

export const EscenaShort: React.FC<{ scene: SceneData }> = ({ scene }) => {
  // El texto entra desde una dirección distinta a la imagen, para dar energía.
  const textFrom: Dir = scene.from === "bottom" || scene.from === "down" ? "right" : "bottom";

  return (
    <AbsoluteFill>
      <PaperBackground />
      <Audio src={staticFile(scene.audio)} />

      {/* SFX: whoosh al entrar la escena/imagen · pop cuando aterriza el texto */}
      <Sequence from={0} durationInFrames={22} name="sfx-whoosh">
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={12} durationInFrames={26} name="sfx-pop">
        <Audio src={staticFile("sfx/pop.mp3")} volume={0.55} />
      </Sequence>

      {/* Recorte cartoon (PNG transparente) — entra deslizándose desde scene.from */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <SlideIn from={scene.from} distance={240} delay={0} style={{ marginTop: 210 }}>
          <Img
            src={staticFile(scene.image)}
            style={{
              width: 940,
              height: 1080,
              objectFit: "contain",
              filter: "drop-shadow(0 22px 26px rgba(40,26,10,0.22))",
            }}
          />
        </SlideIn>
      </AbsoluteFill>

      {/* Keyword en tarjeta naranja — entra rápido desde textFrom */}
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 200 }}
      >
        <SlideIn from={textFrom} distance={460} delay={6} damping={13}>
          <div
            style={{
              background: COLORS.orange,
              borderRadius: 26,
              padding: "26px 46px",
              maxWidth: 960,
              boxShadow: "0 14px 0 rgba(32,24,15,0.16)",
              transform: "rotate(-1.2deg)",
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: 94,
                lineHeight: 1.02,
                letterSpacing: 1,
                color: "#FFF4DE",
                textTransform: "uppercase",
                textAlign: "center",
                display: "block",
              }}
            >
              {scene.keyword}
            </span>
          </div>
        </SlideIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
