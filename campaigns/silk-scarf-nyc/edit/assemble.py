#!/usr/bin/env python3
"""Cut the generated Higgsfield clips into the 20 s, 1080x1920, 24 fps commercial.

Reads edit/shots.csv (one row per shot: source file, in-point, length in frames,
transition, optional per-shot grade), conforms every clip to 1080x1920 @ 24 fps,
applies one shared warm look, overlays edit/endcard.png on the last shot, mixes
music + New York ambience, loudness-normalises to -14 LUFS and writes an MP4.

Usage (from campaigns/silk-scarf-nyc):
    python3 edit/assemble.py --check                       # validate clips + print timeline
    python3 edit/assemble.py --music audio/music.wav --ambience audio/nyc_street.wav

Transitions in shots.csv: "cut" (default) or "dissolve:N" (N frames, taken from
the tail of the previous shot, so the total length never changes).
"""
import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAMPAIGN = HERE.parent
FPS = 24
W, H = 1080, 1920
TOTAL_FRAMES = 20 * FPS

# Shared look: warm camel/chocolate balance, slightly lifted contrast, gently
# reduced saturation, soft vignette and fine grain to knit AI clips together.
LOOK = ",".join([
    "colorbalance=rs=0.025:bs=-0.035:rm=0.02:bm=-0.03:rh=0.015:bh=-0.02",
    "eq=contrast=1.04:saturation=0.94:gamma=0.98",
    "vignette=angle=0.32",
    "noise=alls=3:allf=t",
])


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout
    return float(json.loads(out)["format"]["duration"])


def load_shots(csv_path: Path, clips_dir: Path):
    shots = []
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            trans = (row.get("transition") or "cut").strip()
            dissolve = int(trans.split(":")[1]) if trans.startswith("dissolve:") else 0
            shots.append({
                "shot": row["shot"],
                "path": clips_dir / row["file"],
                "in": float(row["in_sec"]),
                "frames": int(row["frames"]),
                "dissolve_in": dissolve,
                "grade": (row.get("grade") or "").strip(),
            })
    if shots[0]["dissolve_in"]:
        sys.exit(f"{shots[0]['shot']}: the first shot cannot dissolve in")
    # A dissolve into shot k borrows its frames from the tail of shot k-1.
    for prev, cur in zip(shots, shots[1:]):
        prev["handle"] = cur["dissolve_in"]
    shots[-1]["handle"] = 0
    return shots


def check(shots) -> bool:
    ok, start = True, 0
    total = sum(s["frames"] for s in shots)
    print(f"{'shot':5} {'start':>7} {'end':>7} {'in':>6} {'need':>6} {'have':>6}  file")
    for s in shots:
        need = s["in"] + (s["frames"] + s["handle"]) / FPS
        if s["path"].exists():
            have = probe_duration(s["path"])
            status = "" if have + 1e-3 >= need else "  <-- clip too short for in-point + length"
            ok &= not status
            have_txt = f"{have:6.2f}"
        else:
            have_txt, status, ok = "  --  ", "  <-- missing", False
        tc = lambda fr: f"{fr // FPS:02d}:{fr % FPS:02d}"
        print(f"{s['shot']:5} {tc(start):>7} {tc(start + s['frames']):>7} {s['in']:6.2f} "
              f"{need:6.2f} {have_txt}  {s['path'].name}{status}")
        start += s["frames"]
    if total != TOTAL_FRAMES:
        print(f"timeline is {total} frames; expected {TOTAL_FRAMES} (20 s @ {FPS} fps)")
        ok = False
    return ok


