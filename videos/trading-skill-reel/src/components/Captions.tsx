import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { msToFrame, Phrase, TL } from "../lib/timeline";
import { body, C, display } from "../theme";

/** Scenes whose big on-screen typography already shows the spoken words. */
const HIDDEN_SCENES = new Set(["why", "pillars"]);

const PAGES = TL.phrases.filter((p) => !HIDDEN_SCENES.has(p.scene));

const EMPHASIS_COLORS: Record<string, string> = {
  surgery: C.red,
  plane: C.gold,
  youtube: C.red,
  skill: C.gold,
  overnight: C.gold,
  shortcut: C.red,
  cta: C.green,
};

const pageWindow = (p: Phrase, i: number) => {
  const next = PAGES[i + 1];
  const start = msToFrame(p.startMs) - 3;
  const naturalEnd = msToFrame(p.endMs) + 10;
  const end = next ? Math.min(naturalEnd, msToFrame(next.startMs) - 3) : naturalEnd + 20;
  return { start, end };
};

/** Black gradient that rises under the captions while they are on screen. */
const CaptionGradient: React.FC = () => {
  const frame = useCurrentFrame();
  let vis = 0;
  PAGES.forEach((p, i) => {
    const { start, end } = pageWindow(p, i);
    const v = interpolate(frame, [start - 8, start, end, end + 10], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    vis = Math.max(vis, v);
  });
  return (
    <AbsoluteFill
      style={{
        opacity: vis,
        translate: `0px ${(1 - vis) * 80}px`,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 58%)",
      }}
    />
  );
};

const CaptionPage: React.FC<{ page: Phrase; start: number; end: number }> = ({ page, start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = EMPHASIS_COLORS[page.scene] ?? C.gold;
  const exit = interpolate(frame, [end - 5, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < start - 2 || frame > end) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1290,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        columnGap: 30,
        rowGap: 4,
        opacity: 1 - exit,
        translate: `0px ${-exit * 30}px`,
        filter: `blur(${exit * 8}px)`,
      }}
    >
      {page.words.map((w, i) => {
        const wf = msToFrame(w.startMs);
        const we = msToFrame(w.endMs);
        const s = spring({ frame: frame - (wf - 2), fps, config: { damping: 12, mass: 0.5, stiffness: 200 } });
        const active = frame >= wf - 1 && frame < Math.max(we, wf + 5);
        const activeAmt = active ? spring({ frame: frame - wf, fps, config: { damping: 10, mass: 0.4 } }) : 0;
        const isEm = w.emphasis;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              fontFamily: isEm ? display : body,
              fontWeight: isEm ? 400 : 900,
              fontSize: isEm ? 96 : 74,
              lineHeight: 1.12,
              letterSpacing: isEm ? 1 : -0.5,
              textTransform: "uppercase",
              color: isEm ? accent : C.white,
              opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              scale: `${interpolate(s, [0, 1], [0.55, 1]) * (1 + activeAmt * 0.05)}`,
              translate: `0px ${interpolate(s, [0, 1], [36, 0])}px`,
              filter: `blur(${interpolate(s, [0, 0.6], [6, 0], { extrapolateRight: "clamp" })}px)`,
              textShadow: isEm
                ? `0 0 28px ${accent}66, 0 6px 0 rgba(0,0,0,0.6)`
                : "0 5px 0 rgba(0,0,0,0.65), 0 0 18px rgba(0,0,0,0.6)",
              WebkitTextStroke: isEm ? "0px" : "1.5px rgba(0,0,0,0.35)",
            }}
          >
            {active && !isEm ? (
              <span
                style={{
                  position: "absolute",
                  left: -10,
                  right: -10,
                  top: 8,
                  bottom: 4,
                  borderRadius: 14,
                  background: accent,
                  opacity: 0.95 * activeAmt,
                  zIndex: -1,
                  scale: `${0.8 + activeAmt * 0.2}`,
                  rotate: "-2deg",
                }}
              />
            ) : null}
            <span style={{ color: active && !isEm ? "#0A0A0A" : undefined, position: "relative" }}>{w.text}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Captions: React.FC = () => {
  return (
    <AbsoluteFill>
      <CaptionGradient />
      {PAGES.map((p, i) => {
        const { start, end } = pageWindow(p, i);
        return <CaptionPage key={i} page={p} start={start} end={end} />;
      })}
    </AbsoluteFill>
  );
};
