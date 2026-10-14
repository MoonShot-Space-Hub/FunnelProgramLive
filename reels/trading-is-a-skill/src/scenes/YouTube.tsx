import React from "react";
import { pop } from "../anim";
import { CandleChart, Chip, Icon, Panel, SceneFrame, candlesFrom, useT } from "../components/ui";
import { C } from "../theme";
import { scene, wordAt } from "../timeline";

const VIDEOS = [
  { title: "Trading for Beginners", meta: "1.2M views · 2 days ago", len: "12:04", hue: "#1E3A8A", up: true },
  { title: "₹10,000 per day?!", meta: "860K views · 1 week ago", len: "9:47", hue: "#7C2D12", up: true },
  { title: "Secret Options Trick", meta: "2.4M views · 3 days ago", len: "8:31", hue: "#3B0764", up: false },
];

const thumbCandles = [
  candlesFrom([10, 12, 11, 14, 13, 16, 15, 18, 21, 20, 24]),
  candlesFrom([10, 11, 13, 12, 15, 17, 16, 19, 22, 25, 28]),
  candlesFrom([20, 18, 21, 17, 19, 15, 16, 12, 14, 10, 8]),
];

export const YouTube: React.FC = () => {
  const { start, end } = scene("youtube");
  const t = useT(start);
  const at = [wordAt("youtube", "watch"), wordAt("youtube", "three"), wordAt("youtube", "youtube")];

  return (
    <SceneFrame start={start} end={end}>
      {VIDEOS.map((v, i) => {
        const p = pop(t, at[i] - 0.05, 0.34);
        return (
          <Panel
            key={v.title}
            style={{
              left: 100,
              top: 250 + i * 285,
              width: 880,
              height: 255,
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: 22,
              boxSizing: "border-box",
              opacity: Math.min(1, p * 2),
              translate: `${(1 - p) * (i % 2 ? -260 : 260)}px 0px`,
              scale: String(0.9 + 0.1 * p),
            }}
          >
            <div
              style={{
                position: "relative",
                width: 370,
                height: 208,
                borderRadius: 22,
                overflow: "hidden",
                flexShrink: 0,
                background: `linear-gradient(150deg, ${v.hue} 0%, #050816 100%)`,
              }}
            >
              <div style={{ position: "absolute", left: 30, top: 34 }}>
                <CandleChart candles={thumbCandles[i]} width={310} height={140} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  translate: "-50% -50%",
                  width: 110,
                  height: 76,
                  borderRadius: 22,
                  background: C.red,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <Icon.Play size={52} color="#fff" />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  padding: "4px 12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.8)",
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                {v.len}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.08 }}>{v.title}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: C.muted }}>{v.meta}</div>
            </div>
          </Panel>
        );
      })}

      <Chip t={t} at={wordAt("youtube", "videos")} color={C.yellow} style={{ top: 1100, fontSize: 42, padding: "14px 32px" }}>
        <Icon.Clock size={46} color={C.yellow} stroke={3} />
        Total: 30 minutes
      </Chip>
    </SceneFrame>
  );
};
