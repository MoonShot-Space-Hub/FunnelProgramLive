import React from "react";
import { interpolate } from "remotion";
import { prog } from "../anim";
import { Chip, Icon, Panel, SceneFrame, Stamp, useT } from "../components/ui";
import { C } from "../theme";
import { scene, wordAt } from "../timeline";

// One heartbeat, 200 units wide, baseline at y=0.
const BEAT =
  "l40 0 l10 -10 l10 10 l12 0 l8 22 l12 -110 l12 128 l10 -40 l14 0 l14 -18 l14 18 l44 0";

const Ecg: React.FC<{ t: number; width: number; height: number }> = ({ t, width, height }) => {
  const beats = Math.ceil(width / 200) + 2;
  const offset = (t * 260) % 200;
  const d = `M${-offset} ${height * 0.58} ` + Array.from({ length: beats }, () => BEAT).join(" ");
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="ecgfade" x1="0" x2="1">
          <stop offset="0" stopColor={C.greenSoft} stopOpacity="0.1" />
          <stop offset="0.75" stopColor={C.greenSoft} stopOpacity="1" />
          <stop offset="1" stopColor={C.greenSoft} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#ecgfade)" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={C.greenSoft}
        strokeOpacity={0.25}
        strokeWidth={22}
        strokeLinejoin="round"
        style={{ filter: "blur(8px)" }}
      />
    </svg>
  );
};

export const Surgery: React.FC = () => {
  const { start, end } = scene("surgery");
  const t = useT(start);
  const played = prog(t, 0.5, 3.2);
  const playBtn = interpolate(t, [0.45, 0.75], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const operating = wordAt("surgery", "operating");

  return (
    <SceneFrame start={start} end={end}>
      <Panel style={{ left: 100, top: 250, width: 880, height: 600 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #071A14 0%, #050D0B 100%)",
            backgroundImage:
              "linear-gradient(rgba(74,222,128,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(74,222,128,0.08) 2px, transparent 2px)",
            backgroundSize: "55px 55px",
          }}
        />
        <Ecg t={t} width={880} height={600} />
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 30,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 1,
          }}
        >
          <Icon.Scalpel size={50} color={C.text} />
          SURGERY 101
        </div>
        <div
          style={{
            position: "absolute",
            right: 36,
            top: 30,
            color: C.greenSoft,
            fontWeight: 900,
            fontSize: 44,
          }}
        >
          BPM {72 + Math.round(Math.sin(t * 3) * 3)}
        </div>
        {/* play overlay */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            translate: "-50% -50%",
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.14)",
            border: "4px solid rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: playBtn,
            scale: String(0.8 + 0.2 * playBtn),
          }}
        >
          <Icon.Play size={110} color="#fff" />
        </div>
        {/* player bar */}
        <div style={{ position: "absolute", left: 36, right: 36, bottom: 34 }}>
          <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.18)" }}>
            <div
              style={{
                height: 12,
                width: `${played * 100}%`,
                borderRadius: 6,
                background: C.red,
                boxShadow: `0 0 16px ${C.red}`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 30,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <span>{`${Math.floor(played * 10)}:${String(Math.floor((played * 600) % 60)).padStart(2, "0")}`}</span>
            <span>10:00</span>
          </div>
        </div>
      </Panel>

      <Chip t={t} at={wordAt("surgery", "one")} style={{ top: 905 }}>
        <Icon.Check size={50} color={C.greenSoft} stroke={3.4} />1 video watched
      </Chip>

      <Stamp t={t} at={operating} style={{ top: 560 }}>
        <Icon.X size={78} color={C.red} stroke={3.6} />
        Not a surgeon
      </Stamp>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.red,
          opacity: interpolate(t, [operating, operating + 0.05, operating + 0.3], [0, 0.18, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </SceneFrame>
  );
};
