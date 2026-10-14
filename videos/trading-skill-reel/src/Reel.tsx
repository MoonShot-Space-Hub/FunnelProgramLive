import React from "react";
import { AbsoluteFill, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { AvatarLayer } from "./components/AvatarLayer";
import { Captions } from "./components/Captions";
import { Finish, Flash, LightLeak, ProgressBar, SpeedLines } from "./components/Fx";
import { Enter, OVERLAP, SHOTS } from "./lib/shots";
import { energyAt, sceneStart, TOTAL_FRAMES, wordFrame } from "./lib/timeline";
import { clamp, easeIn, easeOut, shake } from "./lib/anim";
import { C } from "./theme";
import { IntroScene } from "./scenes/IntroScene";
import { SurgeryScene } from "./scenes/SurgeryScene";
import { ArticleScene } from "./scenes/ArticleScene";
import { PlaneScene } from "./scenes/PlaneScene";
import { YouTubeScene } from "./scenes/YouTubeScene";
import { TradingScene } from "./scenes/TradingScene";
import { WhyScene } from "./scenes/WhyScene";
import { SkillScene } from "./scenes/SkillScene";
import { PillarsScene } from "./scenes/PillarsScene";
import { OvernightScene } from "./scenes/OvernightScene";
import { ShortcutScene } from "./scenes/ShortcutScene";
import { CtaForeground, CtaScene } from "./scenes/CtaScene";

const sceneFor = (id: string, from: number, duration: number) => {
  switch (id) {
    case "intro":
      return <IntroScene from={from} />;
    case "surgery":
      return <SurgeryScene from={from} />;
    case "article":
      return <ArticleScene from={from} />;
    case "plane":
      return <PlaneScene from={from} />;
    case "youtube":
      return <YouTubeScene from={from} />;
    case "trading":
      return <TradingScene from={from} />;
    case "why":
      return <WhyScene />;
    case "skill":
      return <SkillScene from={from} />;
    case "pillars":
      return <PillarsScene from={from} />;
    case "overnight":
      return <OvernightScene from={from} duration={duration} />;
    case "shortcut":
      return <ShortcutScene from={from} />;
    default:
      return <CtaScene from={from} />;
  }
};

const TRANSITION = 10;

/** AE-style shot entrance, plus a matching exit when the next shot whips/zooms in. */
const ShotWrap: React.FC<{ enter: Enter; next?: Enter; length: number; children: React.ReactNode }> = ({ enter, next, length, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, TRANSITION], [0, 1], { ...clamp, easing: easeOut });
  const e = interpolate(f, [length, length + TRANSITION], [0, 1], { ...clamp, easing: easeIn });
  const style: React.CSSProperties = {};
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let rot = 0;
  let blur = 0;
  let opacity = 1;

  switch (enter) {
    case "none":
      opacity = interpolate(f, [0, 8], [0, 1], clamp);
      sc = interpolate(f, [0, 20], [1.08, 1], { ...clamp, easing: easeOut });
      break;
    case "zoom":
      sc = 1.45 - 0.45 * t;
      blur = (1 - t) * 22;
      opacity = interpolate(f, [0, 5], [0, 1], clamp);
      break;
    case "whip":
      tx = (1 - t) * 1080;
      blur = (1 - t) * 26;
      break;
    case "whipUp":
      ty = (1 - t) * 1920;
      blur = (1 - t) * 26;
      break;
    case "spin":
      rot = (1 - t) * -35;
      sc = 1.8 - 0.8 * t;
      blur = (1 - t) * 20;
      opacity = interpolate(f, [0, 4], [0, 1], clamp);
      break;
    case "glitch":
      if (f < 9) {
        tx = (random(`gx${f}`) - 0.5) * 140;
        const a = random(`ga${f}`) * 60;
        style.clipPath = f % 2 === 0 ? `inset(${a}% 0 ${Math.max(0, 70 - a)}% 0)` : "none";
        style.filter = `hue-rotate(${random(`gh${f}`) * 180}deg) saturate(2)`;
      }
      break;
    default:
      break;
  }

  if (next === "whip") {
    tx += -e * 1080;
    blur += e * 26;
  } else if (next === "whipUp") {
    ty += -e * 1920;
    blur += e * 26;
  } else if (next === "zoom" || next === "spin") {
    sc *= 1 + e * 0.3;
    blur += e * 12;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        translate: `${tx}px ${ty}px`,
        scale: `${sc}`,
        rotate: `${rot}deg`,
        filter: style.filter ?? (blur > 0.3 ? `blur(${blur}px)` : undefined),
        clipPath: style.clipPath,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const IMPACTS = [
  { at: wordFrame("surgery", "somebody") + 2, amp: 14 },
  { at: wordFrame("plane", "plane"), amp: 18 },
  { at: wordFrame("youtube", "account") + 4, amp: 22 },
  { at: sceneStart("why") + 1, amp: 30 },
  { at: sceneStart("why") + 7, amp: 18 },
  { at: wordFrame("skill", "skill"), amp: 12 },
  { at: wordFrame("pillars", "education") + 6, amp: 22 },
  { at: wordFrame("pillars", "practice") + 6, amp: 22 },
  { at: wordFrame("pillars", "rules") + 6, amp: 24 },
  { at: wordFrame("pillars", "rules") + 26, amp: 16 },
  { at: wordFrame("shortcut", "stop"), amp: 20 },
  { at: wordFrame("shortcut", "shortcut") + 4, amp: 12 },
];

type Fx = { at: number; src: string; vol: number };

const SFX: Fx[] = [
  { at: 0, src: "whoosh-down", vol: 0.5 },
  { at: wordFrame("surgery", "one") - 1, src: "pop", vol: 0.55 },
  ...SHOTS.slice(1).map((s) => ({
    at: s.from - 4,
    src: s.enter === "glitch" ? "glitch" : s.enter === "cut" ? "impact" : "whoosh",
    vol: s.enter === "cut" ? 0.9 : 0.55,
  })),
  { at: wordFrame("surgery", "operating"), src: "beep", vol: 0.35 },
  { at: wordFrame("surgery", "operating") + 12, src: "beep", vol: 0.35 },
  { at: wordFrame("surgery", "somebody"), src: "beep", vol: 0.4 },
  { at: wordFrame("surgery", "somebody") + 6, src: "beep", vol: 0.4 },
  { at: wordFrame("surgery", "somebody") + 2, src: "impact", vol: 0.35 },
  { at: wordFrame("plane", "one") - 1, src: "pop", vol: 0.55 },
  { at: wordFrame("plane", "article") + 2, src: "click", vol: 0.5 },
  { at: wordFrame("plane", "plane"), src: "glitch", vol: 0.5 },
  { at: wordFrame("youtube", "three") - 3, src: "pop", vol: 0.55 },
  { at: wordFrame("youtube", "youtube") - 3, src: "pop", vol: 0.55 },
  { at: wordFrame("youtube", "videos") - 3, src: "pop", vol: 0.55 },
  { at: wordFrame("youtube", "operating"), src: "click", vol: 0.7 },
  { at: wordFrame("youtube", "their"), src: "click", vol: 0.7 },
  { at: wordFrame("youtube", "account"), src: "whoosh-down", vol: 0.6 },
  { at: sceneStart("why") - 33, src: "riser", vol: 0.55 },
  { at: wordFrame("skill", "skill"), src: "chime", vol: 0.35 },
  { at: wordFrame("skill", "requires"), src: "pop", vol: 0.45 },
  { at: wordFrame("pillars", "education") + 4, src: "impact", vol: 0.55 },
  { at: wordFrame("pillars", "practice") + 4, src: "impact", vol: 0.55 },
  { at: wordFrame("pillars", "rules") + 4, src: "impact", vol: 0.6 },
  { at: wordFrame("pillars", "rules") + 24, src: "impact", vol: 0.4 },
  { at: wordFrame("shortcut", "stop") - 2, src: "impact", vol: 0.6 },
  { at: wordFrame("shortcut", "shortcut"), src: "glitch", vol: 0.45 },
  { at: wordFrame("shortcut", "shortcut") + 14, src: "whoosh-down", vol: 0.5 },
  { at: wordFrame("cta", "free") - 2, src: "coin", vol: 0.5 },
  { at: wordFrame("cta", "one-hour") - 2, src: "pop", vol: 0.5 },
  { at: wordFrame("cta", "abct") - 2, src: "chime", vol: 0.5 },
  { at: wordFrame("cta", "link") - 2, src: "pop", vol: 0.6 },
];

const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  for (const i of IMPACTS) {
    const s = shake(frame, i.at, i.amp);
    x += s.x;
    y += s.y;
  }
  // slow handheld drift
  x += Math.sin(frame / 47) * 3;
  y += Math.cos(frame / 61) * 3;
  return <AbsoluteFill style={{ translate: `${x}px ${y}px`, scale: "1.02" }}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => {
  const musicVolume = (f: number) => {
    const talk = Math.min(1, energyAt(f, 10) * 2.5);
    const fadeIn = interpolate(f, [0, 10], [0, 1], clamp);
    return (0.34 - 0.14 * talk) * fadeIn;
  };

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        {SHOTS.map((s, i) => {
          const next = SHOTS[i + 1];
          const length = s.to - s.from;
          return (
            <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={length + (next ? OVERLAP : 0)}>
              <ShotWrap enter={s.enter} next={next?.enter} length={length}>
                {sceneFor(s.id, s.from, length)}
              </ShotWrap>
            </Sequence>
          );
        })}
        <AvatarLayer />
        <Sequence from={SHOTS[SHOTS.length - 1].from} name="cta-foreground">
          <CtaForeground from={SHOTS[SHOTS.length - 1].from} />
        </Sequence>
      </Camera>

      {SHOTS.filter((s) => s.enter === "whip" || s.enter === "whipUp" || s.enter === "spin").map((s) => (
        <SpeedLines key={s.id} at={s.from - 2} />
      ))}
      <SpeedLines at={sceneStart("why")} dur={16} color={C.red} />
      <Flash at={sceneStart("why") - 1} color="#ffffff" dur={6} max={0.9} />
      {["education", "practice", "rules"].map((w) => (
        <Flash key={w} at={wordFrame("pillars", w) + 5} dur={7} max={0.45} />
      ))}
      <Flash at={wordFrame("shortcut", "stop") - 1} color={C.red} dur={8} max={0.5} />
      <LightLeak at={wordFrame("skill", "skill") - 4} dur={30} />
      <LightLeak at={wordFrame("cta", "abct") - 6} dur={34} />
      <LightLeak at={sceneStart("overnight") + 30} dur={40} hue="cool" />

      <Captions />
      <ProgressBar total={TOTAL_FRAMES} />
      <Finish />

      <Audio src={staticFile("voice.wav")} volume={1} />
      <Audio src={staticFile("music.wav")} volume={musicVolume} />
      {SFX.map((s, i) => (
        <Sequence key={`${s.src}-${i}`} from={Math.max(0, s.at)} layout="none" name={`sfx-${s.src}`}>
          <Audio src={staticFile(`sfx/${s.src}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
