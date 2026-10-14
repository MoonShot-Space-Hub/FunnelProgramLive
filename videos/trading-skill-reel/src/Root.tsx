import { Composition, Still } from "remotion";
import { AvatarTest } from "./components/AvatarTest";
import { Reel } from "./Reel";
import { TOTAL_FRAMES } from "./lib/timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
      <Still id="AvatarTest" component={AvatarTest} width={W} height={H} />
    </>
  );
};
