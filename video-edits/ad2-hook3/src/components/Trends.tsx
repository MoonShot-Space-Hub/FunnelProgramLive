import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, COLOR, FONT, broll, clamp, easeInOut, easeOut } from "../lib";
import { BlurBackdrop } from "./BRollLayer";

type Pt = [number, number];

const UP: Pt[] = [[70, 590], [140, 500], [185, 540], [255, 400], [300, 440], [380, 170]];
const DOWN: Pt[] = [[380, 170], [440, 270], [480, 230], [545, 420], [590, 385], [660, 560]];
const SIDE: Pt[] = [[660, 560], [705, 505], [750, 575], [795, 510], [840, 570], [880, 530]];

const segLengths = (pts: Pt[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
const total = (pts: Pt[]) => segLengths(pts).reduce((a, b) => a + b, 0);
const pointAt = (pts: Pt[], frac: number): Pt => {
  const lens = segLengths(pts);
  let d = frac * total(pts);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = d / lens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

const PANEL = { w: 940, h: 700, cy: 780 };

/** Animated line chart that draws an uptrend, a downtrend and a sideways range in sync with the voice. */
export const Trends: React.FC<{ b: BRoll }> = ({ b }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = b.start + f / fps;

  const legs = [
    { pts: UP, win: b.up!, color: COLOR.green, label: "UPTREND", pos: [120, 120] as Pt },
    { pts: DOWN, win: b.down!, color: COLOR.red, label: "DOWNTREND", pos: [470, 112] as Pt },
    { pts: SIDE, win: b.side!, color: COLOR.yellow, label: "SIDEWAYS", pos: [640, 610] as Pt },
  ];
  const progress = legs.map((l) => interpolate(t, l.win, [0, 1], { ...clamp, easing: easeInOut }));
  const active = progress.findIndex((p) => p > 0 && p < 1);
  const lastDrawn = progress.reduce((acc, p, i) => (p > 0 ? i : acc), -1);
  const head = lastDrawn >= 0 ? pointAt(legs[lastDrawn].pts, progress[lastDrawn]) : null;
  const headColor = lastDrawn >= 0 ? legs[lastDrawn].color : "#fff";
  const panelIn = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill>
      <BlurBackdrop src={broll(b.image!)} brightness={0.3} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          translate: `0px ${-f * 0.6}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - PANEL.w / 2,
          top: PANEL.cy - PANEL.h / 2,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 44,
          background: "rgba(12,12,18,0.78)",
          border: "2px solid rgba(255,255,255,0.14)",
          boxShadow: "0 50px 120px rgba(0,0,0,0.6)",
          overflow: "hidden",
          scale: String(0.9 + 0.1 * panelIn),
          opacity: panelIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 44,
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: 34,
            letterSpacing: 10,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          MARKET TRENDS
        </div>
        <svg width={PANEL.w} height={PANEL.h} style={{ position: "absolute", inset: 0 }}>
          {[150, 280, 410, 540].map((y) => (
            <line key={y} x1={40} x2={PANEL.w - 40} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
          ))}
          {legs.map((l, i) => {
            const len = total(l.pts);
            return (
              <polyline
                key={l.label}
                points={l.pts.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke={l.color}
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - progress[i])}
                style={{ filter: `drop-shadow(0 0 14px ${l.color})` }}
              />
            );
          })}
          {head ? (
            <>
              <circle cx={head[0]} cy={head[1]} r={18 + 10 * Math.abs(Math.sin(f / 5))} fill={headColor} opacity={0.25} />
              <circle cx={head[0]} cy={head[1]} r={12} fill="#fff" stroke={headColor} strokeWidth={6} />
            </>
          ) : null}
        </svg>
        {legs.map((l, i) => {
          const startF = Math.round((l.win[0] - b.start) * fps);
          const s = spring({ frame: f - startF, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
          if (f < startF) return null;
          return (
            <div
              key={l.label}
              style={{
                position: "absolute",
                left: l.pos[0],
                top: l.pos[1],
                padding: "8px 22px 4px",
                borderRadius: 14,
                background: l.color,
                color: COLOR.ink,
                fontFamily: FONT.display,
                fontSize: 46,
                letterSpacing: 2,
                scale: String(s),
                opacity: active === -1 || active === i || progress[i] >= 1 ? 1 : 0.6,
                boxShadow: `0 10px 30px rgba(0,0,0,0.45)`,
              }}
            >
              {l.label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
