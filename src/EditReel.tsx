import {
  AbsoluteFill,
  Composition,
  Img,
  OffthreadVideo,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
} from "remotion";
import React from "react";

interface EditReelProps {
  videoPath: string;
  editPlan: {
    imageInsertion: {
      count: number;
      selectedImages: Array<{ filePath: string; fileName: string }>;
      timing: {
        fadeIn: number;
        displayDuration: number;
        fadeOut: number;
      };
    };
    transitions: {
      type: string;
      duration: number;
    };
  };
}

const ImageOverlay: React.FC<{
  imagePath: string;
  startFrame: number;
  fadeInDuration: number;
  displayDuration: number;
  fadeOutDuration: number;
}> = ({ imagePath, startFrame, fadeInDuration, displayDuration, fadeOutDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startMs = startFrame;
  const fadeInMs = fadeInDuration;
  const displayMs = displayDuration;
  const fadeOutMs = fadeOutDuration;

  const frameInMs = frame / (fps / 1000);

  let opacity = 0;

  if (frameInMs >= startMs && frameInMs < startMs + fadeInMs) {
    opacity = (frameInMs - startMs) / fadeInMs;
  } else if (frameInMs >= startMs + fadeInMs && frameInMs < startMs + fadeInMs + displayMs) {
    opacity = 1;
  } else if (
    frameInMs >= startMs + fadeInMs + displayMs &&
    frameInMs < startMs + fadeInMs + displayMs + fadeOutMs
  ) {
    opacity = 1 - (frameInMs - (startMs + fadeInMs + displayMs)) / fadeOutMs;
  }

  const scale = 1 + (frameInMs - startMs) * 0.0002;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${Math.max(1, Math.min(scale, 1.05))})`,
      }}
    >
      <Img src={`file://${imagePath}`} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

export const EditReel: React.FC<EditReelProps> = ({ videoPath, editPlan }) => {
  const { width, height, fps } = useVideoConfig();

  const imageInsertionDurationFrames =
    editPlan.imageInsertion.count *
    ((editPlan.imageInsertion.timing.fadeIn +
      editPlan.imageInsertion.timing.displayDuration +
      editPlan.imageInsertion.timing.fadeOut) /
      1000) *
    fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Video original */}
      <OffthreadVideo src={`file://${videoPath}`} />

      {/* Imágenes al inicio */}
      {editPlan.imageInsertion.selectedImages.map((image, index) => {
        const startFrame =
          (index *
            (editPlan.imageInsertion.timing.fadeIn +
              editPlan.imageInsertion.timing.displayDuration +
              editPlan.imageInsertion.timing.fadeOut)) /
          1000 *
          fps;

        return (
          <ImageOverlay
            key={`${image.fileName}-${index}`}
            imagePath={image.filePath}
            startFrame={startFrame}
            fadeInDuration={editPlan.imageInsertion.timing.fadeIn}
            displayDuration={editPlan.imageInsertion.timing.displayDuration}
            fadeOutDuration={editPlan.imageInsertion.timing.fadeOut}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const EditReelComposition: React.FC<{ config: EditReelProps }> = ({ config }) => {
  return (
    <Composition
      id="EditReel"
      component={EditReel}
      durationInFrames={300 * 30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={config}
    />
  );
};
