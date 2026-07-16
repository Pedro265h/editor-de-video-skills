import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Anton";
import { BRAND, COLORS } from "../theme";

const { fontFamily } = loadFont();

// Marca del canal persistente (handle/nombre) — se AUTOCONFIGURA desde brand.json.
// Si no hay handle/canal o mostrarTag=false, no renderiza nada.
export const BrandTag: React.FC = () => {
  const label = BRAND.handle || BRAND.canal;
  if (!BRAND.mostrarTag || !label) return null;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          marginTop: 54,
          padding: "10px 26px",
          borderRadius: 999,
          background: COLORS.orange,
          color: "#FFF4DE",
          fontFamily,
          fontSize: 34,
          letterSpacing: 1,
          textTransform: "uppercase",
          boxShadow: "0 8px 0 rgba(32,24,15,0.14)",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
