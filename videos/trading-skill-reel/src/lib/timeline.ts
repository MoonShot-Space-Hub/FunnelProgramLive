import timeline from "../data/timeline.json";

export type Word = { text: string; emphasis: boolean; startMs: number; endMs: number };
export type Phrase = { text: string; scene: string; startMs: number; endMs: number; words: Word[] };

export const TL = timeline as {
  fps: number;
  durationMs: number;
  phrases: Phrase[];
  mouthOpen: number[];
  mouthWide: number[];
};

export const FPS = TL.fps;
export const msToFrame = (ms: number) => Math.round((ms / 1000) * FPS);
export const TOTAL_FRAMES = msToFrame(TL.durationMs);

/** Absolute frame where a spoken word starts (n-th match inside a scene). */
export const wordFrame = (scene: string, text: string, nth = 0): number => {
  const matches = TL.phrases
    .filter((p) => p.scene === scene)
    .flatMap((p) => p.words)
    .filter((w) => w.text.toLowerCase().replace(/[^a-z0-9-]/g, "") === text.toLowerCase());
  const w = matches[nth] ?? matches[0];
  if (!w) {
    throw new Error(`Word "${text}" not found in scene "${scene}"`);
  }
  return msToFrame(w.startMs);
};

export const sceneStart = (scene: string) =>
  msToFrame(TL.phrases.find((p) => p.scene === scene)!.startMs);

/** Smoothed lip-sync values for a frame. */
export const mouthAt = (frame: number) => {
  const get = (arr: number[], i: number) => arr[Math.max(0, Math.min(arr.length - 1, i))] ?? 0;
  const open = get(TL.mouthOpen, frame) * 0.6 + get(TL.mouthOpen, frame - 1) * 0.25 + get(TL.mouthOpen, frame + 1) * 0.15;
  const wide = get(TL.mouthWide, frame) * 0.7 + get(TL.mouthWide, frame - 1) * 0.3;
  return { open, wide };
};

/** Speech energy averaged over a window (drives head motion). */
export const energyAt = (frame: number, window = 6) => {
  let s = 0;
  for (let i = -window; i <= 0; i++) {
    s += TL.mouthOpen[Math.max(0, Math.min(TL.mouthOpen.length - 1, frame + i))] ?? 0;
  }
  return s / (window + 1);
};
