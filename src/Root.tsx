import React from "react";
import { Composition } from "remotion";
import { Short } from "./Short";
import data from "./data/short.json";
import { TRANSITION_FRAMES } from "./config";

// Las transiciones se solapan con las escenas: total real =
// suma de escenas - (n-1) * duración de transición.
const shortTotal =
  data.scenes.reduce((a, s) => a + s.durationInFrames, 0) -
  (data.scenes.length - 1) * TRANSITION_FRAMES;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={Short}
      durationInFrames={shortTotal}
      fps={data.fps}
      width={data.width}
      height={data.height}
    />
  );
};
