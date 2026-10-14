import React from "react";
import { interpolate } from "remotion";
import { prog } from "../anim";
import { Chip, Icon, Panel, SceneFrame, Stamp, useT } from "../components/ui";
import { C } from "../theme";
import { line, scene, wordAt } from "../timeline";

export const Plane: React.FC = () => {
  const { start, end } = scene("plane");
  const t = useT(start);
  const fly = wordAt("plane", "fly");
  const verdict = wordAt("plane", "plane");
  const flight = prog(t, fly - 0.25, line("plane").end - fly + 0.6, (x) => x);
  // a wobbly take-off that stalls and drops
  const px = interpolate(flight, [0, 1], [-140, 1000]);
  const py =
    interpolate(flight, [0, 0.45, 0.62, 1], [380, 160, 150, 470], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
    Math.sin(flight * 28) * 14;
  const pr = interpolate(flight, [0, 0.45, 0.62, 1], [-20, -28, 20, 60]) + Math.sin(flight * 31) * 9;

  return (
    <SceneFrame start={start} end={end}>
      <Panel light style={{ left: 100, top: 250, width: 880, height: 600 }}>
        <div
          style={{
            height: 74,
            background: "#E3E9F3",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 30px",
          }}
        >
          {["#F87171", "#FBBF24", "#34D399"].map((c) => (
            <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 20,
              flex: 1,
              height: 40,
              borderRadius: 20,
              background: "#fff",
              color: "#64748B",
              fontSize: 24,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              padding: "0 22px",
            }}
          >
            blog / how-to-fly-a-plane
          </div>
        </div>
        <div style={{ padding: "34px 44px", color: "#0F172A" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.blue, letterSpacing: 2 }}>BEGINNER GUIDE · 5 MIN READ</div>
          <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.05, marginTop: 12 }}>How to Fly a Plane</div>
          <div style={{ display: "flex", gap: 30, marginTop: 34 }}>
            <div
              style={{
                width: 250,
                height: 210,
                borderRadius: 22,
                background: "linear-gradient(160deg, #60A5FA, #1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.Plane size={130} color="#fff" style={{ rotate: "45deg" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22, paddingTop: 10 }}>
              {[1, 0.92, 0.97, 0.7, 0.85].map((w, i) => (
                <div key={i} style={{ height: 20, width: `${w * 100}%`, borderRadius: 10, background: "#CBD5E1" }} />
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Chip t={t} at={wordAt("plane", "one")} color={C.blue} style={{ top: 905 }}>
        <Icon.Check size={50} color="#93C5FD" stroke={3.4} />1 article read
      </Chip>

      {t > fly - 0.25 && (
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <div
            style={{
              position: "absolute",
              left: px,
              top: py,
              rotate: `${pr + 90}deg`,
              filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.6))",
            }}
          >
            <Icon.Plane size={190} color="#fff" />
          </div>
        </div>
      )}

      <Stamp t={t} at={verdict} style={{ top: 560 }} rotate={7}>
        <Icon.X size={78} color={C.red} stroke={3.6} />
        Not a pilot
      </Stamp>
    </SceneFrame>
  );
};
