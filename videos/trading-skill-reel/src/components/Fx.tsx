import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { clamp } from "../lib/anim";

/** Dark "studio" backdrop for avatar shots: bokeh, a drifting chart and a glow. */
export const StudioBg: React.FC<{ hue?: string }> = ({ hue = C.blue }) => {
  const frame = useCurrentFrame();
  const candles = Array.from({ length: 26 }, (_, i) => {
    const up = random(`c${i}`) > 0.42;
    const h = 40 + random(`h${i}`) * 140;
    const y = 900 - i * 14 + Math.sin(i * 0.9) * 60;
    return { x: i * 48 - ((frame * 0.8) % 48), y, h, up };
  });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, #13213F 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{ opacity: 0.18 }}>
        <svg width={1080} height={1920}>
          {candles.map((c, i) => (
            <g key={i}>
              <line x1={c.x + 12} x2={c.x + 12} y1={c.y - 30} y2={c.y + c.h + 30} stroke={c.up ? C.green : C.red} strokeWidth={3} />
              <rect x={c.x} y={c.y} width={24} height={c.h} rx={3} fill={c.up ? C.green : C.red} />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
      {Array.from({ length: 14 }, (_, i) => {
        const x = random(`bx${i}`) * 1080;
        const y = random(`by${i}`) * 1300;
        const r = 30 + random(`br${i}`) * 90;
        const drift = Math.sin(frame / (40 + i * 7) + i) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r + drift,
              top: y - r - frame * (0.3 + random(`bs${i}`) * 0.4),
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: i % 3 === 0 ? C.gold : hue,
              opacity: 0.08 + random(`bo${i}`) * 0.1,
              filter: "blur(18px)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 560,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hue}55 0%, transparent 65%)`,
          filter: "blur(10px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Film grain + vignette that sit over everything. */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(130% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width={1080} height={1920}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
          </filter>
          <rect width={1080} height={1920} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** White/colored flash on a hard cut or impact. */
export const Flash: React.FC<{ at: number; color?: string; dur?: number; max?: number }> = ({ at, color = "#fff", dur = 8, max = 0.85 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + dur], [0, max, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />;
};

/** CSS light leak: warm blobs sweeping across with screen blending. */
export const LightLeak: React.FC<{ at: number; dur?: number; hue?: "warm" | "cool" }> = ({ at, dur = 26, hue = "warm" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], clamp);
  if (t <= 0 || t >= 1) return null;
  const o = Math.sin(t * Math.PI);
  const a = hue === "warm" ? "255,170,60" : "90,160,255";
  const b = hue === "warm" ? "255,80,40" : "160,90,255";
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o * 0.9 }}>
      <div
        style={{
          position: "absolute",
          left: -600 + t * 1400,
          top: -200 + t * 300,
          width: 1100,
          height: 1500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${a},0.9) 0%, rgba(${b},0.4) 35%, transparent 70%)`,
          filter: "blur(40px)",
          rotate: `${20 + t * 30}deg`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -500 + t * 600,
          bottom: -300,
          width: 900,
          height: 1100,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${b},0.7) 0%, transparent 65%)`,
          filter: "blur(50px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Thin top progress bar (a retention cue). */
export const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 10, background: "rgba(255,255,255,0.08)" }}>
      <div
        style={{
          width: `${(frame / total) * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${C.green}, ${C.gold})`,
          boxShadow: `0 0 16px ${C.green}`,
        }}
      />
    </div>
  );
};

/** Speed lines radiating from the centre (used on whips and impacts). */
export const SpeedLines: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 14, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], clamp);
  if (t <= 0 || t >= 1) return null;
  return (
    <AbsoluteFill style={{ opacity: Math.sin(t * Math.PI) * 0.5 }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: 36 }, (_, i) => {
          const ang = (i / 36) * Math.PI * 2 + random(`sl${i}`) * 0.1;
          const r1 = 380 + t * 500 + random(`sr${i}`) * 200;
          const r2 = r1 + 200 + random(`sq${i}`) * 300;
          return (
            <line
              key={i}
              x1={540 + Math.cos(ang) * r1}
              y1={800 + Math.sin(ang) * r1}
              x2={540 + Math.cos(ang) * r2}
              y2={800 + Math.sin(ang) * r2}
              stroke={color}
              strokeWidth={3 + random(`sw${i}`) * 5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
