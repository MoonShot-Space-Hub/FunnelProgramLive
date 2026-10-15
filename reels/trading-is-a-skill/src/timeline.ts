import data from "./timeline.json";

export type Word = { text: string; start: number; end: number };
export type Line = { id: string; text: string; start: number; end: number; words: Word[] };

export const timeline = data as { duration: number; lines: Line[] };

export const line = (id: string): Line => {
  const l = timeline.lines.find((x) => x.id === id);
  if (!l) throw new Error(`No line ${id}`);
  return l;
};

/** Start time (s) of the word in a line whose text starts with `prefix`. */
export const wordAt = (id: string, prefix: string): number => {
  const w = line(id).words.find((x) => x.text.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!w) throw new Error(`No word ${prefix} in ${id}`);
  return w.start;
};

// Video length: last word plus the end-card hold (written by tools/tts.py or tools/align.py).
export const VIDEO_SECONDS = timeline.duration;

// Each scene cuts in just before its first line is spoken (on the whoosh).
const CUT_LEAD = 0.1;
const sceneStarts: [string, number][] = [
  ["surgery", 0],
  ["plane", line("plane").start - CUT_LEAD],
  ["youtube", line("youtube").start - CUT_LEAD],
  ["account", line("account").start - CUT_LEAD],
  ["why", line("why").start - 0.12],
  ["skill", line("skill").start - 0.07],
  ["pillars", line("requires").start - CUT_LEAD],
  ["overnight", line("overnight").start - CUT_LEAD],
  ["shortcut", line("shortcut").start - CUT_LEAD],
  ["cta", line("cta1").start - 0.15],
];

export const scenes = sceneStarts.map(([id, start], i) => ({
  id,
  start,
  end: i + 1 < sceneStarts.length ? sceneStarts[i + 1][1] : VIDEO_SECONDS,
}));

export const scene = (id: string) => {
  const s = scenes.find((x) => x.id === id);
  if (!s) throw new Error(`No scene ${id}`);
  return s;
};
