import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { CandleChart, candlesFrom } from "./ui";

const closes = Array.from({ length: 61 }, (_, i) => 50 + Math.sin(i * 0.45) * 8 + Math.sin(i * 0.13) * 14 + i * 0.35);
const candles = candlesFrom(closes, 2.2);

/** Dark trading-desk backdrop: glow, drifting grid, faint market tape, vignette. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(110% 60% at 50% 18%, #142447 0%, ${C.bg} 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(140,170,255,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(140,170,255,0.06) 2px, transparent 2px)",
          backgroundSize: "96px 96px",
          backgroundPosition: `${-t * 6}px ${t * 14}px`,
          maskImage: "radial-gradient(90% 70% at 50% 45%, black 30%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 330,
          opacity: 0.09,
          translate: `${-((t * 28) % 540)}px 0px`,
        }}
      >
        <CandleChart candles={candles} width={2160} height={360} />
      </div>
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
