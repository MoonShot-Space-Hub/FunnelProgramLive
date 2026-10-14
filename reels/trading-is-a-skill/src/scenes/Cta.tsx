import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { pop, prog } from "../anim";
import { Glow, Icon, Panel, SceneFrame, useT } from "../components/ui";
import { C } from "../theme";
import { line, scene, wordAt } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STAGES = ["BASICS", "SETUPS", "RISK RULES", "AI TOOLS"];

const LOGO = staticFile("brand/abct-with-ai-logo.png");
const LOGO_W = 1606;
const LOGO_H = 777;
const GOLD = "#F5B82E";

/** "If you want a structured place to begin": a roadmap with a start pin. */
const Roadmap: React.FC<{ t: number }> = ({ t }) => {
  const structured = wordAt("cta1", "structured");
  const begin = wordAt("cta1", "begin");
  const draw = prog(t, structured - 0.1, 0.9);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 760 }}>
      <svg width={1080} height={760} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d="M200 700 C 200 560, 880 600, 880 460 S 200 340, 200 210 S 700 80, 880 60"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={30}
          strokeLinecap="round"
        />
        <path
          d="M200 700 C 200 560, 880 600, 880 460 S 200 340, 200 210 S 700 80, 880 60"
          fill="none"
          stroke={C.yellow}
          strokeWidth={12}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          strokeLinecap="round"
        />
      </svg>
      {STAGES.map((s, i) => {
        const pts = [
          [200, 700],
          [880, 460],
          [200, 210],
          [880, 60],
        ][i];
        const p = pop(t, structured + i * 0.22, 0.3);
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: pts[0],
              top: pts[1],
              translate: "-50% -50%",
              scale: String(p),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: C.bg2,
                border: `8px solid ${C.yellow}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 74,
                fontSize: 34,
                fontWeight: 900,
                whiteSpace: "nowrap",
                padding: "6px 16px",
                borderRadius: 12,
                background: "rgba(6,10,19,0.85)",
              }}
            >
              {s}
            </div>
          </div>
        );
      })}
      {/* start pin drops on "begin" */}
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 700,
          translate: `-50% ${-100 - (1 - pop(t, begin - 0.1, 0.35)) * 260}%`,
          opacity: t > begin - 0.1 ? 1 : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "10px 22px",
            borderRadius: 14,
            background: C.yellow,
            color: "#000",
            fontWeight: 900,
            fontSize: 36,
            whiteSpace: "nowrap",
            marginBottom: 6,
          }}
        >
          START HERE
        </div>
        <Icon.Pin size={110} color={C.yellow} stroke={2.4} />
      </div>
    </div>
  );
};

export const Cta: React.FC = () => {
  const { start, end } = scene("cta");
  const t = useT(start);
  const card = line("cta2").start - 0.15;
  const cardIn = prog(t, card, 0.45);
  const free = wordAt("cta2", "free");
  const hour = wordAt("cta2", "one-hour");
  const abct = wordAt("cta2", "abct");
  const ai = wordAt("cta2", "ai");
  const master = wordAt("cta2", "masterclass");
  const logoIn = pop(t, abct - 0.08, 0.45);
  const sweep = prog(t, abct + 0.2, 0.75, (x) => x);
  const aiGlow = interpolate(t, [ai - 0.05, ai + 0.15, ai + 0.9], [0, 1, 0.35], clamp);
  const link = line("cta3").start - 0.05;
  const btn = pop(t, link, 0.4);
  const pulse = 1 + 0.035 * Math.sin(Math.max(0, t - link - 0.4) * 7);

  return (
    <SceneFrame start={start} end={end}>
      <div style={{ opacity: interpolate(cardIn, [0, 0.5], [1, 0], clamp) }}>
        <Roadmap t={t} />
      </div>

      {t >= card && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: interpolate(cardIn, [0, 0.4], [0, 1], clamp),
            translate: `0px ${(1 - cardIn) * 220}px`,
          }}
        >
          <Glow color={C.yellow} size={1300} style={{ left: 540, top: 640 }} opacity={0.22} />
          <Panel
            style={{
              left: 90,
              top: 240,
              width: 900,
              height: 900,
              border: `3px solid ${C.yellow}88`,
              background: "linear-gradient(170deg, #182544 0%, #0A1120 60%, #0B1A14 100%)",
            }}
          >
            {/* badges */}
            <div style={{ position: "absolute", left: 50, top: 50, display: "flex", gap: 20 }}>
              {[
                { at: free, label: "FREE", bg: C.green, fg: "#04140A" },
                { at: hour, label: "1 HOUR", bg: C.blue, fg: "#fff" },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    padding: "14px 30px",
                    borderRadius: 16,
                    background: b.bg,
                    color: b.fg,
                    fontSize: 46,
                    fontWeight: 900,
                    letterSpacing: 2,
                    scale: String(pop(t, b.at - 0.05, 0.32)),
                  }}
                >
                  {b.label}
                </div>
              ))}
            </div>
            {/* play button hero */}
            <div
              style={{
                position: "absolute",
                right: 60,
                top: 40,
                width: 150,
                height: 150,
                borderRadius: 75,
                background: C.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 ${50 + 20 * Math.sin(t * 5)}px ${C.red}AA`,
                scale: String(pop(t, card + 0.2, 0.4)),
              }}
            >
              <Icon.Play size={80} color="#fff" />
            </div>

            {/* ABCT (Anybody Can Trade) With AI logo: pops in on "ABCT", glows on "AI" */}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 190,
                width: 820,
                height: Math.round((820 * LOGO_H) / LOGO_W),
                opacity: Math.min(1, logoIn * 1.8),
                scale: String(0.82 + 0.18 * logoIn),
                filter: `drop-shadow(0 14px 22px rgba(0,0,0,0.6)) drop-shadow(0 0 ${36 * aiGlow}px rgba(0,212,255,${0.85 * aiGlow}))`,
              }}
            >
              <Img src={LOGO} style={{ width: "100%", height: "100%" }} />
              {/* light sweep clipped to the logo's shape */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: sweep > 0 && sweep < 1 ? 1 : 0,
                  background: `linear-gradient(105deg, transparent ${sweep * 150 - 45}%, rgba(255,255,255,0.9) ${sweep * 150 - 30}%, transparent ${sweep * 150 - 15}%)`,
                  WebkitMaskImage: `url(${LOGO})`,
                  maskImage: `url(${LOGO})`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 625,
                translate: "-50% 0",
                padding: "14px 34px",
                borderRadius: 18,
                border: `4px solid ${GOLD}`,
                boxShadow: `0 0 30px ${GOLD}55`,
                fontSize: 70,
                fontWeight: 900,
                letterSpacing: 8,
                whiteSpace: "nowrap",
                scale: String(pop(t, master - 0.05, 0.35)),
              }}
            >
              MASTERCLASS
            </div>
            <div
              style={{
                position: "absolute",
                left: 50,
                right: 50,
                bottom: 50,
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 36,
                fontWeight: 700,
                color: C.muted,
                opacity: prog(t, master + 0.3, 0.4),
              }}
            >
              <Icon.Check size={44} color={C.greenSoft} stroke={3} />
              Step-by-step · Beginner friendly
            </div>
          </Panel>
        </div>
      )}

      {t >= link && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1210,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              padding: "30px 64px",
              borderRadius: 999,
              background: C.yellow,
              color: "#000",
              fontWeight: 900,
              fontSize: 64,
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 20,
              scale: String(btn * pulse),
              boxShadow: `0 0 60px ${C.yellow}88, 0 20px 40px rgba(0,0,0,0.5)`,
            }}
          >
            <Icon.Play size={58} color="#000" />
            LINK IS BELOW
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                marginTop: -30,
                opacity: btn * (0.55 + 0.45 * Math.sin((t - link) * 6 - i * 1.2)),
                translate: `0px ${Math.sin((t - link) * 6 - i * 1.2) * 10}px`,
              }}
            >
              <Icon.ChevronDown size={110} color={C.yellow} stroke={3.4} />
            </div>
          ))}
        </div>
      )}
    </SceneFrame>
  );
};
