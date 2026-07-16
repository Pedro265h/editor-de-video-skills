import React, { CSSProperties } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// Entrada por DESPLAZAMIENTO (nunca fade). El elemento entra deslizándose
// desde una dirección, rápido y con un pequeño rebote.
export type Dir = "left" | "right" | "top" | "up" | "bottom" | "down" | "diag";

const UNIT: Record<Dir, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  up: [0, -1],
  bottom: [0, 1],
  down: [0, 1],
  diag: [-1, 1],
};

export const SlideIn: React.FC<{
  from: Dir;
  delay?: number;
  distance?: number;
  damping?: number;
  stiffness?: number;
  durationInFrames?: number;
  style?: CSSProperties;
  children: React.ReactNode;
}> = ({
  from,
  delay = 0,
  distance = 380,
  damping = 14,
  stiffness = 130,
  durationInFrames = 16,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.8, stiffness },
    durationInFrames,
  });
  const [ux, uy] = UNIT[from] ?? [0, 1];
  const x = ux * distance * (1 - p);
  const y = uy * distance * (1 - p);
  return <div style={{ ...style, transform: `translate(${x}px, ${y}px)` }}>{children}</div>;
};
