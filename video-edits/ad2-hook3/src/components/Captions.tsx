import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, CaptionPage, CaptionWord, FONT, captions, clamp, easeIn, easeOut } from "../lib";

const MAX_LINE_WIDTH = 960;
const CAPTION_TOP = 1290;

const LEAD_SIZE = 60;
const PUNCH_SIZE = 104;

type WordLook = { family: string; weight: number; italic?: boolean; size: number; widthEm: number; color: string };

const look = (w: CaptionWord, kind: "lead" | "punch"): WordLook => {
  if (kind === "lead") return { family: FONT.sans, weight: 800, size: LEAD_SIZE, widthEm: 0.72, color: "#fff" };
  switch (w.style) {
    case "k":
      return { family: FONT.display, weight: 400, size: 126, widthEm: 0.47, color: COLOR.yellow };
    case "r":
      return { family: FONT.display, weight: 400, size: 126, widthEm: 0.47, color: COLOR.red };
    case "g":
      return { family: FONT.display, weight: 400, size: 126, widthEm: 0.47, color: COLOR.green };
    case "a":
      return { family: FONT.serif, weight: 900, italic: true, size: 118, widthEm: 0.56, color: COLOR.yellow };
    default:
      return { family: FONT.sans, weight: 900, size: PUNCH_SIZE, widthEm: 0.76, color: "#fff" };
  }
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Rough width estimate so long lines shrink to fit instead of wrapping. */
const lineScale = (words: CaptionWord[], kind: "lead" | "punch") => {
  const est = words.reduce((acc, w) => {
    const l = look(w, kind);
    return acc + w.text.length * l.widthEm * l.size + 0.3 * l.size;
  }, 0);
  return Math.min(1, MAX_LINE_WIDTH / est);
};

const Word: React.FC<{ w: CaptionWord; kind: "lead" | "punch"; scaleFit: number; active: boolean }> = ({
  w,
  kind,
  scaleFit,
  active,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - Math.round(w.at * fps);
  const l = look(w, kind);
  const emphasis = kind === "punch" && w.style !== "n";
  const p = spring({ frame: local, fps, config: { damping: emphasis ? 10 : 13, stiffness: 210, mass: 0.55 } });
  const visible = local >= 0;
  const blur = visible ? Math.max(0, 1 - local / 6) * 9 : 0;
  const plainColor = active ? COLOR.yellow : "#fff";
  const isAccent = w.style === "a" && kind === "punch";

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: l.family,
        fontWeight: l.weight,
        fontStyle: l.italic ? "italic" : "normal",
        fontSize: l.size * scaleFit,
        lineHeight: 1.08,
        letterSpacing: kind === "lead" ? 1 : l.family === FONT.display ? 2 : 0,
        color: w.style === "n" || kind === "lead" ? plainColor : l.color,
        opacity: visible ? Math.min(1, local / 3) : 0,
        scale: String(visible ? interpolate(p, [0, 1], [emphasis ? 0.2 : 0.45, 1]) : 0.45),
        translate: `0px ${visible ? (1 - p) * 38 : 38}px`,
        rotate: emphasis ? `${(1 - p) * -10}deg` : undefined,
        filter: `${blur > 0.2 ? `blur(${blur}px) ` : ""}drop-shadow(0 5px 0 rgba(0,0,0,0.35)) drop-shadow(0 10px 22px rgba(0,0,0,0.55))`,
        padding: isAccent ? "0 10px" : undefined,
        ...(isAccent
          ? {
              backgroundImage: `linear-gradient(180deg, #FFF1A8 0%, ${COLOR.yellow} 45%, ${COLOR.orange} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }
          : {}),
        whiteSpace: "pre",
      }}
    >
      {isAccent ? titleCase(w.text) : w.text}
    </span>
  );
};

const Page: React.FC<{ page: CaptionPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pf = frame - Math.round(page.start * fps);
  const pdur = Math.round((page.end - page.start) * fps);
  const out = interpolate(pf, [pdur - 4, pdur], [0, 1], { ...clamp, easing: easeIn });
  const enter = interpolate(pf, [0, 6], [0, 1], { ...clamp, easing: easeOut });

  const all = page.lines.flatMap((l) => l.words);
  const activeWord = all.reduce<CaptionWord | null>((acc, w) => (w.at <= t ? w : acc), null);

  return (
    <div
      style={{
        position: "absolute",
        top: CAPTION_TOP,
        left: 60,
        right: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: 1 - out,
        scale: String((0.94 + 0.06 * enter) * (1 - 0.05 * out)),
        translate: `0px ${-out * 16}px`,
      }}
    >
      {page.lines.map((line, li) => {
        const fit = lineScale(line.words, line.kind);
        return (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: line.kind === "lead" ? 16 : 22 }}>
            {line.words.map((w, wi) => (
              <Word key={wi} w={w} kind={line.kind} scaleFit={fit} active={activeWord === w} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const page = captions.find((p) => p.mode === "caption" && t >= p.start && t < p.end);
  if (!page) return null;
  return (
    <AbsoluteFill>
      <Page key={page.start} page={page} />
    </AbsoluteFill>
  );
};

/** Merge caption/graphic spans that are separated by short pauses. */
const gradientSpans = (() => {
  const spans: [number, number][] = [];
  for (const p of captions) {
    const last = spans[spans.length - 1];
    if (last && p.start - last[1] < 0.35) last[1] = Math.max(last[1], p.end);
    else spans.push([p.start, p.end]);
  }
  return spans;
})();

/** Black gradient that rises from the bottom whenever captions are on screen. */
export const CaptionGradient: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const RAMP = 10 / fps;
  let v = 0;
  for (const [a, b] of gradientSpans) {
    const k = Math.min(
      interpolate(t, [a - RAMP, a + RAMP], [0, 1], { ...clamp, easing: easeOut }),
      interpolate(t, [b, b + RAMP * 2], [1, 0], { ...clamp, easing: easeIn }),
    );
    v = Math.max(v, k);
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 900,
          opacity: v,
          translate: `0px ${(1 - v) * 160}px`,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.38) 30%, rgba(0,0,0,0.8) 62%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
