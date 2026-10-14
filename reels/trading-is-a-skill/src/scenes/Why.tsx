import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { prog, shake } from "../anim";
import { useT } from "../components/ui";
import { C, fontFamily } from "../theme";
import { line, scene } from "../timeline";

export const Why: React.FC = () => {
  const { start, end } = scene("why");
  const t = useT(start);
  const hit = line("why").start - 0.03;
  const slam = prog(t, hit, 0.18);
  const breathe = interpolate(t, [hit + 0.2, end], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#020308", fontFamily }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 46%, ${C.yellow}33 0%, transparent 70%)`,
          opacity: slam,
        }}
      />
      <AbsoluteFill style={{ translate: shake(t, hit, 28, 7), justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontSize: 330,
            fontWeight: 900,
            color: C.yellow,
            letterSpacing: -8,
            marginTop: -120,
            opacity: interpolate(slam, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
            scale: String((2.4 - 1.4 * slam) * breathe),
            textShadow: `0 0 80px ${C.yellow}88, 0 14px 0 rgba(0,0,0,0.6)`,
          }}
        >
          WHY?
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "#fff",
          opacity: interpolate(t, [hit, hit + 0.03, hit + 0.16], [0, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
