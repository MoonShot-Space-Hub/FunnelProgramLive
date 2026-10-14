import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, COLOR, FONT, clamp, easeOut } from "../lib";

const ICON_COLOR: Record<string, string> = {
  entry: COLOR.green,
  exit: "#4DA3FF",
  stop: COLOR.red,
  target: COLOR.yellow,
};

const Icon: React.FC<{ kind: string }> = ({ kind }) => {
  const stroke = kind === "target" ? COLOR.ink : "#fff";
  const common = { fill: "none", stroke, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={58} height={58} viewBox="0 0 24 24">
      {kind === "entry" ? (
        <>
          <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" {...common} />
          <path d="M10 17l5-5-5-5" {...common} />
          <path d="M15 12H3" {...common} />
        </>
      ) : null}
      {kind === "exit" ? (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...common} />
          <path d="M16 17l5-5-5-5" {...common} />
          <path d="M21 12H9" {...common} />
        </>
      ) : null}
      {kind === "stop" ? (
        <>
          <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" {...common} />
          <path d="M8 12h8" {...common} />
        </>
      ) : null}
      {kind === "target" ? (
        <>
          <circle cx={12} cy={12} r={10} {...common} />
          <circle cx={12} cy={12} r={6} {...common} />
          <circle cx={12} cy={12} r={2} {...common} />
        </>
      ) : null}
    </svg>
  );
};

/** "STEP 1" checklist: each rule slides in and gets ticked exactly when it is spoken. */
export const Checklist: React.FC<{ b: BRoll }> = ({ b }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleAt = Math.round(((b.title ?? b.start) - b.start) * fps);
  const sTitle = spring({ frame: f - titleAt, fps, config: { damping: 10, stiffness: 180, mass: 0.7 } });
  const bar = interpolate(f, [titleAt + 6, titleAt + 26], [0, 1], { ...clamp, easing: easeOut });
  const items = b.items ?? [];
  const activeIdx = items.reduce((acc, it, i) => (b.start + f / fps >= it[1] ? i : acc), -1);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1a060b 0%, #060203 100%)" }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(circle at 50% 18%, rgba(229,9,20,0.45) 0%, rgba(229,9,20,0) 55%)" }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          translate: `0px ${-f * 0.5}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 200,
          lineHeight: 1,
          color: COLOR.yellow,
          textShadow: "0 12px 40px rgba(0,0,0,0.6)",
          scale: String(Math.max(0, sTitle)),
          rotate: `${(1 - sTitle) * -8}deg`,
        }}
      >
        STEP 1
      </div>
      <div
        style={{
          position: "absolute",
          top: 410,
          left: 540 - 180,
          width: 360 * bar,
          height: 10,
          borderRadius: 10,
          background: "#fff",
        }}
      />
      {items.map(([label, at, kind], i) => {
        const startF = Math.round((at - b.start) * fps);
        if (f < startF) return null;
        const s = spring({ frame: f - startF, fps, config: { damping: 14, stiffness: 190, mass: 0.7 } });
        const check = interpolate(f, [startF + 8, startF + 20], [0, 1], { ...clamp, easing: easeOut });
        const isActive = i === activeIdx;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 100,
              top: 480 + i * 190,
              width: 880,
              height: 150,
              borderRadius: 36,
              background: isActive ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)",
              border: `3px solid ${isActive ? COLOR.yellow : "rgba(255,255,255,0.14)"}`,
              boxShadow: isActive ? `0 0 40px rgba(255,210,52,0.35)` : "none",
              translate: `${(1 - s) * 180}px 0px`,
              opacity: Math.min(1, (f - startF) / 4),
              filter: s < 0.9 ? `blur(${(1 - s) * 10}px)` : undefined,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                marginLeft: 22,
                width: 108,
                height: 108,
                borderRadius: 999,
                background: ICON_COLOR[kind],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(s),
              }}
            >
              <Icon kind={kind} />
            </div>
            <div
              style={{
                marginLeft: 34,
                flex: 1,
                fontFamily: FONT.sans,
                fontWeight: 900,
                fontSize: 70,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              {label}
            </div>
            <svg width={92} height={92} viewBox="0 0 92 92" style={{ marginRight: 30 }}>
              <circle cx={46} cy={46} r={40} fill={check > 0 ? COLOR.green : "none"} fillOpacity={check} stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
              <path
                d="M27 47 L40 60 L66 33"
                fill="none"
                stroke="#fff"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={60}
                strokeDashoffset={60 * (1 - check)}
              />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
