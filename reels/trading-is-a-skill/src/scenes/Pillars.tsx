import React from "react";
import { interpolate } from "remotion";
import { pop, prog } from "../anim";
import { Icon, Panel, SceneFrame, useT } from "../components/ui";
import { C } from "../theme";
import { line, scene, wordAt } from "../timeline";

const PILLARS = [
  { id: "education", n: "01", title: "EDUCATION", sub: "Learn a proven method", icon: Icon.Book, color: C.blue },
  { id: "practice", n: "02", title: "PRACTICE", sub: "Repeat until it's automatic", icon: Icon.Target, color: C.yellow },
  { id: "rules", n: "03", title: "RULES", sub: "Entry. Exit. Risk. Every time.", icon: Icon.Shield, color: C.green },
] as const;

export const Pillars: React.FC = () => {
  const { start, end } = scene("pillars");
  const t = useT(start);
  const head1 = pop(t, wordAt("requires", "every") - 0.05, 0.35);
  const head2 = pop(t, wordAt("requires", "requires") - 0.05, 0.35);
  const allDone = line("rules").end + 0.05;
  const flash = interpolate(t, [allDone, allDone + 0.12, allDone + 0.6], [0, 1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFrame start={start} end={end}>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontSize: 74,
            fontWeight: 900,
            letterSpacing: -1,
            opacity: head1,
            translate: `0px ${(1 - head1) * 40}px`,
          }}
        >
          EVERY REAL SKILL
        </div>
        <div
          style={{
            fontSize: 118,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
            color: C.yellow,
            scale: String(head2),
            textShadow: `0 0 50px ${C.yellow}55`,
          }}
        >
          REQUIRES
        </div>
      </div>

      {PILLARS.map((p, i) => {
        const at = line(p.id).start - 0.06;
        const e = pop(t, at, 0.36);
        const tick = prog(t, at + 0.25, 0.3);
        const IconC = p.icon;
        return (
          <Panel
            key={p.id}
            style={{
              left: 100,
              top: 560 + i * 250,
              width: 880,
              height: 220,
              display: "flex",
              alignItems: "center",
              gap: 34,
              padding: "0 40px",
              boxSizing: "border-box",
              opacity: Math.min(1, e * 2),
              translate: `${(1 - e) * 300}px 0px`,
              borderColor: tick > 0.5 ? p.color : undefined,
              boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 ${40 * flash}px ${p.color}`,
            }}
          >
            <div
              style={{
                width: 136,
                height: 136,
                borderRadius: 36,
                flexShrink: 0,
                background: `${p.color}22`,
                border: `3px solid ${p.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconC size={80} color={p.color} stroke={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: p.color, letterSpacing: 3 }}>{p.n}</div>
              <div style={{ fontSize: 78, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{p.title}</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: C.muted, marginTop: 8 }}>{p.sub}</div>
            </div>
            <div
              style={{
                width: 86,
                height: 86,
                borderRadius: 43,
                flexShrink: 0,
                background: C.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(pop(t, at + 0.25, 0.3)),
              }}
            >
              <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
              </svg>
            </div>
          </Panel>
        );
      })}
    </SceneFrame>
  );
};
