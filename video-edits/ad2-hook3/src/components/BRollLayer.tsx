import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, clamp, easeIn, easeOut, timeline } from "../lib";
import { Card } from "./Card";
import { Checklist } from "./Checklist";
import { Trends } from "./Trends";
import { VsSplit } from "./VsSplit";

export const ENTER_FRAMES = 12;
const EXIT_FRAMES = 9;

/** Full-screen B-roll takeover with an After Effects style entrance (whip / zoom / 3D flip / circle wipe / slam). */
const Takeover: React.FC<{ b: BRoll; chained: boolean }> = ({ b, chained }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = Math.round((b.end - b.start) * fps);
  const pIn = interpolate(f, [0, ENTER_FRAMES], [0, 1], { ...clamp, easing: easeOut });
  const pOut = chained ? 0 : interpolate(f, [dur - EXIT_FRAMES, dur], [0, 1], { ...clamp, easing: easeIn });

  let scale = 1;
  let opacity = 1;
  let blur = 0;
  let translate = "0px 0px";
  let transform: string | undefined;
  let clipPath: string | undefined;
  let flash = 0;

  switch (b.enter) {
    case "whip":
      translate = `${(1 - pIn) * 1100}px 0px`;
      transform = `skewX(${(1 - pIn) * -12}deg)`;
      blur = (1 - pIn) * 22;
      break;
    case "zoom":
      scale = 1.55 - 0.55 * pIn;
      opacity = pIn;
      blur = (1 - pIn) * 18;
      flash = interpolate(f, [0, 2, 9], [0, 0.5, 0], clamp);
      break;
    case "flip":
      transform = `perspective(1800px) rotateY(${(1 - pIn) * -80}deg)`;
      opacity = interpolate(pIn, [0, 0.25], [0, 1], clamp);
      break;
    case "circle":
      clipPath = `circle(${pIn * 125}% at 50% 42%)`;
      flash = interpolate(f, [4, 7, 14], [0, 0.35, 0], clamp);
      break;
    case "slam": {
      const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 230, mass: 0.7 } });
      // punch in from oversized and settle with a hit; never smaller than the frame
      scale = Math.max(1, 1 + 0.4 * (1 - s));
      opacity = Math.min(1, f / 2);
      blur = Math.max(0, 1 - f / 6) * 14;
      flash = interpolate(f, [1, 3, 10], [0, 0.45, 0], clamp);
      break;
    }
  }
  scale *= 1 + 0.08 * pOut;
  opacity *= 1 - pOut;
  blur += pOut * 14;

  let content: React.ReactNode = null;
  if (b.type === "card") content = <Card b={b} dur={dur} />;
  if (b.type === "vs") content = <VsSplit b={b} />;
  if (b.type === "trends") content = <Trends b={b} />;
  if (b.type === "checklist") content = <Checklist b={b} />;

  return (
    <AbsoluteFill
      style={{
        scale: String(scale),
        opacity,
        translate,
        transform,
        clipPath,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        overflow: "hidden",
      }}
    >
      {content}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const BRollLayer: React.FC = () => {
  const { fps } = useVideoConfig();
  const list = timeline.brolls;
  return (
    <>
      {list.map((b, i) => {
        const next = list[i + 1];
        const chained = Boolean(next && Math.abs(next.start - b.end) < 0.05);
        const from = Math.round(b.start * fps);
        // a chained B-roll stays underneath until the next one has fully entered
        const to = Math.round(b.end * fps) + (chained ? ENTER_FRAMES : 0);
        return (
          <Sequence key={b.id} name={`B-roll: ${b.id}`} from={from} durationInFrames={to - from}>
            <Takeover b={b} chained={chained} />
          </Sequence>
        );
      })}
    </>
  );
};

/** Shared: blurred, darkened copy of an image used as a full-frame backdrop. */
export const BlurBackdrop: React.FC<{ src: string; brightness?: number }> = ({ src, brightness = 0.42 }) => (
  <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: -120,
        width: "calc(100% + 240px)",
        height: "calc(100% + 240px)",
        objectFit: "cover",
        filter: `blur(44px) brightness(${brightness}) saturate(1.35)`,
      }}
    />
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)" }}
    />
  </AbsoluteFill>
);

/** Diagonal light sweep that crosses its parent once, starting at `startFrame`. */
export const Shine: React.FC<{ startFrame: number; durationFrames?: number }> = ({ startFrame, durationFrames = 26 }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [startFrame, startFrame + durationFrames], [-140, 140], { ...clamp, easing: easeOut });
  if (f < startFrame || f > startFrame + durationFrames) return null;
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 65%)",
        translate: `${x}% 0%`,
        mixBlendMode: "screen",
      }}
    />
  );
};
