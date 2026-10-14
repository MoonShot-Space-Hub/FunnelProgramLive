import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C } from "../theme";
import { clamp, easeInOut } from "../lib/anim";

export const OvernightScene: React.FC<{ from: number; duration: number }> = ({ from, duration }) => {
  const f = useCurrentFrame();
  const overnight = wordFrame("overnight", "overnight") - from;
  const dawn = interpolate(f, [overnight - 6, duration], [0, 1], { ...clamp, easing: easeInOut });
  const top = interpolateColors(dawn, [0, 1], ["#0A0628", "#2B3E8C"]);
  const mid = interpolateColors(dawn, [0, 1], ["#1C1049", "#C2649A"]);
  const bot = interpolateColors(dawn, [0, 1], ["#3A1C5C", "#FFB067"]);
  const minute = f * 28;
  const hour = f * 2.4;
  const fill = interpolate(f, [6, duration], [0.04, 0.36], clamp);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${mid} 60%, ${bot} 100%)` }}>
      {Array.from({ length: 60 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`stx${i}`) * 1080,
            top: random(`sty${i}`) * 1200,
            width: 4 + random(`sts${i}`) * 5,
            height: 4 + random(`sts${i}`) * 5,
            borderRadius: "50%",
            background: "#fff",
            opacity: (0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i))) * (1 - dawn),
          }}
        />
      ))}
      {/* moon sets, sun rises */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 260 + dawn * 500,
          width: 170,
          height: 170,
          borderRadius: "50%",
          boxShadow: "-34px 18px 0 0 #FFF4C9",
          opacity: 1 - dawn,
          rotate: "-20deg",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 220,
          top: 1500 - dawn * 260,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FFE7A0 0%, #FFB347 55%, rgba(255,140,60,0) 72%)",
          opacity: dawn,
        }}
      />

      {/* spinning clock */}
      <div style={{ position: "absolute", left: 540 - 250, top: 480, width: 500, height: 500 }}>
        <svg width={500} height={500} viewBox="-250 -250 500 500">
          <circle r={238} fill="#F7F5FF" stroke="#C9C2F0" strokeWidth={16} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.sin(a) * 190} y1={-Math.cos(a) * 190} x2={Math.sin(a) * 215} y2={-Math.cos(a) * 215} stroke="#2A2350" strokeWidth={i % 3 === 0 ? 12 : 6} strokeLinecap="round" />;
          })}
          {[0.12, 0.25, 0.45].map((o, k) => (
            <line key={k} x1={0} y1={0} x2={0} y2={-170} stroke={C.purple} strokeWidth={14} strokeLinecap="round" opacity={o} transform={`rotate(${minute - (3 - k) * 9})`} />
          ))}
          <line x1={0} y1={0} x2={0} y2={-175} stroke="#2A2350" strokeWidth={14} strokeLinecap="round" transform={`rotate(${minute})`} />
          <line x1={0} y1={0} x2={0} y2={-110} stroke="#2A2350" strokeWidth={20} strokeLinecap="round" transform={`rotate(${hour})`} />
          <circle r={18} fill={C.red} />
        </svg>
      </div>

      {/* learning progress */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 1080 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: body, fontWeight: 800, fontSize: 30, color: C.white, opacity: 0.9 }}>
          <span>DAY 1</span>
          <span>DAY 30</span>
          <span>DAY 90</span>
        </div>
        <div style={{ marginTop: 14, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 15, background: `linear-gradient(90deg, ${C.green}, ${C.gold})`, boxShadow: `0 0 20px ${C.green}` }} />
        </div>
        <div style={{ marginTop: 12, fontFamily: body, fontWeight: 700, fontSize: 28, color: C.muted, letterSpacing: 4 }}>ONE STEP AT A TIME</div>
      </div>
    </AbsoluteFill>
  );
};
