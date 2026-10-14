import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeOut, timeline } from "../lib";

const PUNCH_SEC = 0.13;

/** Punch-in zoom level at time t: fast eased jump between levels, plus a slow push between cuts. */
const zoomAt = (t: number) => {
  const z = timeline.zooms;
  let i = 0;
  while (i + 1 < z.length && z[i + 1][0] <= t) i++;
  const [t0, s0] = z[i];
  const prev = i > 0 ? z[i - 1][1] : s0;
  const next = i + 1 < z.length ? z[i + 1][0] : timeline.durationSec;
  const jump = interpolate(t, [t0, t0 + PUNCH_SEC], [prev, s0], { ...clamp, easing: easeOut });
  const drift = interpolate(t, [t0, next], [0, 0.018], clamp);
  return jump + drift;
};

export const Speaker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("input.mp4")}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: String(zoomAt(t)),
          transformOrigin: "50% 34%",
          filter: "contrast(1.06) saturate(1.1)",
        }}
      />
    </AbsoluteFill>
  );
};
