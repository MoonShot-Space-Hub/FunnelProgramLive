import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C } from "../theme";
import { clamp, easeOut } from "../lib/anim";
import { Stamp } from "./ui";

const ecgPath = (offset: number) => {
  // repeating PQRST pattern scrolled by `offset`
  const pts: string[] = [];
  for (let x = 0; x <= 330; x += 3) {
    const p = (x + offset) % 110;
    let y = 120;
    if (p > 40 && p < 46) y = 120 - (p - 40) * 4;
    else if (p >= 46 && p < 52) y = 96 + (p - 46) * 22;
    else if (p >= 52 && p < 58) y = 228 - (p - 52) * 26;
    else if (p >= 58 && p < 64) y = 72 + (p - 58) * 8;
    else if (p >= 75 && p < 90) y = 120 - Math.sin(((p - 75) / 15) * Math.PI) * 14;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(" L ")}`;
};

export const SurgeryScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const operating = wordFrame("surgery", "operating") - from;
  const somebody = wordFrame("surgery", "somebody") - from;
  const handIn = interpolate(f, [operating - 6, operating + 8], [0, 1], { ...clamp, easing: easeOut });
  const tremble = Math.sin(f * 2.1) * 6 + Math.sin(f * 3.7) * 4;
  const alarm = f > somebody ? (Math.sin((f - somebody) / 2.2) + 1) / 2 : 0;
  const swing = Math.sin(f / 14) * 3;
  const bpm = Math.round(interpolate(f, [0, somebody + 10], [92, 168], clamp));

  return (
    <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 45% 35%, #12625D 0%, #052322 55%, #020D0D 100%)" }}>
      {/* lamp + light cone */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "400px 0px", rotate: `${swing}deg` }}>
        <svg width={1080} height={1300}>
          <defs>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E9FFFD" stopOpacity={0.35} />
              <stop offset="1" stopColor="#E9FFFD" stopOpacity={0} />
            </linearGradient>
            <radialGradient id="bulb" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.6" stopColor="#FFF6CC" />
              <stop offset="1" stopColor="#FFE58A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={392} y={0} width={16} height={200} fill="#9FB7B5" />
          <path d="M 260 360 L 540 360 L 900 1120 L -100 1120 Z" fill="url(#cone)" />
          <ellipse cx={400} cy={330} rx={190} ry={70} fill="#D7E6E4" />
          <ellipse cx={400} cy={315} rx={170} ry={55} fill="#AFC6C3" />
          {[-110, -55, 0, 55, 110].map((dx) => (
            <circle key={dx} cx={400 + dx} cy={350} r={26} fill="url(#bulb)" />
          ))}
          <circle cx={400} cy={355} r={140} fill="url(#bulb)" opacity={0.35} />
        </svg>
      </div>

      {/* heart monitor */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 560,
          width: 380,
          height: 270,
          borderRadius: 26,
          background: "#061412",
          border: "10px solid #24403D",
          boxShadow: `0 0 ${30 + alarm * 40}px ${alarm > 0 ? C.red : "#1AFF9C"}55`,
          overflow: "hidden",
        }}
      >
        <svg width={360} height={250} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={ecgPath(f * 9)} stroke={alarm > 0.5 ? C.red : "#3CFFB0"} strokeWidth={5} fill="none" />
        </svg>
        <div style={{ position: "absolute", right: 18, top: 10, fontFamily: body, fontWeight: 900, fontSize: 44, color: alarm > 0.5 ? C.red : "#3CFFB0" }}>
          {bpm}
        </div>
        <div style={{ position: "absolute", right: 20, top: 62, fontFamily: body, fontWeight: 700, fontSize: 20, color: C.muted }}>BPM</div>
      </div>

      {/* operating table + patient */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={110} y={1080} width={860} height={36} rx={14} fill="#9DB1B0" />
        <rect x={500} y={1116} width={80} height={180} fill="#5E7271" />
        <circle cx={250} cy={1000} r={64} fill="#C68B59" />
        <path d="M 192 990 Q 250 920 312 990 Z" fill="#7FC9C1" />
        <path d="M 300 1080 Q 320 960 460 960 Q 620 940 760 975 Q 900 990 930 1080 Z" fill="#2E9C8F" />
        <path d="M 330 1000 Q 520 960 900 1010" stroke="#25867A" strokeWidth={6} fill="none" />
      </svg>

      {/* gloved hand with scalpel, trembling */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 700,
          translate: `${(1 - handIn) * 600 + tremble}px ${(1 - handIn) * -200 + tremble * 0.6}px`,
          rotate: `${-18 + tremble * 0.4}deg`,
        }}
      >
        <svg width={520} height={300} viewBox="0 0 520 300">
          <path d="M 40 150 L 210 130 L 216 152 L 40 168 Z" fill="#E7EEF3" stroke="#8796A3" strokeWidth={3} />
          <path d="M 10 160 Q 30 140 44 150 L 44 168 Q 24 172 10 160 Z" fill="#F7FBFF" stroke="#8796A3" strokeWidth={3} />
          <rect x={200} y={118} width={170} height={64} rx={30} fill="#8EC5FF" />
          <rect x={190} y={150} width={120} height={34} rx={17} fill="#8EC5FF" />
          <rect x={196} y={100} width={130} height={30} rx={15} fill="#8EC5FF" />
          <rect x={340} y={110} width={180} height={90} rx={36} fill="#6FB2F7" />
        </svg>
      </div>

      {/* red alarm wash */}
      <AbsoluteFill style={{ background: C.red, opacity: alarm * 0.22, mixBlendMode: "screen" }} />
      <Stamp at={somebody + 2} text="UNQUALIFIED" x={540} y={640} size={118} angle={-9} />
    </AbsoluteFill>
  );
};
