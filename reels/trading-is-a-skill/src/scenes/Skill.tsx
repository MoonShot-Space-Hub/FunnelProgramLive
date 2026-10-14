import React from "react";
import { interpolate } from "remotion";
import { pop, prog } from "../anim";
import { CandleChart, Glow, Icon, Panel, SceneFrame, candlesFrom, useT } from "../components/ui";
import { C } from "../theme";
import { scene, wordAt } from "../timeline";

const rising = candlesFrom([10, 13, 12, 16, 15, 19, 18, 23, 22, 27, 26, 31], 1.4);

export const Skill: React.FC = () => {
  const { start, end } = scene("skill");
  const t = useT(start);
  const unlock = wordAt("skill", "skill");
  const u = pop(t, unlock - 0.05, 0.4);
  const xp = prog(t, unlock, 0.9);

  return (
    <SceneFrame start={start} end={end}>
      <Glow color={C.green} size={1200} style={{ left: 540, top: 640 }} opacity={0.35 * u} />
      {/* light rays behind the card on unlock */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 640,
          width: 1600,
          height: 1600,
          translate: "-50% -50%",
          rotate: `${t * 20}deg`,
          opacity: 0.18 * u,
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,214,10,0.9) 0deg 6deg, transparent 6deg 24deg)",
          maskImage: "radial-gradient(circle, black 10%, transparent 60%)",
        }}
      />
      <Panel style={{ left: 130, top: 290, width: 820, height: 760, borderColor: u > 0.5 ? C.green : undefined }}>
        <div style={{ position: "absolute", left: 50, right: 50, bottom: 210, opacity: 0.85 }}>
          <CandleChart candles={rising} width={720} height={250} shown={prog(t, start, 1.2) * rising.length} />
        </div>
        <div style={{ padding: "54px 56px", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 24px",
              borderRadius: 14,
              background: `${C.yellow}22`,
              color: C.yellow,
              fontWeight: 900,
              fontSize: 34,
              letterSpacing: 3,
              scale: String(u),
            }}
          >
            NEW SKILL UNLOCKED
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 34 }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 34,
                background: `linear-gradient(150deg, ${C.green}, #15803D)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 50px ${C.green}66`,
              }}
            >
              <Icon.Candles size={92} color="#fff" stroke={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>TRADING</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: C.muted, marginTop: 8 }}>Professional skill</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 64 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            <span style={{ color: C.greenSoft }}>LEVEL 1</span>
            <span style={{ color: C.muted }}>{Math.round(interpolate(xp, [0, 1], [0, 120]))} / 10,000 XP</span>
          </div>
          <div style={{ height: 26, borderRadius: 13, background: "rgba(255,255,255,0.1)" }}>
            <div
              style={{
                height: 26,
                width: `${2 + xp * 6}%`,
                borderRadius: 13,
                background: `linear-gradient(90deg, ${C.green}, ${C.greenSoft})`,
                boxShadow: `0 0 20px ${C.green}`,
              }}
            />
          </div>
        </div>
      </Panel>
    </SceneFrame>
  );
};
