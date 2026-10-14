import React from "react";
import { pop, prog } from "../anim";
import { Icon, Panel, SceneFrame, useT } from "../components/ui";
import { C } from "../theme";
import { line, scene, wordAt } from "../timeline";

const STEPS = ["DAY 1", "MONTH 1", "MONTH 3", "MONTH 6"];

export const Overnight: React.FC = () => {
  const { start, end } = scene("overnight");
  const t = useT(start);
  const l = line("overnight");
  const strike = prog(t, wordAt("overnight", "overnight") + 0.1, 0.3);
  const climb = prog(t, l.start, end - l.start - 0.1, (x) => x);

  const stepW = 190;
  const stepH = 110;
  const baseX = 70;
  const baseY = 470;

  // climber hops up the stairs, one step at a time
  const pos = climb * (STEPS.length - 1);
  const idx = Math.min(STEPS.length - 2, Math.floor(pos));
  const frac = pos - idx;
  const rise = frac * frac * (3 - 2 * frac);
  const cx = baseX + pos * stepW + (stepW - 12) / 2;
  const cy = baseY - (idx + rise) * stepH - 34 - Math.sin(frac * Math.PI) * 50;

  return (
    <SceneFrame start={start} end={end}>
      <Panel style={{ left: 100, top: 250, width: 880, height: 900 }}>
        <div style={{ padding: "44px 50px 0", display: "flex", alignItems: "center", gap: 24 }}>
          <Icon.Moon size={70} color={C.yellow} stroke={2.4} />
          <div style={{ position: "relative", fontSize: 72, fontWeight: 900, letterSpacing: -1 }}>
            OVERNIGHT
            <div
              style={{
                position: "absolute",
                left: -10,
                top: "50%",
                height: 12,
                borderRadius: 6,
                width: `${strike * 105}%`,
                background: C.red,
                rotate: "-4deg",
              }}
            />
          </div>
        </div>
        <div
          style={{
            marginLeft: 50,
            marginTop: 10,
            fontSize: 36,
            fontWeight: 800,
            color: C.greenSoft,
            opacity: strike,
          }}
        >
          One step at a time
        </div>

        <svg width={880} height={700} style={{ position: "absolute", left: 0, top: 260 }}>
          {STEPS.map((s, i) => {
            const at = l.start + 0.15 + i * 0.5;
            const p = pop(t, at, 0.35);
            const x = baseX + i * stepW;
            const y = baseY - i * stepH;
            return (
              <g key={s} opacity={Math.min(1, p * 2)} transform={`translate(0 ${(1 - p) * 60})`}>
                <rect x={x} y={y} width={stepW - 12} height={700 - y} rx={14} fill={i === STEPS.length - 1 ? C.green : "#1B2A4A"} />
                <rect x={x} y={y} width={stepW - 12} height={10} rx={5} fill={C.greenSoft} />
                <text
                  x={x + (stepW - 12) / 2}
                  y={y + 56}
                  textAnchor="middle"
                  fontSize={30}
                  fontWeight={800}
                  fill="#fff"
                  fontFamily="inherit"
                >
                  {s}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={30} fill={C.yellow} stroke="#000" strokeWidth={4} opacity={pop(t, l.start + 0.2, 0.3)} />
        </svg>
      </Panel>
    </SceneFrame>
  );
};
