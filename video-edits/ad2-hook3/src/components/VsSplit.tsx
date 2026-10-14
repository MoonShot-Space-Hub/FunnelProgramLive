import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, COLOR, FONT, broll, clamp, easeOut } from "../lib";
import { Shine } from "./BRollLayer";

const W = 900;
const H = 500;
const TOP_CY = 450;
const BOTTOM_CY = 985;
const BADGE_CY = 718;

/** Two stacked photo cards that fly in from opposite sides, joined by a "VS" / "+" badge. */
export const VsSplit: React.FC<{ b: BRoll }> = ({ b }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const secondAt = Math.round(((b.second ?? b.start) - b.start) * fps);
  const badgeAt = secondAt + 5;

  const sA = spring({ frame: f, fps, config: { damping: 14, stiffness: 160, mass: 0.8 } });
  const sB = spring({ frame: f - secondAt, fps, config: { damping: 14, stiffness: 160, mass: 0.8 } });
  const sBadge = spring({ frame: f - badgeAt, fps, config: { damping: 9, stiffness: 210, mass: 0.6 } });
  const ring = interpolate(f, [badgeAt, badgeAt + 22], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 45%, #6b0d14 0%, #22040a 55%, #080103 100%), #080103",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 2px, rgba(255,255,255,0) 2px 46px)",
          translate: `${(f * 1.2) % 46}px 0px`,
        }}
      />
      <PhotoCard
        src={broll(b.images![0])}
        label={b.labels?.[0]}
        cy={TOP_CY}
        rot={-3 - (1 - sA) * 10}
        x={(1 - sA) * -1250}
        visible={f >= 0}
        labelSide="left"
        shineAt={10}
      />
      <PhotoCard
        src={broll(b.images![1])}
        label={b.labels?.[1]}
        cy={BOTTOM_CY}
        rot={3 + (1 - sB) * 10}
        x={(1 - sB) * 1250}
        visible={f >= secondAt}
        labelSide="right"
        shineAt={secondAt + 10}
      />
      {b.badge && f >= badgeAt ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 540 - 100,
              top: BADGE_CY - 100,
              width: 200,
              height: 200,
              borderRadius: 999,
              border: `8px solid ${COLOR.yellow}`,
              scale: String(0.8 + ring * 1.6),
              opacity: 1 - ring,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 540 - 95,
              top: BADGE_CY - 95,
              width: 190,
              height: 190,
              borderRadius: 999,
              background: COLOR.yellow,
              border: "8px solid #fff",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.display,
              fontSize: b.badge === "+" ? 150 : 96,
              color: COLOR.ink,
              scale: String(Math.max(0, sBadge)),
              rotate: `${(1 - sBadge) * -200}deg`,
            }}
          >
            {b.badge}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const PhotoCard: React.FC<{
  src: string;
  label?: string;
  cy: number;
  rot: number;
  x: number;
  visible: boolean;
  labelSide: "left" | "right";
  shineAt: number;
}> = ({ src, label, cy, rot, x, visible, labelSide, shineAt }) => {
  const f = useCurrentFrame();
  if (!visible) return null;
  const kb = interpolate(f, [0, 200], [1.0, 1.12], clamp);
  const labelIn = interpolate(f, [shineAt - 2, shineAt + 8], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - W / 2,
        top: cy - H / 2,
        width: W,
        height: H,
        rotate: `${rot}deg`,
        translate: `${x}px 0px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 40,
          overflow: "hidden",
          border: "6px solid rgba(255,255,255,0.95)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(kb) }} />
        <Shine startFrame={shineAt} />
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            [labelSide]: 36,
            top: -48,
            padding: "10px 34px 6px",
            borderRadius: 18,
            background: COLOR.yellow,
            color: COLOR.ink,
            fontFamily: FONT.display,
            fontSize: 74,
            letterSpacing: 2,
            boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
            scale: `${labelIn} 1`,
            transformOrigin: labelSide === "left" ? "left center" : "right center",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
