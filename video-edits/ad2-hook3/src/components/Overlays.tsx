import React from "react";
import { AbsoluteFill, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, Overlay, Sticker, clamp, easeIn, easeInOut, easeOut, timeline } from "../lib";
import { Shine } from "./BRollLayer";

const CONFETTI = [COLOR.yellow, COLOR.red, COLOR.green, "#ffffff", COLOR.orange, "#4DA3FF"];

/** Rubber-stamp "FREE" that slams in with a shockwave and a confetti burst. */
const FreeStamp: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const LAND = 7;
  const cx = 540;
  const cy = 1090;
  const slam = interpolate(f, [0, LAND], [2.8, 1], { ...clamp, easing: easeIn });
  const settle = f > LAND ? 1 + 0.07 * Math.exp(-(f - LAND) / 5) * Math.cos((f - LAND) * 0.9) : 1;
  const out = interpolate(f, [dur - 8, dur], [0, 1], { ...clamp, easing: easeIn });
  const ring = interpolate(f, [LAND, LAND + 24], [0, 1], { ...clamp, easing: easeOut });
  const dim = interpolate(f, [0, 6, dur - 8, dur], [0, 0.45, 0.45, 0], clamp);
  const tau = Math.max(0, (f - LAND) / fps);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)", opacity: dim }}
      />
      {f >= LAND
        ? Array.from({ length: 44 }).map((_, i) => {
            const a = random(`a${i}`) * Math.PI * 2;
            const v = 900 + random(`v${i}`) * 1100;
            const x = cx + Math.cos(a) * v * tau;
            const y = cy + Math.sin(a) * v * tau + 0.5 * 2600 * tau * tau;
            const op = interpolate(tau, [0, 0.55, 0.9], [1, 1, 0], clamp);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 16 + random(`w${i}`) * 14,
                  height: 30 + random(`h${i}`) * 18,
                  background: CONFETTI[i % CONFETTI.length],
                  borderRadius: 4,
                  rotate: `${random(`r${i}`) * 360 + tau * 900}deg`,
                  opacity: op,
                }}
              />
            );
          })
        : null}
      <div
        style={{
          position: "absolute",
          left: cx - 300,
          top: cy - 300,
          width: 600,
          height: 600,
          borderRadius: 999,
          border: `14px solid ${COLOR.yellow}`,
          scale: String(0.4 + 1.8 * ring),
          opacity: f >= LAND ? 1 - ring : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy - 190,
          display: "flex",
          justifyContent: "center",
          scale: String(slam * settle * (1 - 0.4 * out)),
          opacity: interpolate(f, [0, 3], [0, 1], clamp) * (1 - out),
          rotate: "-9deg",
        }}
      >
        <div
          style={{
            padding: "6px 70px 0",
            border: `16px solid ${COLOR.yellow}`,
            borderRadius: 46,
            outline: `5px solid ${COLOR.yellow}`,
            outlineOffset: 10,
            fontFamily: FONT.display,
            fontSize: 300,
            lineHeight: 1.12,
            color: COLOR.yellow,
            letterSpacing: 6,
            textShadow: "0 14px 0 rgba(0,0,0,0.35), 0 20px 60px rgba(0,0,0,0.7)",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          FREE
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Closing call to action: banner + glowing button that a cursor clicks. */
const Cta: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clickF = Math.round(((o.click ?? o.start + 0.9) - o.start) * fps);
  const sBanner = spring({ frame: f, fps, config: { damping: 14, stiffness: 170, mass: 0.7 } });
  const sBtn = spring({ frame: f - 4, fps, config: { damping: 10, stiffness: 190, mass: 0.7 } });
  const idle = 1 + 0.025 * Math.sin((f / fps) * Math.PI * 2 * 1.6);
  const press = f >= clickF ? 1 - 0.08 * spring({ frame: f - clickF, fps, config: { damping: 8, stiffness: 300 } }) * Math.exp(-(f - clickF) / 8) : 1;
  const btn = { cx: 540, cy: 1085, w: 880, h: 176 };

  const cursorP = interpolate(f, [12, clickF - 2], [0, 1], { ...clamp, easing: easeInOut });
  const cx = interpolate(cursorP, [0, 1], [980, 770]);
  const cy = interpolate(cursorP, [0, 1], [1560, btn.cy + 20]);
  const cursorScale = f >= clickF && f < clickF + 6 ? 0.82 : 1;
  const ripple = interpolate(f, [clickF, clickF + 24], [0, 1], { ...clamp, easing: easeOut });
  const shineCycle = (f % 54) - 6;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          translate: `0px ${(1 - sBanner) * -220}px`,
        }}
      >
        <div
          style={{
            padding: "16px 40px 12px",
            borderRadius: 999,
            background: "#E50914",
            color: "#fff",
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: 2,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          FREE 1-HOUR MASTERCLASS
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: btn.cx - btn.w / 2,
          top: btn.cy - btn.h / 2,
          width: btn.w,
          height: btn.h,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${COLOR.yellow}, ${COLOR.orange})`,
          boxShadow: `0 20px 60px rgba(255,170,30,${0.45 + 0.2 * Math.sin(f / 6)}), inset 0 -8px 0 rgba(0,0,0,0.15)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          fontFamily: FONT.display,
          fontSize: 80,
          color: COLOR.ink,
          letterSpacing: 2,
          overflow: "hidden",
          scale: String(Math.max(0, sBtn) * idle * press),
          rotate: `${(1 - sBtn) * -8}deg`,
        }}
      >
        BOOK YOUR FREE SEAT
        <span style={{ fontSize: 72 }}>➜</span>
        <Shine startFrame={f - shineCycle} durationFrames={24} />
      </div>
      {f >= clickF ? (
        <div
          style={{
            position: "absolute",
            left: cx - 90,
            top: cy - 90,
            width: 180,
            height: 180,
            borderRadius: 999,
            border: "8px solid #fff",
            scale: String(0.2 + 1.8 * ripple),
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <svg
        width={96}
        height={120}
        viewBox="0 0 24 30"
        style={{
          position: "absolute",
          left: cx - 8,
          top: cy - 6,
          scale: String(cursorScale),
          opacity: interpolate(f, [8, 14], [0, 1], clamp),
          filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.5))",
        }}
      >
        <path d="M2 2 L2 24 L8 18.5 L12 28 L16 26.3 L12 17 L20 17 Z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

export const OverlayLayer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {timeline.overlays.map((o) => {
        const from = Math.round(o.start * fps);
        const dur = Math.round((o.end - o.start) * fps);
        return (
          <Sequence key={o.type} name={`Overlay: ${o.type}`} from={from} durationInFrames={dur}>
            {o.type === "free" ? <FreeStamp dur={dur} /> : <Cta o={o} />}
          </Sequence>
        );
      })}
    </>
  );
};

const StickerPop: React.FC<{ s: Sticker; dur: number }> = ({ s, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
  const out = interpolate(f, [dur - 7, dur], [0, 1], { ...clamp, easing: easeIn });
  const bob = Math.sin((f / fps) * 4) * 10;
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - 90,
        top: s.y - 90,
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 150,
        lineHeight: 1,
        scale: String(Math.max(0, sp) * (1 - out)),
        rotate: `${s.rot + (1 - sp) * -30 + Math.sin(f / 9) * 4}deg`,
        translate: `0px ${bob}px`,
        filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.45))",
      }}
    >
      {s.emoji}
    </div>
  );
};

export const StickerLayer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {timeline.stickers.map((s, i) => {
        const from = Math.round(s.start * fps);
        const dur = Math.round((s.end - s.start) * fps);
        return (
          <Sequence key={i} name={`Sticker ${s.emoji}`} from={from} durationInFrames={dur} layout="none">
            <StickerPop s={s} dur={dur} />
          </Sequence>
        );
      })}
    </>
  );
};
