import React from "react";
import { interpolate } from "remotion";
import { pop, prog, shake } from "../anim";
import { CandleChart, Icon, Panel, SceneFrame, candlesFrom, useT } from "../components/ui";
import { C } from "../theme";
import { line, scene, wordAt } from "../timeline";

const closes = [100, 101.5, 100.8, 102.6, 101.2, 98.4, 99.1, 95.3, 96.2, 91.8, 88.6, 90.1, 84.2, 79.8, 81.3, 74.6, 69.9, 71.2, 63.4, 58.2, 52.7, 47.9];
const candles = candlesFrom(closes, 1.6);
const START_BAL = 100000;
const END_BAL = 41860;

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const toasts = [
  { word: "operating", text: "BUY BANKNIFTY CE", color: C.green, icon: "check" },
  { word: "their", text: "STOP LOSS HIT", color: C.red, icon: "x" },
  { word: "trading", text: "REVENGE TRADE", color: C.red, icon: "x" },
] as const;

export const Account: React.FC = () => {
  const { start, end } = scene("account");
  const t = useT(start);
  const l = line("account");
  const crash = prog(t, l.start + 0.15, l.end - l.start + 0.1, (x) => x);
  const bal = interpolate(crash, [0, 0.12, 1], [START_BAL, 101800, END_BAL]);
  const pnl = ((bal - START_BAL) / START_BAL) * 100;
  const hit = wordAt("account", "account");

  return (
    <SceneFrame start={start} end={end}>
      <div style={{ position: "absolute", inset: 0, translate: shake(t, hit, 16, 5) }}>
        <Panel style={{ left: 100, top: 250, width: 880, height: 820 }}>
          <div style={{ padding: "36px 44px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>MY TRADING ACCOUNT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 800, color: C.red }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: C.red,
                    opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 5)),
                  }}
                />
                LIVE
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 18 }}>
              <div
                style={{
                  fontSize: 118,
                  fontWeight: 900,
                  letterSpacing: -2,
                  color: interpolate(crash, [0.15, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) > 0.5 ? C.red : C.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {inr(bal)}
              </div>
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "8px 22px",
                borderRadius: 14,
                fontSize: 40,
                fontWeight: 900,
                color: pnl < 0 ? C.red : C.green,
                background: pnl < 0 ? `${C.red}22` : `${C.green}22`,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(1)}%
            </div>
          </div>
          <div style={{ position: "absolute", left: 44, bottom: 50 }}>
            <CandleChart candles={candles} width={792} height={430} shown={2 + crash * (candles.length - 2)} />
          </div>
        </Panel>

        {toasts.map((x, i) => {
          const at = wordAt("account", x.word);
          const p = pop(t, at, 0.3);
          if (t < at) return null;
          return (
            <div
              key={x.text}
              style={{
                position: "absolute",
                right: 70 + (i % 2) * 40,
                top: 600 + i * 120,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 26px",
                borderRadius: 20,
                background: "#0B1222EE",
                border: `3px solid ${x.color}`,
                fontSize: 34,
                fontWeight: 900,
                color: x.color,
                scale: String(p),
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              }}
            >
              {x.icon === "check" ? (
                <Icon.Check size={40} color={x.color} stroke={3.4} />
              ) : (
                <Icon.X size={40} color={x.color} stroke={3.4} />
              )}
              {x.text}
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
