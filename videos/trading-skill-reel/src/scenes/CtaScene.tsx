import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StudioBg } from "../components/Fx";
import { wordFrame } from "../lib/timeline";
import { body, C, display } from "../theme";
import { clamp, easeOut } from "../lib/anim";
import { Pill, PlayIcon, PopIn } from "./ui";

export const CtaScene: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const structured = wordFrame("cta", "structured") - from;
  const free = wordFrame("cta", "free") - from;
  const hour = wordFrame("cta", "one-hour") - from;
  const abct = wordFrame("cta", "abct") - from;
  const master = wordFrame("cta", "masterclass") - from;

  const card = interpolate(f, [2, 20], [0, 1], { ...clamp, easing: easeOut });
  const border = interpolate(f, [4, 30], [0, 1], { ...clamp, easing: easeOut });
  const pulse = 1 + Math.sin(f / 4) * 0.03;

  return (
    <AbsoluteFill>
      <StudioBg hue={C.purple} />
      {/* masterclass card */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 92,
          width: 900,
          height: 600,
          borderRadius: 40,
          padding: 6,
          background: `conic-gradient(from ${f * 2}deg, ${C.gold}, ${C.purple}, ${C.blue}, ${C.gold})`,
          clipPath: `inset(0 ${(1 - border) * 100}% 0 0 round 40px)`,
          opacity: card,
          translate: `0px ${(1 - card) * -60}px`,
          boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 ${60 * interpolate(f, [abct, abct + 10], [0, 1], clamp)}px ${C.gold}66`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "linear-gradient(160deg, #1B1F4A 0%, #0C0E22 70%)" }}>
          {/* structured path: education -> practice -> rules */}
          <div style={{ position: "absolute", left: 50, top: 46, display: "flex", alignItems: "center", gap: 14 }}>
            {["EDUCATION", "PRACTICE", "RULES"].map((s, i) => {
              const p = spring({ frame: f - (structured + i * 4), fps, config: { damping: 14 } });
              return (
                <React.Fragment key={s}>
                  <div
                    style={{
                      opacity: f < structured + i * 4 ? 0 : p,
                      translate: `${(1 - p) * -30}px 0px`,
                      padding: "8px 18px",
                      borderRadius: 12,
                      border: `3px solid ${[C.blue, C.green, C.gold][i]}`,
                      color: [C.blue, C.green, C.gold][i],
                      fontFamily: body,
                      fontWeight: 900,
                      fontSize: 26,
                      letterSpacing: 2,
                    }}
                  >
                    {s}
                  </div>
                  {i < 2 ? <div style={{ color: C.muted, fontFamily: body, fontWeight: 900, fontSize: 30, opacity: f < structured + i * 4 + 2 ? 0 : 1 }}>→</div> : null}
                </React.Fragment>
              );
            })}
          </div>

          <PopIn at={free - 2} style={{ left: 50, top: 132 }} rotate={-15}>
            <Pill color={C.green} text="FREE" size={46} dark />
          </PopIn>
          <PopIn at={hour - 2} style={{ left: 250, top: 132 }} rotate={15}>
            <Pill color={C.blue} text="1-HOUR" size={46} />
          </PopIn>

          <div style={{ position: "absolute", left: 50, top: 236, display: "flex" }}>
            {"ABCT WITH AI".split("").map((ch, i) => {
              const at = abct - 2 + i * 1.2;
              const s = spring({ frame: f - at, fps, config: { damping: 10, mass: 0.5 } });
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    fontFamily: display,
                    fontSize: 150,
                    lineHeight: 1.05,
                    color: i >= 10 ? C.green : C.gold,
                    opacity: f < at ? 0 : interpolate(s, [0, 0.3], [0, 1], clamp),
                    translate: `0px ${(1 - s) * 70}px`,
                    rotate: `${(1 - s) * 20}deg`,
                    textShadow: `0 0 40px ${i >= 10 ? C.green : C.gold}66, 0 8px 0 rgba(0,0,0,0.5)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: 54,
              top: 410,
              fontFamily: body,
              fontWeight: 900,
              fontSize: 66,
              letterSpacing: 16,
              color: C.white,
              clipPath: `inset(0 ${(1 - interpolate(f, [master - 2, master + 12], [0, 1], { ...clamp, easing: easeOut })) * 100}% 0 0)`,
            }}
          >
            MASTERCLASS
          </div>
          <div style={{ position: "absolute", left: 54, top: 500, fontFamily: body, fontWeight: 700, fontSize: 30, color: C.muted, opacity: interpolate(f, [master + 6, master + 16], [0, 1], clamp) }}>
            Learn trading the structured way
          </div>
          <div style={{ position: "absolute", right: 34, top: 30, scale: `${pulse}`, opacity: interpolate(f, [abct, abct + 8], [0, 1], clamp) }}>
            <PlayIcon size={104} bg={C.red} />
          </div>
        </div>
      </div>

    </AbsoluteFill>
  );
};

/** "LINK BELOW" button, drawn above the avatar. */
export const CtaForeground: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const link = wordFrame("cta", "link") - from;
  const btn = spring({ frame: f - (link - 2), fps, config: { damping: 10, mass: 0.6 } });
  const bounce = Math.abs(Math.sin((f - link) / 5)) * 22;
  const pulse = 1 + Math.sin(f / 4) * 0.03;
  return (
    <AbsoluteFill>
      {/* link below button */}
      {f >= link - 2 ? (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 1600,
            translate: "-50% 0",
            scale: `${interpolate(btn, [0, 1], [0.3, 1]) * pulse}`,
            opacity: interpolate(btn, [0, 0.3], [0, 1], clamp),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "22px 56px",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${C.green}, #19C77A)`,
              color: "#03140B",
              fontFamily: body,
              fontWeight: 900,
              fontSize: 54,
              letterSpacing: 2,
              whiteSpace: "nowrap",
              boxShadow: `0 0 50px ${C.green}AA, 0 14px 0 #0B6B3F`,
            }}
          >
            LINK BELOW
          </div>
          <svg width={90} height={90} viewBox="0 0 24 24" style={{ marginTop: 6, translate: `0px ${bounce}px` }}>
            <path d="M 4 6 L 12 14 L 20 6" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 4 12 L 12 20 L 20 12" stroke={C.green} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
