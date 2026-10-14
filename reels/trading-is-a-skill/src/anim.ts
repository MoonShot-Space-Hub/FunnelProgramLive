import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

/** 0 -> 1 between t0 and t0 + dur (seconds), eased. */
export const prog = (t: number, t0: number, dur: number, easing = easeOut) =>
  interpolate(t, [t0, t0 + dur], [0, 1], { ...clamp, easing });

/** Pop in with a little overshoot. */
export const pop = (t: number, t0: number, dur = 0.35) =>
  interpolate(t, [t0, t0 + dur], [0, 1], { ...clamp, easing: backOut });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Decaying camera shake, returns a CSS translate. */
export const shake = (t: number, t0: number, strength = 18, decay = 6) => {
  if (t < t0) return "0px 0px";
  const k = Math.exp(-(t - t0) * decay) * strength;
  const x = Math.sin((t - t0) * 83) * k;
  const y = Math.cos((t - t0) * 67) * k;
  return `${x.toFixed(2)}px ${y.toFixed(2)}px`;
};
