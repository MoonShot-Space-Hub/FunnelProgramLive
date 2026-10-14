import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { wordFrame } from "../lib/timeline";
import { C, display } from "../theme";
import { clamp, easeIn } from "../lib/anim";
import { DrawPath } from "./ui";

const ArrowSign: React.FC<{ text: string; color: string; dir: "left" | "right"; glow?: number }> = ({ text, color, dir, glow = 0 }) => (
  <div style={{ position: "relative", width: 430, height: 120 }}>
    <svg width={430} height={120} style={{ position: "absolute", inset: 0, filter: glow ? `drop-shadow(0 0 ${glow * 30}px ${color})` : undefined }}>
      <path
        d={dir === "right" ? "M 0 10 L 360 10 L 425 60 L 360 110 L 0 110 Z" : "M 430 10 L 70 10 L 5 60 L 70 110 L 430 110 Z"}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={6}
      />
    </svg>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: dir === "left" ? 50 : 0,
        paddingRight: dir === "right" ? 50 : 0,
        fontFamily: display,
        fontSize: 64,
        color: "#fff",
        letterSpacing: 3,
      }}
    >
      {text}
    </div>
  </div>
);

export const ShortcutScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stop = wordFrame("shortcut", "stop") - from;
  const treating = wordFrame("shortcut", "treating") - from;
  const professional = wordFrame("shortcut", "professional") - from;
  const shortcut = wordFrame("shortcut", "shortcut") - from;

  const stopIn = spring({ frame: f - (stop - 2), fps, config: { damping: 9, mass: 0.6, stiffness: 240 } });
  const stopOut = interpolate(f, [treating + 10, treating + 20], [0, 1], { ...clamp, easing: easeIn });
  const fall = interpolate(f, [shortcut + 12, shortcut + 34], [0, 1], { ...clamp, easing: easeIn });
  const glow = interpolate(f, [professional - 2, professional + 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D1F2D 0%, #1E3B4F 55%, #2E5566 100%)" }}>
      {/* ground with a cliff on the right */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="abyss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0A1520" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
        </defs>
        <rect x={0} y={1000} width={1080} height={920} fill="url(#abyss)" />
        <path d="M 0 960 L 760 960 L 790 1010 L 760 1060 L 800 1130 L 770 1220 L 805 1320 L 780 1920 L 0 1920 Z" fill="#2F4A2F" />
        <path d="M 0 960 L 760 960 L 790 1010 L 760 1060 L 800 1130 L 770 1220 L 805 1320 L 780 1920" stroke="#466B3F" strokeWidth={8} fill="none" />
        {/* winding road to the goal */}
        <path d="M 360 1920 C 360 1500 120 1400 220 1180 C 300 1010 140 900 210 760 C 260 660 330 620 330 560" stroke="#C9B48A" strokeWidth={80} fill="none" strokeLinecap="round" />
        <path
          d="M 360 1920 C 360 1500 120 1400 220 1180 C 300 1010 140 900 210 760 C 260 660 330 620 330 560"
          stroke="#FFFFFF"
          strokeWidth={8}
          fill="none"
          strokeDasharray="40 34"
          strokeDashoffset={-f * 4}
        />
        {/* goal flag */}
        <line x1={330} y1={560} x2={330} y2={400} stroke="#EEE" strokeWidth={8} />
        <path d={`M 334 404 Q 390 ${414 + Math.sin(f / 4) * 10} 440 404 L 440 470 Q 390 ${480 + Math.sin(f / 4) * 10} 334 470 Z`} fill={C.green} />
        {/* signpost */}
        <rect x={612} y={640} width={26} height={330} fill="#7A5A3A" />
      </svg>

      <div style={{ position: "absolute", left: 420, top: 730, transformOrigin: "200px 60px", rotate: `${glow * -2}deg` }}>
        <ArrowSign text="THE PROCESS" color="#1C9C5B" dir="left" glow={glow} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 600,
          transformOrigin: "20px 60px",
          translate: `${fall * 200}px ${fall * 900}px`,
          rotate: `${fall * 80}deg`,
        }}
      >
        <ArrowSign text="SHORTCUT" color="#C93333" dir="right" />
        <svg width={430} height={120} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <DrawPath d="M 30 -10 L 400 130" at={shortcut} dur={6} color={C.white} width={20} length={420} />
          <DrawPath d="M 400 -10 L 30 130" at={shortcut + 4} dur={6} color={C.white} width={20} length={420} />
          <DrawPath d="M 30 -10 L 400 130" at={shortcut} dur={6} color={C.red} width={12} length={420} />
          <DrawPath d="M 400 -10 L 30 130" at={shortcut + 4} dur={6} color={C.red} width={12} length={420} />
        </svg>
      </div>

      {/* STOP sign */}
      {f >= stop - 2 && stopOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 230,
            top: 760 - 230,
            width: 460,
            height: 460,
            scale: `${interpolate(stopIn, [0, 1], [2.4, 1]) * (1 - stopOut * 0.6)}`,
            opacity: interpolate(stopIn, [0, 0.2], [0, 1], clamp) * (1 - stopOut),
            rotate: `${interpolate(stopIn, [0, 1], [-25, 0]) + stopOut * 30}deg`,
            translate: `${stopOut * -500}px ${stopOut * -200}px`,
          }}
        >
          <svg width={460} height={460} viewBox="-230 -230 460 460">
            <polygon
              points={Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
                return `${Math.cos(a) * 220},${Math.sin(a) * 220}`;
              }).join(" ")}
              fill="#E21D2E"
              stroke="#fff"
              strokeWidth={16}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontSize: 170, color: "#fff", letterSpacing: 6 }}>
            STOP
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
