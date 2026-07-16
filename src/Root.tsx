import React from "react";
import { Composition } from "remotion";
import { Short } from "./Short";
import { EditReel, type EditPlan } from "./EditReel";
import data from "./data/short.json";
import editPlanData from "./data/edit-plan.json";
import { TRANSITION_FRAMES } from "./config";

// Las transiciones se solapan con las escenas: total real =
// suma de escenas - (n-1) * duración de transición.
const shortTotal =
  data.scenes.reduce((a, s) => a + s.durationInFrames, 0) -
  (data.scenes.length - 1) * TRANSITION_FRAMES;

// Lo escribe scripts/edit-decision-engine.mjs antes de cada render.
const editPlan = editPlanData as EditPlan;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Short"
        component={Short}
        durationInFrames={shortTotal}
        fps={data.fps}
        width={data.width}
        height={data.height}
      />
      <Composition
        id="EditReel"
        component={EditReel}
        durationInFrames={editPlan.composition.durationInFrames}
        fps={editPlan.composition.fps}
        width={editPlan.composition.width}
        height={editPlan.composition.height}
        defaultProps={{ plan: editPlan }}
      />
    </>
  );
};
