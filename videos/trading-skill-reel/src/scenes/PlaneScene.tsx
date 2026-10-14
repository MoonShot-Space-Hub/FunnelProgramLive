import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { wordFrame } from "../lib/timeline";
import { C, display } from "../theme";
import { clamp } from "../lib/anim";

const Cloud: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <svg width={420 * s} height={170 * s} viewBox="0 0 420 170" style={{ position: "absolute", left: x, top: y, opacity: o }}>
    <g fill="#FFFFFF">
      <ellipse cx={110} cy={110} rx={100} ry={55} />
      <ellipse cx={210} cy={80} rx={110} ry={75} />
      <ellipse cx={310} cy={110} rx={100} ry={55} />
      <rect x={60} y={110} width={300} height={55} rx={27} />
    </g>
  </svg>
);

export const PlaneScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const fly = wordFrame("plane", "fly") - from;
  const plane = wordFrame("plane", "plane") - from;
  const panic = interpolate(f, [fly - 4, plane + 4], [0.4, 1.4], clamp);
  const rot = (Math.sin(f / 4.5) * 9 + Math.sin(f / 2.2) * 4) * panic + interpolate(f, [plane, plane + 18], [0, 22], clamp);
  const bob = Math.sin(f / 6) * 45 * panic + interpolate(f, [plane, plane + 18], [0, 160], clamp);
  const warn = f >= plane ? (Math.floor((f - plane) / 4) % 2 === 0 ? 1 : 0.25) : 0;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #123A7A 0%, #3D7BD0 45%, #9CC7F0 75%, #F6B98A 100%)" }}>
      {Array.from({ length: 10 }, (_, i) => {
        const speed = 10 + random(`cs${i}`) * 26;
        const s = 0.5 + random(`cz${i}`) * 1.1;
        const x = 1200 - ((f * speed + random(`cx${i}`) * 1600) % 1700);
        const y = random(`cy${i}`) * 1500 + 150;
        return <Cloud key={i} x={x} y={y} s={s} o={0.35 + s * 0.35} />;
      })}

      {/* speed streaks */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 0.4 }}>
        {Array.from({ length: 14 }, (_, i) => {
          const y = 200 + random(`sy${i}`) * 1300;
          const x = 1080 - ((f * 60 + random(`sx${i}`) * 2000) % 2200);
          return <line key={i} x1={x} y1={y} x2={x + 240} y2={y} stroke="#fff" strokeWidth={4} strokeLinecap="round" />;
        })}
      </svg>

      {/* smoke trail */}
      {Array.from({ length: 9 }, (_, i) => {
        const age = (f + i * 4) % 36;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 250 - age * 12,
              top: 820 + bob * 0.6 + Math.sin(i) * 20,
              width: 60 + age * 4,
              height: 60 + age * 4,
              borderRadius: "50%",
              background: "#3A3F4A",
              opacity: (1 - age / 36) * 0.55 * Math.min(1, panic),
              filter: "blur(4px)",
            }}
          />
        );
      })}

      {/* plane */}
      <div style={{ position: "absolute", left: 150, top: 560, translate: `0px ${bob}px`, rotate: `${rot}deg`, transformOrigin: "390px 220px" }}>
        <svg width={780} height={440} viewBox="0 0 780 440">
          <path d="M 120 140 L 60 20 L 150 20 L 240 140 Z" fill={C.red} />
          <path d="M 70 230 Q 60 150 160 140 L 600 140 Q 720 150 760 220 Q 720 290 600 300 L 160 300 Q 70 300 70 230 Z" fill="#FFFFFF" />
          <path d="M 80 245 L 750 230" stroke={C.blue} strokeWidth={14} />
          <path d="M 650 165 Q 720 175 740 215 L 660 215 Z" fill="#1E3A6E" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={210 + i * 46} y={180} width={24} height={30} rx={10} fill="#2B4C85" />
          ))}
          <path d="M 300 250 L 470 250 L 330 420 L 250 420 Z" fill="#BCC8D6" />
          <rect x={300} y={300} width={110} height={44} rx={22} fill="#7D8A9B" />
          <path d="M 140 240 L 40 330 L 100 330 L 210 250 Z" fill="#BCC8D6" />
        </svg>
      </div>

      {/* cockpit warning */}
      {f >= plane ? (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 650,
            translate: "-50% -50%",
            opacity: warn,
            padding: "10px 40px",
            border: `10px solid ${C.red}`,
            borderRadius: 18,
            background: "rgba(40,0,0,0.75)",
            fontFamily: display,
            fontSize: 130,
            color: C.red,
            letterSpacing: 6,
            textShadow: `0 0 30px ${C.red}`,
            whiteSpace: "nowrap",
          }}
        >
          PULL UP!
        </div>
      ) : null}
      <AbsoluteFill style={{ background: C.red, opacity: f >= plane ? warn * 0.15 : 0, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
