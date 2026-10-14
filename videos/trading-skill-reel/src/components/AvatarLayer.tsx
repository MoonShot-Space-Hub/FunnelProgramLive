import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArmPose, Avatar, REST } from "./Avatar";
import { energyAt, mouthAt, sceneStart, TL, wordFrame, msToFrame } from "../lib/timeline";
import { Placement, SHOTS } from "../lib/shots";
import { lerp } from "../lib/anim";
import { C } from "../theme";

type Box = { x: number; y: number; s: number; r: number; cx: number; cy: number };

// SVG head centre is (500, 400) in avatar space.
const PLACE: Record<Placement, Box> = {
  center: { x: 40, y: 360, s: 1, r: 2400, cx: 540, cy: 960 },
  low: { x: 85, y: 610, s: 0.91, r: 2400, cx: 540, cy: 1100 },
  pip: { x: 572, y: 92, s: 0.62, r: 138, cx: 882, cy: 330 },
};

const POSES = {
  one: { a1: 20, a2: -195, a3: 0, hand: "point" },
  shrug: { a1: -10, a2: 145, a3: -20, hand: "open" },
  present: { a1: 35, a2: -190, a3: -15, hand: "open" },
  pointDown: { a1: 15, a2: -120, a3: 105, hand: "point" },
} satisfies Record<string, ArmPose>;

type Gesture = { from: number; to: number; arm: "L" | "R" | "both"; pose: ArmPose };

const GESTURES: Gesture[] = [
  { from: wordFrame("surgery", "one") - 5, to: wordFrame("surgery", "video") + 14, arm: "L", pose: POSES.one },
  { from: sceneStart("why") - 3, to: sceneStart("why") + 30, arm: "both", pose: POSES.shrug },
  { from: wordFrame("skill", "skill") - 6, to: wordFrame("skill", "every") - 2, arm: "L", pose: POSES.one },
  { from: wordFrame("skill", "requires") - 4, to: sceneStart("pillars") - 4, arm: "R", pose: POSES.present },
  { from: wordFrame("cta", "watch") - 4, to: wordFrame("cta", "link") - 6, arm: "R", pose: POSES.present },
  { from: wordFrame("cta", "link") - 6, to: 99999, arm: "L", pose: POSES.pointDown },
];

const EMPHASIS = TL.phrases.flatMap((p) => p.words.filter((w) => w.emphasis).map((w) => msToFrame(w.startMs)));

const blendPose = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  a1: lerp(a.a1, b.a1, t),
  a2: lerp(a.a2, b.a2, t),
  a3: lerp(a.a3, b.a3, t),
  hand: t > 0.5 ? b.hand : a.hand,
});

const armAt = (frame: number, fps: number, arm: "L" | "R"): ArmPose => {
  let pose = REST;
  for (const g of GESTURES) {
    if (g.arm !== arm && g.arm !== "both") continue;
    const tin = spring({ frame: frame - g.from, fps, config: { damping: 14, mass: 0.7 } });
    const tout = spring({ frame: frame - g.to, fps, config: { damping: 18, mass: 0.7 } });
    const t = tin - tout;
    if (t > 0.001) pose = blendPose(pose, g.pose, Math.min(1.05, t));
  }
  // small idle drift so the hands never look frozen
  return { ...pose, a2: pose.a2 + Math.sin(frame / 11 + (arm === "L" ? 0 : 2)) * 2.5 };
};

const pulse = (frame: number, at: number, dur = 10) => {
  const t = frame - at;
  if (t < 0 || t > dur) return 0;
  return Math.sin((t / dur) * Math.PI);
};

export const AvatarLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Placement: spring between consecutive shot placements.
  let box: Box = PLACE[SHOTS[0].avatar];
  for (let i = 1; i < SHOTS.length; i++) {
    const t = spring({ frame: frame - SHOTS[i].from, fps, config: { damping: 16, mass: 0.8 } });
    if (t <= 0) break;
    const target = PLACE[SHOTS[i].avatar];
    box = {
      x: lerp(box.x, target.x, t),
      y: lerp(box.y, target.y, t),
      s: lerp(box.s, target.s, t),
      r: lerp(box.r, target.r, Math.pow(t, 0.35)),
      cx: lerp(box.cx, target.cx, t),
      cy: lerp(box.cy, target.cy, t),
    };
  }
  const pipAmount = interpolate(box.r, [138, 600], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const { open, wide } = mouthAt(frame);
  const energy = energyAt(frame);

  // Blink every ~3-4.5 s, with a deterministic jitter.
  let blink = 0;
  for (let k = 0; k < 20; k++) {
    const at = 40 + k * 105 + Math.floor(random(`blink-${k}`) * 30);
    const t = frame - at;
    if (t >= 0 && t < 6) blink = Math.sin((t / 6) * Math.PI);
  }

  let emph = 0;
  for (const at of EMPHASIS) emph = Math.max(emph, pulse(frame, at - 2, 12));

  const why = sceneStart("why");
  const whyAmt = interpolate(frame, [why - 3, why + 2, why + 26, why + 36], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cta = sceneStart("cta");
  const smile = interpolate(frame, [0, wordFrame("surgery", "and"), why + 30, cta, cta + 20], [0.35, 0.15, 0.2, 0.45, 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tilt = Math.sin(frame / 37) * 2.2 + Math.sin(frame / 13) * energy * 2.5 + whyAmt * 6;
  const nod = Math.sin(frame / 4.3) * energy * 0.9 + emph * 1.2;
  const lookX = pipAmount * -0.5 + Math.sin(frame / 53) * 0.15;

  const ring = 1 + Math.sin(frame / 8) * 0.012;

  return (
    <AbsoluteFill>
      {/* PIP disc + ring (fades in as the clip circle closes) */}
      <div
        style={{
          position: "absolute",
          left: box.cx - box.r - 10,
          top: box.cy - box.r - 10,
          width: (box.r + 10) * 2,
          height: (box.r + 10) * 2,
          borderRadius: "50%",
          background: `conic-gradient(from ${frame * 3}deg, ${C.gold}, ${C.blue}, ${C.purple}, ${C.gold})`,
          opacity: pipAmount,
          scale: ring,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `circle(${box.r}px at ${box.cx}px ${box.cy}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: box.cx - box.r,
            top: box.cy - box.r,
            width: box.r * 2,
            height: box.r * 2,
            background: `radial-gradient(circle at 50% 35%, #24365F, ${C.bg2})`,
            opacity: pipAmount,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${box.x}px, ${box.y + Math.sin(frame / 22) * 4}px) scale(${box.s})`,
          }}
        >
          <Avatar
            mouthOpen={open}
            mouthWide={wide}
            blink={blink}
            brow={Math.max(emph * 0.8, whyAmt)}
            browAngle={whyAmt * 10}
            smile={smile * (1 - whyAmt)}
            tilt={tilt}
            nod={nod}
            lookX={lookX}
            lookY={0}
            breathe={Math.sin(frame / 24)}
            armL={armAt(frame, fps, "L")}
            armR={armAt(frame, fps, "R")}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
