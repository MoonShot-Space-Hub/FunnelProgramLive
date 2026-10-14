import { sceneStart, TOTAL_FRAMES, wordFrame } from "./timeline";

export type Placement = "center" | "low" | "pip";
export type Enter = "none" | "zoom" | "whip" | "whipUp" | "glitch" | "cut" | "spin";

export type Shot = {
  id: string;
  from: number;
  to: number;
  avatar: Placement;
  enter: Enter;
};

const RAW: Omit<Shot, "to">[] = [
  { id: "intro", from: 0, avatar: "center", enter: "none" },
  { id: "surgery", from: wordFrame("surgery", "and") - 3, avatar: "pip", enter: "zoom" },
  { id: "article", from: sceneStart("plane") - 5, avatar: "pip", enter: "whip" },
  { id: "plane", from: wordFrame("plane", "and") - 3, avatar: "pip", enter: "whipUp" },
  { id: "youtube", from: sceneStart("youtube") - 5, avatar: "pip", enter: "zoom" },
  { id: "trading", from: wordFrame("youtube", "and") - 3, avatar: "pip", enter: "glitch" },
  { id: "why", from: sceneStart("why") - 1, avatar: "center", enter: "cut" },
  { id: "skill", from: sceneStart("skill") - 5, avatar: "center", enter: "zoom" },
  { id: "pillars", from: sceneStart("pillars") - 7, avatar: "pip", enter: "whip" },
  { id: "overnight", from: sceneStart("overnight") - 6, avatar: "pip", enter: "spin" },
  { id: "shortcut", from: sceneStart("shortcut") - 6, avatar: "pip", enter: "whip" },
  { id: "cta", from: sceneStart("cta") - 6, avatar: "low", enter: "zoom" },
];

/** Frames a shot keeps playing under the next one while it transitions in. */
export const OVERLAP = 12;

export const SHOTS: Shot[] = RAW.map((s, i) => ({
  ...s,
  to: i < RAW.length - 1 ? RAW[i + 1].from : TOTAL_FRAMES,
}));

export const shotAt = (frame: number) => {
  let idx = 0;
  SHOTS.forEach((s, i) => {
    if (frame >= s.from) idx = i;
  });
  return idx;
};
