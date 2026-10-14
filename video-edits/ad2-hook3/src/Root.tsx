import { Composition } from "remotion";
import { Edit } from "./Edit";
import { timeline } from "./lib";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AdHook3"
      component={Edit}
      durationInFrames={Math.round(timeline.durationSec * timeline.fps)}
      fps={timeline.fps}
      width={1080}
      height={1920}
    />
  );
};
