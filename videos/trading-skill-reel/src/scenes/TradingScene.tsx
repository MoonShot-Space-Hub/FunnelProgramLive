import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp, easeIn } from "../lib/anim";
import { Cursor, PopIn, Ripple } from "./ui";

const N = 22;
const CHART_H = 360;

const inr = (v: number) => {
  const s = Math.round(v).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
};

export const TradingScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const operating = wordFrame("youtube", "operating") - from;
  const their = wordFrame("youtube", "their") - from;
  const crash = wordFrame("youtube", "account") - from - 4;

  // candles: first 14 choppy, the rest plunge after the crash starts
  const candles = Array.from({ length: N }, (_, i) => {
    let o: number;
    let c: number;
    if (i < 14) {
      o = 180 + Math.sin(i * 1.3) * 30 + random(`o${i}`) * 25;
      c = o + (random(`c${i}`) - 0.45) * 95;
    } else {
      const k = i - 14;
      o = 200 + k * 26;
      c = o + 30 + random(`d${i}`) * 18;
    }
    return { o, c };
  });
  const shown = Math.min(14, Math.floor(f / 2.2) + 4) + (f > crash ? Math.min(8, Math.floor((f - crash) / 2)) : 0);

  const fall = interpolate(f, [crash, crash + 22], [0, 1], { ...clamp, easing: easeIn });
  const balance = 100000 - fall * 61580;
  const pct = -fall * 61.58;
  const shakeX = f > crash ? Math.sin(f * 2.7) * 10 * (1 - fall * 0.5) : 0;

  // cursor path: rest -> BUY (click) -> BUY again
  const cx = interpolate(f, [0, operating - 2, their - 2], [840, 480, 488], clamp);
  const cy = interpolate(f, [0, operating - 2, their - 2], [1320, 1150, 1156], clamp);
  const pressed = (at: number) => (f >= at && f < at + 4 ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 40%, #0F1E3D 0%, #060B18 70%)" }}>
      <AbsoluteFill style={{ background: C.red, opacity: fall * 0.25 * (0.6 + 0.4 * Math.sin(f / 2)), mixBlendMode: "screen" }} />
      <div
        style={{
          position: "absolute",
          left: 230,
          top: 400,
          width: 620,
          height: 860,
          borderRadius: 64,
          background: "#0A0D14",
          border: "14px solid #232A3A",
          boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 ${fall * 80}px ${C.red}88`,
          overflow: "hidden",
          translate: `${shakeX}px 0px`,
          rotate: `${fall * -3}deg`,
        }}
      >
        <div style={{ padding: "48px 40px 0", fontFamily: body }}>
          <div style={{ color: C.muted, fontWeight: 700, fontSize: 26, letterSpacing: 2 }}>MY TRADING ACCOUNT</div>
          <div style={{ color: fall > 0.02 ? C.red : C.white, fontWeight: 900, fontSize: 76, marginTop: 6 }}>₹{inr(balance)}</div>
          <div style={{ color: fall > 0.02 ? C.red : C.green, fontWeight: 800, fontSize: 32 }}>
            {pct <= -0.01 ? `▼ ${pct.toFixed(1)}%` : "▲ +0.0%"}
          </div>
        </div>
        <svg width={592} height={CHART_H + 40} style={{ marginTop: 20 }}>
          {[0, 1, 2, 3].map((g) => (
            <line key={g} x1={0} x2={592} y1={20 + g * 110} y2={20 + g * 110} stroke="#1A2235" strokeWidth={2} />
          ))}
          {candles.slice(0, shown).map((k, i) => {
            const up = k.c < k.o;
            const top = Math.min(k.o, k.c);
            const h = Math.max(6, Math.abs(k.c - k.o));
            const col = i >= 14 ? C.red : up ? C.green : C.red;
            const x = 22 + i * 25;
            return (
              <g key={i}>
                <line x1={x + 8} x2={x + 8} y1={top - 18} y2={top + h + 18} stroke={col} strokeWidth={3} />
                <rect x={x - 2} y={top} width={20} height={h} rx={3} fill={col} />
              </g>
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 44, display: "flex", gap: 22 }}>
          <div style={{ flex: 1, height: 96, borderRadius: 24, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: body, fontWeight: 900, fontSize: 40, color: "#04140B", scale: `${1 - (pressed(operating) + pressed(their)) * 0.06}` }}>
            BUY
          </div>
          <div style={{ flex: 1, height: 96, borderRadius: 24, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: body, fontWeight: 900, fontSize: 40, color: C.white }}>
            SELL
          </div>
        </div>
      </div>
      <Ripple at={operating} x={480} y={1150} color={C.green} />
      <Ripple at={their} x={488} y={1156} color={C.green} />
      <div style={{ position: "absolute", left: cx - 8, top: cy - 6 }}>
        <Cursor size={84} pressed={pressed(operating) + pressed(their)} />
      </div>
      <PopIn at={crash + 8} style={{ left: 50, top: 190 }} rotate={-20} damping={8}>
        <div style={{ fontFamily: display, fontSize: 170, color: C.red, rotate: "-8deg", textShadow: `0 0 40px ${C.red}, 0 10px 0 #3A0008` }}>-61%</div>
      </PopIn>
    </AbsoluteFill>
  );
};
