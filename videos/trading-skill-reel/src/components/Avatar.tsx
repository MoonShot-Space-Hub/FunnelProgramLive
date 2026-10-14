import React from "react";
import { C } from "../theme";

export type HandShape = "open" | "point" | "fist";

export type ArmPose = {
  /** shoulder angle, 0 = hanging down, + swings outward */
  a1: number;
  /** elbow angle, negative folds the forearm up/inward */
  a2: number;
  /** wrist angle */
  a3: number;
  hand: HandShape;
};

export type AvatarProps = {
  mouthOpen: number;
  mouthWide: number;
  blink: number;
  brow: number;
  browAngle: number;
  smile: number;
  tilt: number;
  nod: number;
  lookX: number;
  lookY: number;
  breathe: number;
  armL: ArmPose;
  armR: ArmPose;
};

const BLAZER = "#1D2A4F";
const BLAZER_DARK = "#141E3B";
const BLAZER_LIGHT = "#2A3A68";
const HAIR = "#15100C";
const OUTLINE = "#7A4A28";

const Hand: React.FC<{ shape: HandShape }> = ({ shape }) => {
  const skin = { fill: C.skin, stroke: OUTLINE, strokeWidth: 3 };
  if (shape === "point") {
    return (
      <g>
        <rect x={-46} y={8} width={92} height={86} rx={38} {...skin} />
        <rect x={-38} y={60} width={26} height={118} rx={13} {...skin} />
        <path d="M 4 70 Q 22 84 40 72" stroke={OUTLINE} strokeWidth={3} fill="none" />
        <path d="M 2 48 Q 22 60 42 50" stroke={OUTLINE} strokeWidth={3} fill="none" />
        <rect x={30} y={18} width={24} height={52} rx={12} transform="rotate(-18 42 44)" {...skin} />
      </g>
    );
  }
  if (shape === "fist") {
    return (
      <g>
        <rect x={-46} y={8} width={92} height={90} rx={40} {...skin} />
        <path d="M -30 60 Q -10 72 10 62 Q 26 72 40 60" stroke={OUTLINE} strokeWidth={3} fill="none" />
      </g>
    );
  }
  return (
    <g>
      <rect x={-48} y={6} width={96} height={92} rx={36} {...skin} />
      {[-33, -11, 11, 33].map((x, i) => (
        <rect key={x} x={x - 11} y={70} width={22} height={i === 0 || i === 3 ? 66 : 80} rx={11} {...skin} />
      ))}
      <rect x={38} y={10} width={24} height={64} rx={12} transform="rotate(-38 50 40)" {...skin} />
    </g>
  );
};

const Arm: React.FC<{ pose: ArmPose; mirror?: boolean }> = ({ pose, mirror }) => {
  const sx = mirror ? 785 : 215;
  return (
    <g transform={`translate(${sx} 840) scale(${mirror ? -1 : 1} 1) rotate(${pose.a1})`}>
      <circle cx={0} cy={0} r={62} fill={BLAZER} />
      <path d="M -62 0 Q -66 150 -54 290 L 54 290 Q 62 150 62 0 Z" fill={BLAZER} />
      <path d="M 30 0 Q 40 150 40 290" stroke={BLAZER_DARK} strokeWidth={6} fill="none" opacity={0.6} />
      <g transform={`translate(0 280) rotate(${pose.a2})`}>
        <circle cx={0} cy={0} r={56} fill={BLAZER} />
        <path d="M -52 0 L -44 238 L 44 238 L 52 0 Z" fill={BLAZER} />
        <path d="M 26 10 L 26 230" stroke={BLAZER_DARK} strokeWidth={6} opacity={0.5} />
        <rect x={-46} y={222} width={92} height={26} rx={6} fill="#EEF1F6" />
        <g transform={`translate(0 240) rotate(${pose.a3})`}>
          <Hand shape={pose.hand} />
        </g>
      </g>
    </g>
  );
};

const Mouth: React.FC<{ open: number; wide: number; smile: number }> = ({ open, wide, smile }) => {
  const cy = 548;
  const w = 72 + wide * 28 - open * 10 + smile * 10;
  const h = Math.max(0, open) * 58;
  if (h < 5) {
    const curve = 8 + smile * 12;
    return (
      <g>
        <path
          d={`M ${500 - w / 2} ${cy - smile * 4} Q 500 ${cy + curve} ${500 + w / 2} ${cy - smile * 4}`}
          stroke="#5A2418"
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <path d={`M ${500 - w / 4} ${cy + curve + 14} Q 500 ${cy + curve + 20} ${500 + w / 4} ${cy + curve + 14}`} stroke="#8E5A33" strokeWidth={3} fill="none" opacity={0.5} />
      </g>
    );
  }
  const top = cy - 6 - smile * 2;
  const outer = `M ${500 - w / 2} ${cy} Q 500 ${top - 8} ${500 + w / 2} ${cy} Q 500 ${cy + h * 1.15} ${500 - w / 2} ${cy} Z`;
  return (
    <g>
      <clipPath id="mouthClip">
        <path d={outer} />
      </clipPath>
      <path d={outer} fill="#3B0F12" />
      <g clipPath="url(#mouthClip)">
        <rect x={500 - w / 2} y={top - 12} width={w} height={Math.min(16, 6 + h * 0.25)} fill="#F4F1EA" />
        <ellipse cx={500} cy={cy + h * 0.85} rx={w * 0.32} ry={Math.max(4, h * 0.32)} fill="#C9544F" />
      </g>
      <path d={outer} stroke="#6E2A20" strokeWidth={5} fill="none" strokeLinejoin="round" />
    </g>
  );
};

