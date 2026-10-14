import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp } from "../lib/anim";
import { CountBadge, PlayIcon } from "./ui";

type Thumb = { title: string; sub: string; bg: [string, string]; art: "rocket" | "chart" | "cash"; views: string };

const THUMBS: Thumb[] = [
  { title: "100X IN 1 DAY", sub: "Beginner trick", bg: ["#0B6E3A", "#03200F"], art: "chart", views: "2.4M views" },
  { title: "SECRET STRATEGY", sub: "Banks hate this", bg: ["#5B1FA8", "#1A0636"], art: "rocket", views: "980K views" },
  { title: "EASY MONEY", sub: "No experience needed", bg: ["#A8501F", "#2E1203"], art: "cash", views: "3.1M views" },
];

const Art: React.FC<{ kind: Thumb["art"] }> = ({ kind }) => {
  if (kind === "chart") {
    return (
      <g>
        <path d="M 330 250 L 380 210 L 420 230 L 470 150 L 510 170 L 560 60" stroke={C.green} strokeWidth={14} fill="none" strokeLinejoin="round" />
        <path d="M 520 60 L 566 54 L 560 100" stroke={C.green} strokeWidth={14} fill="none" strokeLinejoin="round" />
      </g>
    );
  }
  if (kind === "rocket") {
    return (
      <g transform="translate(470 150) rotate(35)">
        <path d="M 0 -110 Q 50 -60 40 40 L -40 40 Q -50 -60 0 -110 Z" fill="#F1F3F8" />
        <circle cx={0} cy={-30} r={18} fill="#3D8BFF" />
        <path d="M -40 10 L -70 60 L -36 40 Z M 40 10 L 70 60 L 36 40 Z" fill={C.red} />
        <path d="M -24 40 Q 0 120 24 40 Z" fill={C.gold} />
      </g>
    );
  }
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={380 + i * 22} y={170 - i * 34} width={180} height={90} rx={10} fill="#3DBE6B" stroke="#1F7A40" strokeWidth={5} />
      ))}
      <circle cx={470} cy={170 - 2 * 34 + 45} r={28} fill="#1F7A40" />
    </g>
  );
};

const ThumbCard: React.FC<{ t: Thumb; progress: number }> = ({ t, progress }) => (
  <div style={{ width: 600, borderRadius: 24, overflow: "hidden", background: "#121212", boxShadow: "0 30px 70px rgba(0,0,0,0.7)" }}>
    <div style={{ position: "relative", height: 300 }}>
      <svg width={600} height={300} viewBox="0 0 600 300">
        <defs>
          <linearGradient id={`tg-${t.art}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={t.bg[0]} />
            <stop offset="1" stopColor={t.bg[1]} />
          </linearGradient>
        </defs>
        <rect width={600} height={300} fill={`url(#tg-${t.art})`} />
        <Art kind={t.art} />
        <text x={28} y={120} fontFamily={display} fontSize={78} fill={C.gold} stroke="#000" strokeWidth={6} paintOrder="stroke">
          {t.title.split(" ").slice(0, 2).join(" ")}
        </text>
        <text x={28} y={200} fontFamily={display} fontSize={78} fill={C.white} stroke="#000" strokeWidth={6} paintOrder="stroke">
          {t.title.split(" ").slice(2).join(" ")}
        </text>
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "50%", translate: "-50% -50%", opacity: 0.9 }}>
        <PlayIcon size={84} bg="rgba(255,0,0,0.85)" color="#fff" />
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 10, background: "rgba(255,255,255,0.25)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "#FF0000" }} />
      </div>
    </div>
    <div style={{ padding: "14px 22px", fontFamily: body }}>
      <div style={{ color: C.white, fontWeight: 800, fontSize: 30 }}>{t.sub}</div>
      <div style={{ color: C.muted, fontWeight: 600, fontSize: 22 }}>{t.views}</div>
    </div>
  </div>
);

const POS = [
  { x: 60, y: 330, r: -7 },
  { x: 400, y: 560, r: 5 },
  { x: 110, y: 790, r: -3 },
];

export const YouTubeScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ats = [wordFrame("youtube", "three"), wordFrame("youtube", "youtube"), wordFrame("youtube", "videos")].map((a) => a - from - 3);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 40%, #3A0B14 0%, #12040A 60%, #060205 100%)" }}>
      <AbsoluteFill style={{ opacity: 0.1, background: "repeating-linear-gradient(0deg, #fff 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 60px)" }} />
      {THUMBS.map((t, i) => {
        const s = spring({ frame: f - ats[i], fps, config: { damping: 13, mass: 0.7 } });
        if (f < ats[i]) return null;
        const p = POS[i];
        return (
          <div
            key={t.title}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              translate: `${(1 - s) * (i % 2 === 0 ? -700 : 700)}px ${Math.sin(f / 15 + i) * 6}px`,
              rotate: `${p.r + (1 - s) * (i % 2 === 0 ? -25 : 25)}deg`,
              scale: "0.92",
            }}
          >
            <ThumbCard t={t} progress={interpolate(f - ats[i], [0, 26], [0, 1], clamp)} />
            <div style={{ position: "absolute", left: -34, top: -38, scale: `${s}` }}>
              <CountBadge n={i + 1} color={C.red} size={110} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