def build_command(shots, args):
    cmd = ["ffmpeg", "-hide_banner", "-y"]
    for s in shots:
        cmd += ["-ss", f"{s['in']:.3f}", "-i", str(s["path"])]
    ec_idx = len(shots)
    # Loop the card past 20 s so the picture track, not the card, ends the overlay.
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", "21", "-i", str(args.endcard)]
    audio_inputs = []
    if args.music:
        cmd += ["-ss", f"{args.music_offset:.3f}", "-i", str(args.music)]
        audio_inputs.append(("music", len(shots) + 1 + len(audio_inputs)))
    if args.ambience:
        cmd += ["-stream_loop", "-1", "-i", str(args.ambience)]
        audio_inputs.append(("amb", len(shots) + 1 + len(audio_inputs)))

    fg = []
    for i, s in enumerate(shots):
        chain = [
            f"fps={FPS}",
            f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos",
            f"crop={W}:{H}",
            "setsar=1",
        ]
        if s["grade"]:
            chain.append(s["grade"])
        chain += [f"trim=end_frame={s['frames'] + s['handle']}", "setpts=PTS-STARTPTS",
                  "format=yuv420p"]
        fg.append(f"[{i}:v]{','.join(chain)}[v{i}]")

    # concat outputs a 1/1000000 timebase and xfade insists both inputs match,
    # so every join is pinned back to 1/FPS.
    acc, t = "v0", shots[0]["frames"]
    for i, s in enumerate(shots[1:], start=1):
        out = f"x{i}"
        if s["dissolve_in"]:
            fg.append(f"[{acc}][v{i}]xfade=transition=fade:duration={s['dissolve_in'] / FPS:.4f}"
                      f":offset={t / FPS:.4f},settb=1/{FPS}[{out}]")
        else:
            fg.append(f"[{acc}][v{i}]concat=n=2:v=1:a=0,settb=1/{FPS}[{out}]")
        acc, t = out, t + s["frames"]

    endcard_start = args.endcard_start
    if endcard_start is None:
        endcard_start = (TOTAL_FRAMES - shots[-1]["frames"]) / FPS + 0.25
    fg.append(f"[{acc}]{LOOK},format=yuv420p[graded]")
    fg.append(f"[{ec_idx}:v]format=rgba,fade=t=in:st={endcard_start:.3f}:d=0.75:alpha=1[ec]")
    fg.append("[graded][ec]overlay=0:0:format=auto:shortest=1,format=yuv420p[vout]")

    labels = []
    for name, idx in audio_inputs:
        gain = "0dB" if name == "music" else f"{args.ambience_gain}dB"
        fade_in = 0.3 if name == "music" else 0.6
        fg.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:20,"
                  f"asetpts=PTS-STARTPTS,afade=t=in:st=0:d={fade_in},"
                  f"afade=t=out:st=18.6:d=1.4,volume={gain}[{name}]")
        labels.append(f"[{name}]")
    if labels:
        mix = (f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest"
               if len(labels) > 1 else f"{labels[0]}anull")
        fg.append(f"{mix},loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000,apad[aout]")
    else:
        fg.append("anullsrc=r=48000:cl=stereo[aout]")

    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
            "-t", "20", "-r", str(FPS),
            "-c:v", "libx264", "-preset", "slow", "-crf", str(args.crf),
            "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
            "-movflags", "+faststart", str(args.out)]
    return cmd


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--shots", type=Path, default=HERE / "shots.csv")
    ap.add_argument("--clips-dir", type=Path, default=CAMPAIGN / "clips")
    ap.add_argument("--endcard", type=Path, default=HERE / "endcard.png")
    ap.add_argument("--music", type=Path)
    ap.add_argument("--music-offset", type=float, default=0.0, help="seconds into the track to start")
    ap.add_argument("--ambience", type=Path, help="looped under the music")
    ap.add_argument("--ambience-gain", type=float, default=-14.0, help="dB relative to the music")
    ap.add_argument("--endcard-start", type=float, help="seconds; default = last shot start + 0.25")
    ap.add_argument("--crf", type=int, default=16)
    ap.add_argument("--out", type=Path, default=CAMPAIGN / "export" / "silk_scarf_nyc_20s_1080x1920.mp4")
    ap.add_argument("--check", action="store_true", help="validate clips and print the timeline only")
    ap.add_argument("--print-cmd", action="store_true")
    args = ap.parse_args()

    shots = load_shots(args.shots, args.clips_dir)
    ok = check(shots)
    if args.check:
        sys.exit(0 if ok else 1)
    if not ok:
        sys.exit("fix the problems above before rendering (or run with --check)")
    if not args.endcard.exists():
        sys.exit(f"missing {args.endcard}; run edit/make_endcard.py first")
    if not args.music:
        print("warning: no --music given; exporting with a silent audio track", file=sys.stderr)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    cmd = build_command(shots, args)
    if args.print_cmd:
        print(" ".join(cmd))
    subprocess.run(cmd, check=True)
    print(f"wrote {args.out} ({probe_duration(args.out):.3f} s)")


if __name__ == "__main__":
    main()
