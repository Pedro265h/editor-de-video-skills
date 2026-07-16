import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export type Overlay = {
  file: string;
  query: string;
  from: number;
  fadeIn: number;
  hold: number;
  fadeOut: number;
  durationInFrames: number;
};

export type EditPlan = {
  videoPath: string;
  composition: {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
  };
  overlays: Overlay[];
  transition: string;
};

/** Los assets se sirven desde public/, así que basta la ruta relativa. */
const asset = (p: string) => staticFile(p);

const ImageOverlay: React.FC<{ overlay: Overlay; hardCut: boolean }> = ({
  overlay,
  hardCut,
}) => {
  const frame = useCurrentFrame();
  const { fadeIn, hold, fadeOut, durationInFrames } = overlay;

  const opacity = hardCut
    ? 1
    : interpolate(
        frame,
        [0, fadeIn, fadeIn + hold, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

  // Un zoom muy leve para que la imagen no se sienta congelada.
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.04], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#000" }}>
      <Img
        src={asset(overlay.file)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

export const EditReel: React.FC<{ plan: EditPlan }> = ({ plan }) => {
  const hardCut = plan.transition === "corte";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo src={asset(plan.videoPath)} />

      {plan.overlays.map((overlay, i) => (
        <Sequence
          key={`${overlay.query}-${i}`}
          from={overlay.from}
          durationInFrames={overlay.durationInFrames}
        >
          <ImageOverlay overlay={overlay} hardCut={hardCut} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
