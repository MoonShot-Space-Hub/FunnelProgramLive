import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { body, C, display } from "../theme";
import { clamp, easeOut } from "../lib/anim";

/** Element that pops in with a springy scale at local frame `at`. */
export const PopIn: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  from?: number;
  rotate?: number;
  damping?: number;
}> = ({ at, children, style, from = 0.2, rotate = 0, damping = 10 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping, mass: 0.6, stiffness: 180 } });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        scale: `${interpolate(s, [0, 1], [from, 1])}`,
        rotate: `${interpolate(s, [0, 1], [rotate, 0])}deg`,
        opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
      }}
    >
      {children}
    </div>
  );
};

/** Slide + fade (AE "ease out expo" feel). */
export const SlideIn: React.FC<{
  at: number;
  dx?: number;
  dy?: number;
  dur?: number;
  blur?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, dx = 0, dy = 60, dur = 14, blur = true, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        opacity: interpolate(t, [0, 0.35], [0, 1], clamp),
        translate: `${(1 - t) * dx}px ${(1 - t) * dy}px`,
        filter: blur ? `blur(${(1 - t) * 14}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{ color: string; text: string; size?: number; dark?: boolean }> = ({ color, text, size = 44, dark }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: `${size * 0.28}px ${size * 0.6}px`,
      borderRadius: 999,
      background: color,
      color: dark ? "#0A0A0A" : C.white,
      fontFamily: body,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: 1,
      textTransform: "uppercase",
      boxShadow: `0 10px 30px ${color}66`,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** Rubber-stamp style label that slams in. */
export const Stamp: React.FC<{ at: number; text: string; color?: string; x: number; y: number; size?: number; angle?: number }> = ({
  at,
  text,
  color = C.red,
  x,
  y,
  size = 120,
  angle = -10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, mass: 0.5, stiffness: 260 } });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -50%",
        rotate: `${angle}deg`,
        scale: `${interpolate(s, [0, 1], [2.6, 1])}`,
        opacity: interpolate(s, [0, 0.25], [0, 1], clamp),
        border: `${size * 0.07}px solid ${color}`,
        borderRadius: size * 0.16,
        padding: `${size * 0.06}px ${size * 0.22}px`,
        color,
        fontFamily: display,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: 4,
        whiteSpace: "nowrap",
        background: "rgba(0,0,0,0.35)",
        boxShadow: `0 0 40px ${color}55, inset 0 0 30px ${color}33`,
        textShadow: `0 0 20px ${color}88`,
      }}
    >
      {text}
    </div>
  );
};

/** Hand-drawn style stroke (circle / underline / cross) drawn on over `dur` frames. */
export const DrawPath: React.FC<{
  d: string;
  at: number;
  dur?: number;
  color?: string;
  width?: number;
  length?: number;
}> = ({ d, at, dur = 12, color = C.gold, width = 10, length = 2000 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  if (frame < at) return null;
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={length}
      strokeDashoffset={length * (1 - t)}
    />
  );
};

/** Big count badge, e.g. "1", "2", "3". */
export const CountBadge: React.FC<{ n: number | string; color?: string; size?: number }> = ({ n, color = C.red, size = 110 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: display,
      fontSize: size * 0.62,
      color: C.white,
      border: `${size * 0.06}px solid ${C.white}`,
      boxShadow: `0 12px 30px rgba(0,0,0,0.5), 0 0 30px ${color}88`,
    }}
  >
    {n}
  </div>
);

export const PlayIcon: React.FC<{ size?: number; color?: string; bg?: string }> = ({ size = 120, color = C.white, bg = "rgba(0,0,0,0.55)" }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `4px solid ${color}`,
    }}
  >
    <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 10 10">
      <path d="M 2 1 L 9 5 L 2 9 Z" fill={color} />
    </svg>
  </div>
);

/** Mouse cursor arrow. */
export const Cursor: React.FC<{ size?: number; pressed?: number }> = ({ size = 70, pressed = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ scale: `${1 - pressed * 0.18}`, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.5))" }}>
    <path d="M 3 2 L 3 19 L 8 14.5 L 11.5 22 L 14.5 20.6 L 11 13.4 L 18 13.4 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

/** Click ripple ring at local frame `at`. */
export const Ripple: React.FC<{ at: number; x: number; y: number; color?: string }> = ({ at, x, y, color = C.white }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [0, 1], clamp);
  if (t <= 0 || t >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 70,
        top: y - 70,
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: `6px solid ${color}`,
        scale: `${0.2 + t * 1.2}`,
        opacity: 1 - t,
      }}
    />
  );
};
