import { Easing, interpolate, spring } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** 0 -> 1 over [start, start + dur] with an expo-out ease. */
export const prog = (frame: number, start: number, dur: number, easing = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });

export const pop = (frame: number, start: number, fps = 30, damping = 11, mass = 0.6) =>
  spring({ frame: frame - start, fps, config: { damping, mass, stiffness: 170 } });

export const soft = (frame: number, start: number, fps = 30) =>
  spring({ frame: frame - start, fps, config: { damping: 200 } });

/** Decaying shake offset for an impact at frame `at`. */
export const shake = (frame: number, at: number, amp = 18, decay = 9) => {
  const t = frame - at;
  if (t < 0 || t > 24) return { x: 0, y: 0 };
  const k = Math.exp(-t / decay) * amp;
  return { x: Math.sin(t * 2.3) * k, y: Math.cos(t * 3.1) * k * 0.7 };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