const Eye: React.FC<{ cx: number; blink: number; lookX: number; lookY: number }> = ({ cx, blink, lookX, lookY }) => {
  const cy = 392;
  const open = Math.max(0.06, 1 - blink);
  return (
    <g>
      <g transform={`translate(${cx} ${cy}) scale(1 ${open}) translate(${-cx} ${-cy})`}>
        <ellipse cx={cx} cy={cy} rx={27} ry={19} fill="#FBFAF7" />
        <circle cx={cx + lookX * 7} cy={cy + lookY * 4} r={13.5} fill="#3B2415" />
        <circle cx={cx + lookX * 7} cy={cy + lookY * 4} r={7} fill="#0C0705" />
        <circle cx={cx + lookX * 7 - 4} cy={cy + lookY * 4 - 5} r={4} fill="#FFFFFF" />
      </g>
      <path
        d={`M ${cx - 30} ${cy - 2 - 18 * open} Q ${cx} ${cy - 26 * open - 6} ${cx + 30} ${cy - 2 - 18 * open}`}
        stroke="#2A1A10"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};

export const Avatar: React.FC<AvatarProps> = (p) => {
  return (
    <svg viewBox="0 0 1000 1600" width={1000} height={1600} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="blazerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BLAZER_LIGHT} />
          <stop offset="0.5" stopColor={BLAZER} />
          <stop offset="1" stopColor={BLAZER_DARK} />
        </linearGradient>
        <radialGradient id="faceGrad" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#D49766" />
          <stop offset="1" stopColor="#B87A47" />
        </radialGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.blue} stopOpacity={0.9} />
          <stop offset="0.2" stopColor={C.blue} stopOpacity={0} />
          <stop offset="0.8" stopColor={C.gold} stopOpacity={0} />
          <stop offset="1" stopColor={C.gold} stopOpacity={0.8} />
        </linearGradient>
      </defs>

      {/* body, with a gentle breathing scale */}
      <g transform={`translate(500 1600) scale(${1 + p.breathe * 0.012} ${1 + p.breathe * 0.018}) translate(-500 -1600)`}>
        {/* neck */}
        <path d="M 432 540 L 432 730 Q 500 770 568 730 L 568 540 Z" fill={C.skinShade} />
        <path d="M 432 600 Q 500 660 568 600 L 568 640 Q 500 700 432 640 Z" fill="#8F5C33" opacity={0.55} />

        {/* torso */}
        <path
          d="M 120 1600 L 130 930 Q 140 800 290 770 L 425 712 Q 500 745 575 712 L 710 770 Q 860 800 870 930 L 880 1600 Z"
          fill="url(#blazerGrad)"
        />
        {/* t-shirt */}
        <path d="M 418 714 Q 500 760 582 714 L 600 760 L 528 1180 L 472 1180 L 400 760 Z" fill="#101114" />
        <path d="M 425 716 Q 500 768 575 716" stroke="#2A2C33" strokeWidth={10} fill="none" />
        {/* lapels */}
        <path d="M 425 712 L 330 790 L 372 880 L 338 912 L 470 1190 L 404 760 Z" fill={BLAZER_DARK} />
        <path d="M 575 712 L 670 790 L 628 880 L 662 912 L 530 1190 L 596 760 Z" fill={BLAZER_DARK} />
        <path d="M 425 712 L 330 790 L 372 880 L 338 912 L 470 1190" stroke={BLAZER_LIGHT} strokeWidth={4} fill="none" opacity={0.7} />
        <path d="M 575 712 L 670 790 L 628 880 L 662 912 L 530 1190" stroke={BLAZER_LIGHT} strokeWidth={4} fill="none" opacity={0.7} />
        {/* pocket square + lav mic */}
        <path d="M 640 1010 L 720 1000 L 712 1030 L 646 1036 Z" fill={C.gold} />
        <rect x={352} y={948} width={22} height={34} rx={8} fill="#0A0A0C" />
        <path d="M 363 982 Q 370 1060 340 1140" stroke="#0A0A0C" strokeWidth={4} fill="none" />
        {/* buttons */}
        <circle cx={500} cy={1290} r={11} fill={BLAZER_DARK} />
        <circle cx={500} cy={1400} r={11} fill={BLAZER_DARK} />
        {/* rim light */}
        <path
          d="M 120 1600 L 130 930 Q 140 800 290 770 L 425 712 M 575 712 L 710 770 Q 860 800 870 930 L 880 1600"
          stroke="url(#rim)"
          strokeWidth={10}
          fill="none"
        />
      </g>

      {/* head */}
      <g transform={`translate(0 ${p.nod * 10}) rotate(${p.tilt} 500 640)`}>
        {/* back hair */}
        <path d="M 330 400 C 300 250 380 140 500 138 C 630 136 705 240 670 400 Z" fill={HAIR} />
        {/* ears */}
        <ellipse cx={334} cy={420} rx={30} ry={48} fill={C.skinShade} />
        <ellipse cx={666} cy={420} rx={30} ry={48} fill={C.skinShade} />
        <path d="M 330 395 Q 318 420 334 448" stroke="#8F5C33" strokeWidth={5} fill="none" />
        <path d="M 670 395 Q 682 420 666 448" stroke="#8F5C33" strokeWidth={5} fill="none" />
        {/* face */}
        <path
          d="M 340 380 C 340 250 412 196 500 196 C 588 196 660 250 660 380 C 660 470 640 540 592 588 C 562 616 532 628 500 628 C 468 628 438 616 408 588 C 360 540 340 470 340 380 Z"
          fill="url(#faceGrad)"
        />
        {/* beard (short, boxed) */}
        <path
          d="M 344 440 C 350 525 385 580 425 608 C 452 627 476 636 500 636 C 524 636 548 627 575 608 C 615 580 650 525 656 440 C 640 500 615 520 590 528 C 560 505 530 498 500 500 C 470 498 440 505 410 528 C 385 520 360 500 344 440 Z"
          fill="#33231A"
          opacity={0.85}
        />
        <path d="M 425 600 Q 500 580 575 600 Q 545 625 500 628 Q 455 625 425 600 Z" fill="#2A1C14" opacity={0.6} />
        {/* mustache */}
        <path d="M 438 522 Q 470 500 500 512 Q 530 500 562 522 Q 532 518 500 526 Q 468 518 438 522 Z" fill="#20150F" />
        {/* nose */}
        <path d="M 500 400 C 497 440 486 468 476 480 Q 500 494 524 480" stroke="#8E5A33" strokeWidth={5} fill="none" strokeLinecap="round" />
        <ellipse cx={500} cy={472} rx={26} ry={12} fill="#B4733F" opacity={0.35} />
        <Mouth open={p.mouthOpen} wide={p.mouthWide} smile={p.smile} />
        <Eye cx={438} blink={p.blink} lookX={p.lookX} lookY={p.lookY} />
        <Eye cx={562} blink={p.blink} lookX={p.lookX} lookY={p.lookY} />
        {/* eyebrows */}
        <g transform={`translate(0 ${-p.brow * 14})`}>
          <path
            d="M 398 352 Q 436 330 476 344 L 474 358 Q 436 348 400 364 Z"
            fill="#1A110B"
            transform={`rotate(${-p.browAngle} 438 350)`}
          />
          <path
            d="M 602 352 Q 564 330 524 344 L 526 358 Q 564 348 600 364 Z"
            fill="#1A110B"
            transform={`rotate(${p.browAngle} 562 350)`}
          />
        </g>
        {/* glasses */}
        <g stroke="#0E0E12" strokeWidth={7} fill="rgba(170,210,255,0.08)">
          <rect x={390} y={358} width={96} height={70} rx={22} />
          <rect x={514} y={358} width={96} height={70} rx={22} />
        </g>
        <path d="M 486 384 Q 500 374 514 384" stroke="#0E0E12" strokeWidth={6} fill="none" />
        <path d="M 390 380 L 345 372 M 610 380 L 655 372" stroke="#0E0E12" strokeWidth={6} />
        <path d="M 402 370 L 420 366" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
        <path d="M 526 370 L 544 366" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
        {/* hair top with quiff */}
        <path
          d="M 336 372 C 322 250 380 170 470 150 C 520 128 600 140 640 175 C 690 215 680 300 664 372 C 655 320 640 290 615 268 C 560 292 470 292 405 262 C 375 290 350 325 336 372 Z"
          fill={HAIR}
        />
        <path d="M 420 175 C 480 140 570 140 625 180" stroke="#3A2C22" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d="M 450 205 C 500 180 560 185 600 210" stroke="#3A2C22" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>

      {/* arms in front of the torso */}
      <Arm pose={p.armL} />
      <Arm pose={p.armR} mirror />
    </svg>
  );
};

export const REST: ArmPose = { a1: 8, a2: -35, a3: -10, hand: "fist" };
