import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";

/**
 * Fondo papel crema con textura de grano + manchas suaves + viñeta.
 * Todo generado con filtros SVG (feTurbulence), sin imágenes externas.
 */
export const PaperBackground: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* Manchas grandes: da irregularidad de papel viejo */}
      <svg
        style={{ position: "absolute", width: "100%", height: "100%", mixBlendMode: "multiply" }}
      >
        <filter id="paper-blotch">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.07" intercept="0" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-blotch)" />
      </svg>

      {/* Grano fino: la textura de fibra del papel */}
      <svg
        style={{ position: "absolute", width: "100%", height: "100%", mixBlendMode: "multiply" }}
      >
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.11" intercept="0" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>

      {/* Viñeta cálida para cerrar los bordes */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(130% 130% at 50% 42%, rgba(0,0,0,0) 52%, rgba(60,40,18,0.18) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
