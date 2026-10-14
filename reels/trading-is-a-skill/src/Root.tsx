import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { FPS, H, W } from "./theme";
import { VIDEO_SECONDS } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TradingIsASkill"
      component={Reel}
      durationInFrames={Math.round(VIDEO_SECONDS * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
