import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StudioBg } from "../components/Fx";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp, easeInOut } from "../lib/anim";
import { DrawPath, SlideIn } from "./ui";

export const SkillScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const trading = wordFrame("skill", "trading") - from;
  const skill = wordFrame("skill", "skill") - from;
  const requires = wordFrame("skill", "requires") - from;
  const real = wordFrame("skill", "real") - from;

  const s = spring({ frame: f - skill, fps, config: { damping: 9, mass: 0.6, stiffness: 220 } });
  const up = interpolate(f, [real - 4, real + 10], [0, 1], { ...clamp, easing: easeInOut });

  return (
    <AbsoluteFill>
      <StudioBg hue={C.gold} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, translate: `0px ${-up * 70}px`, scale: `${1 - up * 0.32}`, transformOrigin: "50% 0%" }}>
        <SlideIn at={trading - 2} dy={-50} style={{ left: 0, right: 0, top: 110, textAlign: "center" }}>
          <div style={{ fontFamily: body, fontWeight: 900, fontSize: 62, color: C.white, letterSpacing: 2, textShadow: "0 6px 0 rgba(0,0,0,0.6)" }}>
            TRADING IS ALSO A
          </div>
        </SlideIn>
        {f >= skill - 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 170,
              textAlign: "center",
              fontFamily: display,
              fontSize: 250,
              lineHeight: 1.1,
              color: C.gold,
              letterSpacing: 10,
              scale: `${interpolate(s, [0, 1], [2.2, 1])}`,
              opacity: interpolate(s, [0, 0.25], [0, 1], clamp),
              textShadow: `0 0 50px ${C.gold}88, 0 12px 0 #5A3D00`,
            }}
          >
            SKILL
          </div>
        ) : null}
        <svg width={1080} height={600} style={{ position: "absolute", left: 0, top: 0 }}>
          <DrawPath d="M 270 455 Q 540 425 815 452" at={skill + 6} dur={10} color={C.white} width={12} length={700} />
        </svg>
        {/* sparkles */}
        {f > skill
          ? Array.from({ length: 10 }, (_, i) => {
              const t = (f - skill - i * 1.5) / 26;
              if (t < 0 || t > 1) return null;
              const ang = random(`sp${i}`) * Math.PI * 2;
              const r = 160 + t * 300;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 540 + Math.cos(ang) * r * 1.4,
                    top: 320 + Math.sin(ang) * r * 0.6,
                    width: 26,
                    height: 26,
                    background: C.gold,
                    rotate: "45deg",
                    opacity: 1 - t,
                    scale: `${1 - t * 0.6}`,
                    boxShadow: `0 0 20px ${C.gold}`,
                  }}
                />
              );
            })
          : null}
      </div>

      {/* three empty slots appear on "requires" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 34 }}>
        {[0, 1, 2].map((i) => {
          const at = requires + i * 3;
          const p = spring({ frame: f - at, fps, config: { damping: 11, mass: 0.6 } });
          return (
            <div
              key={i}
              style={{
                width: 220,
                height: 130,
                borderRadius: 26,
                border: `6px dashed ${C.gold}`,
                background: "rgba(255,200,61,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: display,
                fontSize: 90,
                color: C.gold,
                opacity: f < at ? 0 : p,
                scale: `${0.4 + p * 0.6}`,
                translate: `0px ${(1 - p) * 40}px`,
              }}
            >
              ?
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
