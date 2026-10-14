import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { StudioBg } from "../components/Fx";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp, easeOut } from "../lib/anim";
import { CountBadge, PlayIcon, PopIn } from "./ui";

/** Surgery video thumbnail illustration. */
export const SurgeryThumb: React.FC<{ w: number; h: number; frame: number }> = ({ w, h, frame }) => (
  <svg width={w} height={h} viewBox="0 0 760 330">
    <defs>
      <linearGradient id="orbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0E6B66" />
        <stop offset="1" stopColor="#06302E" />
      </linearGradient>
      <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#BFEDEA" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={760} height={330} fill="url(#orbg)" />
    <circle cx={140} cy={60} r={120} fill="url(#lamp)" opacity={0.5} />
    <circle cx={140} cy={60} r={60} fill="#E6F7F5" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle key={i} cx={140 + Math.cos((i / 6) * Math.PI * 2) * 34} cy={60 + Math.sin((i / 6) * Math.PI * 2) * 34} r={12} fill="#FFF8D6" />
    ))}
    {/* surgeon */}
    <circle cx={590} cy={150} r={78} fill="#C68B59" />
    <path d="M 512 140 Q 520 60 590 58 Q 662 60 668 140 Z" fill="#2BB3A6" />
    <path d="M 520 160 Q 590 140 660 160 L 650 215 Q 590 240 530 215 Z" fill="#E9F3F6" />
    <circle cx={562} cy={145} r={9} fill="#1A1A1A" />
    <circle cx={618} cy={145} r={9} fill="#1A1A1A" />
    <path d="M 480 330 Q 500 240 590 236 Q 680 240 700 330 Z" fill="#2BB3A6" />
    {/* heartbeat */}
    <path
      d="M 0 290 L 120 290 L 140 250 L 160 320 L 180 270 L 200 290 L 330 290 L 350 245 L 370 320 L 390 275 L 410 290 L 760 290"
      stroke="#3CFFB0"
      strokeWidth={5}
      fill="none"
      strokeDasharray={1400}
      strokeDashoffset={1400 - ((frame * 22) % 1400)}
    />
    <text x={36} y={200} fontFamily={display} fontSize={74} fill={C.gold} stroke="#000" strokeWidth={3} paintOrder="stroke">
      SURGERY IN
    </text>
    <text x={36} y={268} fontFamily={display} fontSize={74} fill={C.white} stroke="#000" strokeWidth={3} paintOrder="stroke">
      10 MINUTES
    </text>
  </svg>
);

export const VideoCard: React.FC<{
  frame: number;
  title: string;
  meta: string;
  thumb: React.ReactNode;
  progress: number;
  width?: number;
}> = ({ title, meta, thumb, progress, width = 760 }) => (
  <div
    style={{
      width,
      borderRadius: 28,
      overflow: "hidden",
      background: "#12151C",
      boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.08)",
    }}
  >
    <div style={{ position: "relative" }}>
      {thumb}
      <div style={{ position: "absolute", left: "58%", top: "62%", translate: "-50% -50%" }}>
        <PlayIcon size={80} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 20,
          padding: "4px 12px",
          borderRadius: 8,
          background: "rgba(0,0,0,0.8)",
          color: C.white,
          fontFamily: body,
          fontWeight: 800,
          fontSize: 26,
        }}
      >
        10:02
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 9, width: "100%", background: "rgba(255,255,255,0.25)" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "#FF2D2D" }} />
      </div>
    </div>
    <div style={{ padding: "16px 24px 20px", display: "flex", gap: 18, alignItems: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#FF5F6D,#FFC371)" }} />
      <div>
        <div style={{ color: C.white, fontFamily: body, fontWeight: 800, fontSize: 32 }}>{title}</div>
        <div style={{ color: C.muted, fontFamily: body, fontWeight: 600, fontSize: 24 }}>{meta}</div>
      </div>
    </div>
  </div>
);

export const IntroScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const one = wordFrame("surgery", "one") - from;
  const surgery = wordFrame("surgery", "surgery") - from;
  const enter = interpolate(f, [2, 18], [0, 1], { ...clamp, easing: easeOut });
  const bump = interpolate(f, [surgery, surgery + 4, surgery + 12], [1, 1.06, 1], clamp);

  return (
    <AbsoluteFill>
      <StudioBg />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 96,
          opacity: enter,
          translate: `0px ${(1 - enter) * -120 + Math.sin(f / 18) * 6}px`,
          rotate: `${(1 - enter) * -8 + Math.sin(f / 25) * 0.8}deg`,
          scale: `${bump}`,
          filter: `blur(${(1 - enter) * 12}px)`,
        }}
      >
        <VideoCard
          frame={f}
          title="Surgery for Beginners"
          meta="MedTube • 1.2M views"
          thumb={<SurgeryThumb w={760} h={300} frame={f} />}
          progress={interpolate(f, [0, 70], [0.05, 0.92], clamp)}
        />
      </div>
      <PopIn at={one} style={{ left: 104, top: 52 }} rotate={-30}>
        <CountBadge n={1} color={C.red} size={124} />
      </PopIn>
      <PopIn at={one + 4} style={{ left: 248, top: 66 }} rotate={8}>
        <div
          style={{
            fontFamily: display,
            fontSize: 58,
            color: C.white,
            letterSpacing: 2,
            padding: "4px 26px",
            borderRadius: 16,
            background: "rgba(10,12,20,0.92)",
            border: `3px solid ${C.red}`,
          }}
        >
          JUST ONE VIDEO
        </div>
      </PopIn>
    </AbsoluteFill>
  );
};
