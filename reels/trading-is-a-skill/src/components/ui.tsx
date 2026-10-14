import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily } from "../theme";
import { backOut, pop, prog } from "../anim";

/** Absolute time (s) on the reel's timeline for a scene that starts at `start`. */
export const useT = (start: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return start + frame / fps;
};

/** Whip-in entrance plus a slow push-in for the whole scene. */
export const SceneFrame: React.FC<{
  start: number;
  end: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ start, end, children, style }) => {
  const t = useT(start);
  const enter = prog(t, start, 0.24);
  const zoom = interpolate(t, [start, end], [1, 1.035]);
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: C.text,
        opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        translate: `0px ${(1 - enter) * 90}px`,
        scale: String((0.94 + 0.06 * enter) * zoom),
        filter: `blur(${(1 - enter) * 10}px)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Panel: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  light?: boolean;
}> = ({ style, children, light }) => (
  <div
    style={{
      position: "absolute",
      borderRadius: 36,
      background: light
        ? "linear-gradient(180deg, #FFFFFF 0%, #EEF2F8 100%)"
        : `linear-gradient(180deg, ${C.panel} 0%, #0B1222 100%)`,
      border: light ? "2px solid #D9E1EE" : `2px solid ${C.panelBorder}`,
      boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Rubber-stamp verdict that slams onto the frame at `at`. */
export const Stamp: React.FC<{
  t: number;
  at: number;
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  rotate?: number;
}> = ({ t, at, children, color = C.red, style, rotate = -8 }) => {
  const p = prog(t, at, 0.22, backOut);
  if (t < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        translate: "-50% -50%",
        rotate: `${rotate}deg`,
        scale: String(1.9 - 0.9 * p),
        opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        padding: "18px 40px",
        border: `10px solid ${color}`,
        borderRadius: 26,
        color,
        background: "rgba(10,6,8,0.78)",
        fontWeight: 900,
        fontSize: 80,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        boxShadow: `0 0 60px ${color}66`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Pill label that pops in at `at`. */
export const Chip: React.FC<{
  t: number;
  at: number;
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ t, at, children, color = C.green, style }) => {
  const p = pop(t, at, 0.32);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        translate: "-50% 0",
        scale: String(p),
        opacity: Math.min(1, p * 2),
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 38px",
        borderRadius: 999,
        background: `${color}22`,
        border: `3px solid ${color}`,
        color: C.text,
        fontWeight: 800,
        fontSize: 46,
        letterSpacing: 1,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

type IconProps = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties };

const Svg: React.FC<IconProps & { children: React.ReactNode; fill?: boolean }> = ({
  size = 64,
  color = C.text,
  stroke = 2.4,
  style,
  children,
  fill,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? color : "none"}
    stroke={fill ? "none" : color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

export const Icon = {
  Play: (p: IconProps) => (
    <Svg {...p} fill>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </Svg>
  ),
  Check: (p: IconProps) => (
    <Svg {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  ),
  X: (p: IconProps) => (
    <Svg {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  ),
  Book: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      <path d="M9 8h7M9 12h5" />
    </Svg>
  ),
  Target: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </Svg>
  ),
  Shield: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 2.5 20 5.5v6.2c0 5-3.4 8.4-8 9.8-4.6-1.4-8-4.8-8-9.8V5.5z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Svg>
  ),
  Plane: (p: IconProps) => (
    <Svg {...p} fill>
      <path d="M21.5 15.8v-1.9l-8.2-5.2V3.6c0-.8-.6-1.6-1.3-1.6s-1.3.8-1.3 1.6v5.1L2.5 13.9v1.9l8.2-2.6v5.2l-2.2 1.6v1.5l3.5-1 3.5 1V20l-2.2-1.6v-5.2z" />
    </Svg>
  ),
  Scalpel: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 21 11.5 12.5" strokeWidth={3.2} />
      <path d="M11.5 12.5 19 3.5c1.6 2.6 1.2 6.5-1.9 9.1L13 15z" />
    </Svg>
  ),
  Moon: (p: IconProps) => (
    <Svg {...p}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </Svg>
  ),
  ChevronDown: (p: IconProps) => (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
  Candles: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 3v4M6 15v6M12 2v3M12 13v4M18 6v3M18 17v4" />
      <rect x="4" y="7" width="4" height="8" rx="1" />
      <rect x="10" y="5" width="4" height="8" rx="1" />
      <rect x="16" y="9" width="4" height="8" rx="1" />
    </Svg>
  ),
  Clock: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  Pin: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.6" />
    </Svg>
  ),
};

export type Candle = { o: number; c: number; h: number; l: number };

/** Deterministic candles from a list of closes. */
export const candlesFrom = (closes: number[], wick = 1.2): Candle[] =>
  closes.slice(1).map((c, i) => {
    const o = closes[i];
    const jitter = ((i * 37) % 7) / 7;
    return {
      o,
      c,
      h: Math.max(o, c) + wick * (0.4 + jitter),
      l: Math.min(o, c) - wick * (0.3 + (1 - jitter) * 0.6),
    };
  });

/** Candlestick chart; candles appear one by one up to `shown` (fractional ok). */
export const CandleChart: React.FC<{
  candles: Candle[];
  width: number;
  height: number;
  shown?: number;
  min?: number;
  max?: number;
  gap?: number;
}> = ({ candles, width, height, shown = candles.length, min, max, gap = 0.34 }) => {
  const lo = min ?? Math.min(...candles.map((c) => c.l));
  const hi = max ?? Math.max(...candles.map((c) => c.h));
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height;
  const step = width / candles.length;
  const bw = step * (1 - gap);
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {candles.map((c, i) => {
        const vis = Math.max(0, Math.min(1, shown - i));
        if (vis <= 0) return null;
        const up = c.c >= c.o;
        const col = up ? C.green : C.red;
        const x = i * step + (step - bw) / 2;
        const top = y(Math.max(c.o, c.c));
        const bot = y(Math.min(c.o, c.c));
        return (
          <g key={i} opacity={vis} transform={`translate(0 ${(1 - vis) * 20})`}>
            <line x1={x + bw / 2} x2={x + bw / 2} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth={4} />
            <rect x={x} y={top} width={bw} height={Math.max(6, bot - top)} rx={4} fill={col} />
          </g>
        );
      })}
    </svg>
  );
};

export const Glow: React.FC<{ color: string; size: number; style?: React.CSSProperties; opacity?: number }> = ({
  color,
  size,
  style,
  opacity = 0.5,
}) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      opacity,
      translate: "-50% -50%",
      ...style,
    }}
  />
);
