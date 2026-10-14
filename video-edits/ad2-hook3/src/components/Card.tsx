import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, COLOR, FONT, beatPulse, broll, clamp, easeInOut, easeOut } from "../lib";
import { BlurBackdrop, Shine } from "./BRollLayer";

export const CARD = { w: 960, h: 680, cy: 790 };

/** Photo card floating over a blurred copy of itself, with Ken Burns, float, beat pulse and impact shake. */
export const Card: React.FC<{ b: BRoll; dur: number }> = ({ b, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = broll(b.image!);
  const tAbs = b.start + f / fps;

  const kenBurns = interpolate(f, [0, dur], [1.0, 1.12], clamp);
  const float = Math.sin((f / fps) * 1.7) * 0.9;
  const pulse = b.beatPulse ? beatPulse(tAbs) : 0;

  let shakeX = 0;
  let shakeY = 0;
  let tint = b.tint ? 0.22 : 0;
  if (b.impact !== undefined && tAbs >= b.impact) {
    const k = tAbs - b.impact;
    const amp = 28 * Math.exp(-k * 7);
    shakeX = amp * Math.sin(k * 95);
    shakeY = amp * Math.cos(k * 71);
    tint += 0.4 * Math.exp(-k * 3.5);
  }

  const left = (1080 - CARD.w) / 2;
  const top = CARD.cy - CARD.h / 2;

  return (
    <AbsoluteFill>
      <BlurBackdrop src={src} />
      {b.tint ? (
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse at 50% 45%, rgba(255,0,0,0) 30%, rgba(200,0,0,0.55) 100%)",
            opacity: 0.5 + tint,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 44,
          overflow: "hidden",
          border: "6px solid rgba(255,255,255,0.95)",
          boxShadow: `0 50px 110px rgba(0,0,0,0.65), 0 0 ${60 * pulse}px rgba(255,210,52,${0.8 * pulse})`,
          rotate: `${float}deg`,
          scale: String(1 + 0.04 * pulse),
          translate: `${shakeX}px ${shakeY}px`,
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(kenBurns) }} />
        {b.tint ? <AbsoluteFill style={{ backgroundColor: "#ff1a1a", mixBlendMode: "multiply", opacity: tint }} /> : null}
        <Shine startFrame={10} />
        {b.ribbon !== undefined ? <Ribbon at={Math.round((b.ribbon - b.start) * fps)} /> : null}
      </div>
      {b.reticle ? <Reticle /> : null}
      {b.clock ? <ClockBadge left={left - 34} top={top - 90} /> : null}
    </AbsoluteFill>
  );
};

/** Target-lock reticle that zooms in and locks onto the card centre. */
const Reticle: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [8, 30], [0, 1], { ...clamp, easing: easeOut });
  const spin = f * 1.6;
  const lockedFrame = 34;
  const locked = f >= lockedFrame;
  const blink = locked ? (Math.floor((f - lockedFrame) / 8) % 2 === 0 ? 1 : 0.35) : 0;
  const size = 560;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - size / 2,
        top: CARD.cy - size / 2,
        width: size,
        height: size,
        opacity: p,
        scale: String(2.3 - 1.3 * p),
      }}
    >
      <svg width={size} height={size} viewBox="-100 -100 200 200">
        <g style={{ rotate: `${spin}deg` }}>
          <circle r={80} fill="none" stroke={COLOR.yellow} strokeWidth={3} strokeDasharray="22 12" />
        </g>
        <g style={{ rotate: `${-spin * 1.4}deg` }}>
          <circle r={58} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="6 10" opacity={0.85} />
        </g>
        {[0, 90, 180, 270].map((a) => (
          <g key={a} style={{ rotate: `${a}deg` }}>
            <line x1={0} y1={-96} x2={0} y2={-66} stroke={COLOR.yellow} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
        <circle r={6} fill={locked ? COLOR.red : COLOR.yellow} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: size - 40,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 34,
          letterSpacing: 8,
          color: COLOR.yellow,
          opacity: blink,
          textShadow: "0 4px 14px rgba(0,0,0,0.8)",
        }}
      >
        TARGET LOCKED
      </div>
    </div>
  );
};

/** Diagonal "FREE MASTERCLASS" ribbon across the card corner. */
const Ribbon: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 88,
        right: -150,
        width: 620,
        height: 92,
        rotate: "38deg",
        scale: `${s} 1`,
        background: `linear-gradient(90deg, ${COLOR.yellow}, ${COLOR.orange})`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.display,
        fontSize: 54,
        letterSpacing: 2,
        color: COLOR.ink,
        overflow: "hidden",
      }}
    >
      FREE MASTERCLASS
      <Shine startFrame={at + 8} durationFrames={22} />
    </div>
  );
};

/** "1 HOUR" badge with a progress ring that sweeps around once. */
const ClockBadge: React.FC<{ left: number; top: number }> = ({ left, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const ring = interpolate(f, [14, 80], [0, 1], { ...clamp, easing: easeInOut });
  const r = 104;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 250,
        height: 250,
        borderRadius: 999,
        background: "#fff",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        scale: String(Math.max(0, s)),
        rotate: `${(1 - s) * -90}deg`,
      }}
    >
      <svg width={250} height={250} style={{ position: "absolute", inset: 0 }}>
        <circle cx={125} cy={125} r={r} fill="none" stroke="#eee" strokeWidth={14} />
        <circle
          cx={125}
          cy={125}
          r={r}
          fill="none"
          stroke={COLOR.orange}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ring)}
          transform="rotate(-90 125 125)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: COLOR.ink,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 112, lineHeight: 0.95 }}>1</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 34, letterSpacing: 4 }}>HOUR</div>
      </div>
    </div>
  );
};
