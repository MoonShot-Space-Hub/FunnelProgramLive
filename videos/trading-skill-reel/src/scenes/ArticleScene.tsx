import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { wordFrame } from "../lib/timeline";
import { body, C, display, hand } from "../theme";
import { clamp, easeInOut, easeOut } from "../lib/anim";
import { CountBadge, Cursor, DrawPath, PopIn } from "./ui";

const LINES = [0.95, 0.88, 0.92, 0.6, 0.97, 0.85, 0.9, 0.7, 0.93, 0.8, 0.55];

export const ArticleScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const one = wordFrame("plane", "one") - from;
  const article = wordFrame("plane", "article") - from;
  const tilt = interpolate(f, [0, 50], [1, 0], { ...clamp, easing: easeOut });
  const scroll = interpolate(f, [8, 44], [0, -150], { ...clamp, easing: easeInOut });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 30%, #173A6B 0%, #08152B 60%, #040913 100%)" }}>
      {/* faint diagonal lines */}
      <AbsoluteFill style={{ opacity: 0.08, background: "repeating-linear-gradient(-45deg, #fff 0 2px, transparent 2px 46px)" }} />
      <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 420,
            width: 860,
            height: 780,
            borderRadius: 30,
            background: "#FBFBFD",
            overflow: "hidden",
            transform: `rotateY(${-22 * tilt - 6}deg) rotateX(${8 * tilt + 4}deg) rotateZ(${-2 * tilt}deg)`,
            boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ height: 70, background: "#E9ECF2", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: c }} />
            ))}
            <div style={{ marginLeft: 20, flex: 1, height: 40, borderRadius: 20, background: "#fff", color: "#5A6275", fontFamily: body, fontWeight: 600, fontSize: 22, display: "flex", alignItems: "center", paddingLeft: 20 }}>
              myblog.com/fly-a-plane
            </div>
          </div>
          <div style={{ translate: `0px ${scroll}px`, padding: "0 0 40px" }}>
            <svg width={860} height={300} viewBox="0 0 860 300">
              <defs>
                <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3C8CE7" />
                  <stop offset="1" stopColor="#A9D8FF" />
                </linearGradient>
              </defs>
              <rect width={860} height={300} fill="url(#skyA)" />
              <ellipse cx={180} cy={220} rx={140} ry={40} fill="#fff" opacity={0.9} />
              <ellipse cx={660} cy={110} rx={120} ry={32} fill="#fff" opacity={0.8} />
              <g transform={`translate(${380 + f * 2} 140) rotate(-8)`}>
                <path d="M -110 0 Q -110 -22 -80 -22 L 90 -22 Q 130 -18 140 0 Q 130 18 90 22 L -80 22 Q -110 22 -110 0 Z" fill="#fff" />
                <path d="M -20 0 L 30 70 L 60 70 L 30 0 Z" fill="#C9D3DE" />
                <path d="M -100 -18 L -120 -70 L -90 -70 L -60 -20 Z" fill="#E94F4F" />
              </g>
            </svg>
            <div style={{ padding: "30px 44px 0" }}>
              <div style={{ fontFamily: body, fontWeight: 900, fontSize: 64, color: "#11131A", lineHeight: 1.05 }}>How To Fly A Plane</div>
              <div style={{ position: "relative", display: "inline-block", marginTop: 16, fontFamily: body, fontWeight: 700, fontSize: 30, color: "#6B7385" }}>
                By Random Guy &nbsp;·&nbsp; <span style={{ color: "#11131A" }}>5 min read</span>
              </div>
              <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 20 }}>
                {LINES.map((w, i) => (
                  <div key={i} style={{ height: 20, width: `${w * 100}%`, borderRadius: 10, background: "#DDE1E9" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* annotation around "5 min read" */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <DrawPath d="M 610 744 C 690 748 700 798 616 808 C 520 820 410 812 408 778 C 406 744 500 734 618 742" at={article} dur={12} color={C.gold} width={9} length={900} />
      </svg>
      <PopIn at={article + 8} style={{ left: 560, top: 800 }} rotate={14}>
        <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 92, color: C.gold, rotate: "-6deg", textShadow: "0 6px 0 rgba(0,0,0,0.5)" }}>
          5 minutes?!
        </div>
      </PopIn>

      <PopIn at={one} style={{ left: 70, top: 360 }} rotate={-30}>
        <CountBadge n={1} color={C.blue} size={124} />
      </PopIn>
      <PopIn at={one + 4} style={{ left: 214, top: 376 }}>
        <div
          style={{
            fontFamily: display,
            fontSize: 56,
            color: C.white,
            letterSpacing: 2,
            padding: "4px 24px",
            borderRadius: 16,
            background: "rgba(10,12,20,0.92)",
            border: `3px solid ${C.blue}`,
          }}
        >
          JUST ONE ARTICLE
        </div>
      </PopIn>

      <div style={{ position: "absolute", left: 760, top: interpolate(f, [0, 40], [1180, 980], { ...clamp, easing: easeOut }) }}>
        <Cursor size={80} />
      </div>
    </AbsoluteFill>
  );
};
