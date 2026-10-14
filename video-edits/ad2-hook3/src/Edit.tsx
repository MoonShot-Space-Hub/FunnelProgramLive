import { AbsoluteFill } from "remotion";
import { BRollLayer } from "./components/BRollLayer";
import { CaptionGradient, Captions } from "./components/Captions";
import { OverlayLayer, StickerLayer } from "./components/Overlays";
import { Speaker } from "./components/Speaker";

export const Edit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Speaker />
      <StickerLayer />
      <BRollLayer />
      <OverlayLayer />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }}
      />
      <CaptionGradient />
      <Captions />
    </AbsoluteFill>
  );
};
