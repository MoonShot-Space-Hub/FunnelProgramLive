import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, display } from "../theme";
import { clamp } from "../lib/anim";

export const WhyScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = 0.5 + 0.5 * Math.sin(f / 3);
  return (
    <AbsoluteFill style={{ background: "#020203" }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 30%, ${C.red}${Math.round(40 + glow * 40).toString(16)} 0%, transparent 70%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 6 }}>
        {"WHY?".split("").map((ch, i) => {
          const at = 1 + i * 3;
          const s = spring({ frame: f - at, fps, config: { damping: 9, mass: 0.5, stiffness: 300 } });
          const ab = interpolate(f - at, [0, 10], [16, 3], clamp);
          if (f < at) return <span key={i} style={{ fontFamily: display, fontSize: 330, opacity: 0 }}>{ch}</span>;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: display,
                fontSize: 330,
                lineHeight: 1,
                color: i === 3 ? C.red : C.white,
                scale: `${interpolate(s, [0, 1], [3, 1])}`,
                opacity: interpolate(s, [0, 0.2], [0, 1], clamp),
                rotate: `${interpolate(s, [0, 1], [i % 2 ? 14 : -14, 0])}deg`,
                textShadow: `${-ab}px 0 0 rgba(255,40,80,0.85), ${ab}px 0 0 rgba(40,220,255,0.85), 0 0 60px rgba(255,59,92,0.5)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
