import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Account } from "./scenes/Account";
import { Cta } from "./scenes/Cta";
import { Overnight } from "./scenes/Overnight";
import { Pillars } from "./scenes/Pillars";
import { Plane } from "./scenes/Plane";
import { Shortcut } from "./scenes/Shortcut";
import { Skill } from "./scenes/Skill";
import { Surgery } from "./scenes/Surgery";
import { Why } from "./scenes/Why";
import { YouTube } from "./scenes/YouTube";
import { scenes } from "./timeline";

const SCENES: Record<string, React.FC> = {
  surgery: Surgery,
  plane: Plane,
  youtube: YouTube,
  account: Account,
  why: Why,
  skill: Skill,
  pillars: Pillars,
  overnight: Overnight,
  shortcut: Shortcut,
  cta: Cta,
};

export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background />
      {scenes.map((s) => {
        const Scene = SCENES[s.id];
        const from = Math.round(s.start * fps);
        const to = Math.round(s.end * fps);
        return (
          <Sequence key={s.id} name={s.id} from={from} durationInFrames={to - from}>
            <Scene />
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
