import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp } from "../lib/anim";

const Icon: React.FC<{ kind: number; color: string }> = ({ kind, color }) => {
  if (kind === 0)
    return (
      <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  if (kind === 1)
    return (
      <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <circle cx={12} cy={12} r={10} />
        <circle cx={12} cy={12} r={6} />
        <circle cx={12} cy={12} r={2} fill={color} />
      </svg>
    );
  return (
    <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
      <path d="M8.5 12l2.5 2.5 5-5" />
    </svg>
  );
};

const PILLARS = [
  { word: "education", label: "EDUCATION", color: C.blue },
  { word: "practice", label: "PRACTICE", color: C.green },
  { word: "rules", label: "RULES", color: C.gold },
];

export const PillarsScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const roofAt = wordFrame("pillars", "rules") - from + 16;
  const roof = spring({ frame: f - roofAt, fps, config: { damping: 12, mass: 0.8 } });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 20%, #23185A 0%, #0B0A24 60%, #05040F 100%)" }}>
      {/* light rays */}
      <AbsoluteFill style={{ opacity: 0.18 }}>
        <svg width={1080} height={1920}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = -0.6 + i * 0.15 + Math.sin(f / 40 + i) * 0.02;
            return <path key={i} d={`M 540 -100 L ${540 + Math.tan(a) * 1600 - 60} 1500 L ${540 + Math.tan(a) * 1600 + 60} 1500 Z`} fill="#B9A8FF" />;
          })}
        </svg>
      </AbsoluteFill>

      {/* base steps */}
      <div style={{ position: "absolute", left: 60, top: 1170, width: 960, height: 46, borderRadius: 8, background: "linear-gradient(#E8E4F5,#A9A2C7)" }} />
      <div style={{ position: "absolute", left: 20, top: 1212, width: 1040, height: 50, borderRadius: 8, background: "linear-gradient(#CFC8E8,#8E86B2)" }} />

      {PILLARS.map((p, i) => {
        const at = wordFrame("pillars", p.word) - from - 2;
        const s = spring({ frame: f - at, fps, config: { damping: 11, mass: 0.7, stiffness: 160 } });
        const x = 95 + i * 315;
        if (f < at) return null;
        return (
          <div key={p.word} style={{ position: "absolute", left: x, top: 680, width: 260, height: 490, translate: `0px ${(1 - s) * 700}px` }}>
            <div style={{ position: "absolute", left: -18, top: 0, width: 296, height: 48, borderRadius: 8, background: "linear-gradient(#FFFFFF,#C9C3E3)" }} />
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 48,
                width: 232,
                height: 400,
                background: `repeating-linear-gradient(90deg, #F1EEFB 0 26px, #D6D0EC 26px 32px)`,
                boxShadow: `inset 0 0 40px rgba(0,0,0,0.2), 0 0 50px ${p.color}55`,
              }}
            />
            <div style={{ position: "absolute", left: -18, top: 448, width: 296, height: 42, borderRadius: 8, background: "linear-gradient(#FFFFFF,#BDB6DA)" }} />
            <div
              style={{
                position: "absolute",
                left: 50,
                top: 100,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: p.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 40px ${p.color}`,
              }}
            >
              <Icon kind={i} color="#fff" />
            </div>
            <div
              style={{
                position: "absolute",
                left: -30,
                right: -30,
                top: 300,
                textAlign: "center",
                padding: "10px 0",
                background: "rgba(8,6,24,0.88)",
                borderRadius: 14,
                fontFamily: display,
                fontSize: 66,
                color: p.color,
                letterSpacing: 2,
                rotate: "-3deg",
              }}
            >
              {p.label}
            </div>
            {/* dust puff on landing */}
            {Array.from({ length: 8 }, (_, k) => {
              const t = (f - at - 6) / 18;
              if (t < 0 || t > 1) return null;
              const dir = k < 4 ? -1 : 1;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 130 + dir * (40 + t * (120 + random(`dx${i}${k}`) * 120)),
                    top: 470 - t * (30 + random(`dy${i}${k}`) * 60),
                    width: 50 + t * 60,
                    height: 50 + t * 60,
                    borderRadius: "50%",
                    background: "#CFC8E8",
                    opacity: (1 - t) * 0.6,
                    filter: "blur(6px)",
                  }}
                />
              );
            })}
          </div>
        );
      })}

      {/* roof drops in once all three pillars stand */}
      {f >= roofAt ? (
        <div style={{ position: "absolute", left: 40, top: 470, width: 1000, height: 215, translate: `0px ${(1 - roof) * -900}px` }}>
          <svg width={1000} height={215}>
            <defs>
              <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#C9C3E3" />
              </linearGradient>
            </defs>
            <path d="M 500 10 L 990 160 L 10 160 Z" fill="url(#roofG)" />
            <rect x={10} y={160} width={980} height={50} rx={6} fill="#E3DEF4" />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 86, textAlign: "center", fontFamily: display, fontSize: 64, color: "#2A1F66", letterSpacing: 4 }}>
            TRADING SKILL
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1310,
          textAlign: "center",
          fontFamily: body,
          fontWeight: 800,
          fontSize: 40,
          color: C.muted,
          letterSpacing: 6,
          opacity: interpolate(f, [roofAt + 6, roofAt + 16], [0, 1], clamp),
        }}
      >
        THE 3 PILLARS OF EVERY REAL SKILL
      </div>
    </AbsoluteFill>
  );
};
