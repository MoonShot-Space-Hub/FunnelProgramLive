import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { backOut } from "../anim";
import { C, fontFamily } from "../theme";
import { timeline, Word } from "../timeline";

// Lines whose words are already the on-screen graphic.
const HIDDEN = new Set(["why", "requires", "education", "practice", "rules", "cta3"]);

const EMPHASIS = new Set([
  "surgery",
  "plane",
  "youtube",
  "trading",
  "skill",
  "overnight",
  "professional",
  "shortcut",
  "structured",
  "free",
  "abct",
  "ai",
  "masterclass",
]);

const MAX_WORDS = 3;
// Words that read badly at the end of a caption page; they move to the next one.
const LEADING = new Set(["a", "an", "the", "to", "my", "of", "and", "but", "if", "on", "their", "like"]);
const MAX_CHARS = 16;
const HOLD = 0.3;

type Page = { words: Word[]; start: number; end: number };

const clean = (w: string) => w.replace(/[.,!?:;]/g, "");
const ends = (w: string) => /[.,!?:;]$/.test(w);

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  for (const line of timeline.lines) {
    if (HIDDEN.has(line.id)) continue;
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) pages.push({ words: cur, start: cur[0].start - 0.04, end: 0 });
      cur = [];
    };
    line.words.forEach((w, i) => {
      cur.push(w);
      const chars = cur.map((x) => clean(x.text)).join(" ").length;
      const remaining = line.words.length - i - 1;
      if (ends(w.text) || cur.length >= MAX_WORDS || (chars >= MAX_CHARS && cur.length >= 2)) {
        // don't leave a single dangling word for the next page
        if (remaining === 1 && cur.length < MAX_WORDS && !ends(w.text)) return;
        const carry = remaining > 0 && cur.length > 1 && LEADING.has(clean(w.text).toLowerCase()) ? cur.pop() : undefined;
        flush();
        if (carry) cur = [carry];
      }
    });
    flush();
  }
  pages.forEach((p, i) => {
    const last = p.words[p.words.length - 1].end + HOLD;
    const next = pages[i + 1]?.start ?? Infinity;
    p.end = Math.min(last, next);
  });
  return pages;
};

const PAGES = buildPages();

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const page = PAGES.find((p) => t >= p.start && t < p.end);
  if (!page) return null;

  const enter = interpolate(t, [page.start, page.start + 0.16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: backOut,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 1235,
          left: 90,
          right: 90,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: 34,
          rowGap: 4,
          fontFamily,
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1.08,
          textTransform: "uppercase",
          letterSpacing: -1,
          textAlign: "center",
          scale: String(0.85 + 0.15 * enter),
          opacity: Math.min(1, enter * 1.6),
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start - 0.03 && (t < (page.words[i + 1]?.start ?? page.end) - 0.03);
          const said = t >= w.start - 0.03;
          const bump = interpolate(t, [w.start - 0.03, w.start + 0.09, w.start + 0.22], [1, 1.09, 1.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const emph = EMPHASIS.has(clean(w.text).toLowerCase());
          const color = active ? C.yellow : emph && said ? C.greenSoft : C.text;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color,
                scale: String(active ? bump : 1),
                opacity: said ? 1 : 0.55,
                WebkitTextStroke: "14px #000",
                paintOrder: "stroke fill",
                textShadow: "0 8px 0 rgba(0,0,0,0.45), 0 0 30px rgba(0,0,0,0.6)",
              }}
            >
              {w.text.replace(/[.,!:;]+$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
