import React from "react";
import { interpolate } from "remotion";
import { pop, prog, shake } from "../anim";
import { Icon, SceneFrame, useT } from "../components/ui";
import { C } from "../theme";
import { scene, wordAt } from "../timeline";

const ROUTE = ["LEARN", "PRACTICE", "FOLLOW RULES"];

export const Shortcut: React.FC = () => {
  const { start, end } = scene("shortcut");
  const t = useT(start);
  const stop = wordAt("shortcut", "stop");
  const ban = prog(t, stop - 0.05, 0.35);
  const pro = wordAt("shortcut", "professional");
  const hit = wordAt("shortcut", "shortcut");
  const dim = interpolate(ban, [0, 1], [1, 0.55]);

  return (
    <SceneFrame start={start} end={end}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 640, translate: shake(t, hit, 14, 6) }}>
        {/* pole */}
        <div
          style={{
            position: "absolute",
            left: 520,
            top: 330,
            width: 40,
            height: 320,
            background: "linear-gradient(90deg, #64748B, #CBD5E1, #64748B)",
            borderRadius: 8,
          }}
        />
        {/* highway sign */}
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 40,
            width: 780,
            height: 330,
            borderRadius: 34,
            background: "#0E7A3E",
            border: "12px solid #fff",
            boxShadow: "0 0 0 6px #0E7A3E, 0 30px 80px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            color: "#fff",
            fontWeight: 900,
            fontSize: 112,
            letterSpacing: 2,
            filter: `saturate(${dim})`,
            opacity: 0.4 + 0.6 * dim,
          }}
        >
          SHORTCUT
          <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </div>
        {/* no-entry ring drawn over the sign */}
        <svg width={1080} height={640} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle
            cx={540}
            cy={205}
            r={255}
            fill="none"
            stroke={C.red}
            strokeWidth={46}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ban}
            transform="rotate(-135 540 205)"
            style={{ filter: `drop-shadow(0 0 24px ${C.red})` }}
          />
          <line
            x1={540 - 180}
            y1={205 - 180}
            x2={540 - 180 + 360 * interpolate(ban, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            y2={205 - 180 + 360 * interpolate(ban, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            stroke={C.red}
            strokeWidth={46}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* the real route */}
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 990,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {ROUTE.map((r, i) => {
          const p = pop(t, pro + i * 0.28, 0.32);
          return (
            <React.Fragment key={r}>
              {i > 0 && (
                <div style={{ opacity: p, scale: String(p) }}>
                  <Icon.ChevronDown size={46} color={C.greenSoft} stroke={3.4} style={{ rotate: "-90deg" }} />
                </div>
              )}
              <div
                style={{
                  padding: "18px 26px",
                  borderRadius: 20,
                  background: `${C.green}22`,
                  border: `3px solid ${C.green}`,
                  fontSize: 36,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  scale: String(p),
                  opacity: Math.min(1, p * 2),
                }}
              >
                {r}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </SceneFrame>
  );
};
