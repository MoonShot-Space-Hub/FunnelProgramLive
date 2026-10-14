import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import timelineJson from "./timeline.json";
import captionsJson from "./data/captions.json";
import beatsJson from "./data/beats.json";

export const FONT = {
  sans: "Montserrat",
  display: "Anton",
  serif: "Playfair Display",
};

loadFont({ family: FONT.sans, url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: FONT.sans, url: staticFile("fonts/montserrat-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: FONT.display, url: staticFile("fonts/anton-latin-400-normal.woff2"), weight: "400" });
loadFont({
  family: FONT.serif,
  url: staticFile("fonts/playfair-display-latin-900-italic.woff2"),
  weight: "900",
  style: "italic",
});

export const COLOR = {
  yellow: "#FFD234",
  orange: "#FF9F1C",
  red: "#FF4545",
  green: "#2BE38B",
  ink: "#0B0B0F",
};

export type BRoll = {
  id: string;
  type: "card" | "vs" | "trends" | "checklist";
  start: number;
  end: number;
  enter: "whip" | "zoom" | "flip" | "circle" | "slam";
  image?: string;
  images?: string[];
  labels?: string[];
  second?: number;
  badge?: string;
  beatPulse?: boolean;
  impact?: number;
  tint?: "red";
  reticle?: boolean;
  ribbon?: number;
  clock?: boolean;
  up?: number[];
  down?: number[];
  side?: number[];
  title?: number;
  items?: [string, number, string][];
};

export type Overlay = { type: "free" | "cta"; start: number; end: number; click?: number };
export type Sticker = { emoji: string; start: number; end: number; x: number; y: number; rot: number };

export type CaptionWord = { text: string; style: "n" | "k" | "a" | "r" | "g"; at: number };
export type CaptionPage = {
  start: number;
  end: number;
  mode: "caption" | "graphic";
  lines: { kind: "lead" | "punch"; words: CaptionWord[] }[];
};

export const timeline = timelineJson as unknown as {
  fps: number;
  durationSec: number;
  zooms: [number, number][];
  brolls: BRoll[];
  overlays: Overlay[];
  stickers: Sticker[];
};
export const captions = captionsJson as CaptionPage[];
export const beats = beatsJson as { bpm: number; beats: number[] };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const broll = (file: string) => staticFile(`broll/${file}`);

/** 0..1 decaying pulse that fires on every music beat. */
export const beatPulse = (t: number, sharpness = 9) => {
  let last = -Infinity;
  for (const b of beats.beats) {
    if (b > t) break;
    last = b;
  }
  return Math.exp(-(t - last) * sharpness);
};
