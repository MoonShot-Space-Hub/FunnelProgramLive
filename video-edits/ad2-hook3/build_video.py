#!/usr/bin/env python3
"""Build the edited "Ad 2 / Hook 3" reel.

Burns English captions (with a black gradient behind them) onto the source
video, and optionally overlays B-roll clips and a ducked background-music bed.

Usage:
  python3 build_video.py --input in.mp4 --fonts fonts/ --out out.mp4 \
      [--broll broll.json] [--music track.mp3] [--music-volume 0.14]

broll.json is a list of {"file": "...", "start": 2.5, "end": 5.5, "offset": 0}
(start/end are timeline seconds, offset is where to start inside the clip;
relative paths resolve against the JSON file's folder).

Needs ffmpeg with libass, Pillow, fontTools, and a Montserrat Black TTF in
--fonts (e.g. from the @expo-google-fonts/montserrat npm package).
"""
import argparse
import glob
import json
import os
import re
import subprocess
import tempfile

from fontTools.ttLib import TTFont
from PIL import ImageFont

W, H = 1080, 1920

# --- Captions -------------------------------------------------------------
# Speech is Hindi/Hinglish; these are English captions timed to the speech.
# [brackets] mark words highlighted in yellow.
# SEG entries are split across their time span in proportion to text length;
# CUE entries carry explicit times (used where the speaker talks in English).
SEG, CUE = "seg", "cue"
CAPTIONS = [
    (SEG, 0.00, 2.40, ["Can we compare [trading]", "with [Garba]?"]),
    (SEG, 2.48, 7.68, ["If you've noticed", "during [Navratri],", "different songs start", "with different [steps]"]),
    (SEG, 7.68, 9.70, ["because every song", "has its own [rhythm]."]),
    (SEG, 9.76, 12.10, ["In the same way,", "[market trends] change too."]),
    (SEG, 12.12, 14.36, ["[Uptrend], [downtrend]", "and [sideways]."]),
    (SEG, 14.40, 19.30, ["If you don't change", "your [strategy] or steps,", "you'll take a [loss]."]),
    (SEG, 19.40, 22.05, ["That's why you need", "a [systematic approach]."]),
    (SEG, 22.08, 24.56, ["If you want to learn", "this [systematic approach]:"]),
    (CUE, 24.56, 25.20, "[Step 1]:"),
    (CUE, 25.20, 25.70, "[Entry],"),
    (CUE, 25.70, 26.18, "[Exit],"),
    (CUE, 26.18, 26.66, "[Stop loss],"),
    (CUE, 26.66, 27.14, "[Target]."),
    (CUE, 27.16, 28.05, "What's an [uptrend]?"),
    (CUE, 28.05, 28.75, "A [downtrend]?"),
    (CUE, 28.75, 29.85, "A [sideways trend]?"),
    (SEG, 29.88, 31.54, ["It's crucial", "to [identify] them"]),
    (SEG, 31.56, 33.94, ["and apply [our system]", "accordingly."]),
    (SEG, 33.96, 36.38, ["I'm teaching all of this", "in a [FREE masterclass]."]),
    (SEG, 36.44, 38.56, ["In this one masterclass,", "you'll learn it all"]),
    (SEG, 38.56, 41.46, ["plus [risk management]", "and [mind management]"]),
    (SEG, 41.48, 42.98, ["and how to [handle] them."]),
    (SEG, 43.06, 44.30, ["And it's [absolutely FREE]!"]),
    (CUE, 44.32, 45.06, "So [click] on the link"),
    (CUE, 45.06, 45.76, "and check out this"),
    (CUE, 45.76, 46.78, "[1-hour masterclass]"),
    (CUE, 46.78, 47.40, "where you'll learn"),
    (CUE, 47.40, 48.36, "the [step-by-step] process"),
    (CUE, 48.36, 49.20, "to become a"),
    (CUE, 49.20, 50.30, "[systematic trader]."),
    (CUE, 50.45, 51.22, "So [click] on the link"),
    (CUE, 51.22, 51.94, "and [book your seat]"),
    (CUE, 51.94, 52.36, "[right now]!"),
]

FONT = "Montserrat Black"
FONT_SIZE = 116
MAX_LINE_PX = 900  # line breaks are fixed up front so the pop-in scale can't re-wrap text
WHITE = "&H00FFFFFF"
YELLOW = "&H0000D4FF"  # #FFD400 in ASS BGR order
CAPTION_BOTTOM_MARGIN = 470  # px from bottom; clears the Reels/Shorts UI
GAP_FILL = 0.35  # bridge caption gaps shorter than this to avoid flicker

# Gradient: transparent above GRAD_TOP, easing to GRAD_MAX_ALPHA black by GRAD_FULL.
GRAD_TOP = 860
GRAD_FULL = 1680
GRAD_MAX_ALPHA = 0.9
GRAD_STRIP = 4
GRAD_MERGE = 0.6  # keep gradient up through caption gaps shorter than this
GRAD_FADE_MS = 250


def expand_cues():
    cues = []
    for kind, start, end, text in CAPTIONS:
        if kind == CUE:
            cues.append([start, end, text])
            continue
        weights = [len(re.sub(r"[\[\]]", "", t)) + 4 for t in text]
        t = start
        for chunk, w in zip(text, weights):
            d = (end - start) * w / sum(weights)
            cues.append([t, t + d, chunk])
            t += d
    for a, b in zip(cues, cues[1:]):
        if 0 < b[0] - a[1] < GAP_FILL:
            a[1] = b[0]
    return cues


def ass_time(t):
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def load_caption_font(fonts_dir):
    """Return a PIL font plus the factor that maps its widths to libass pixels.

    libass sizes text so that the font's Windows ascent+descent equals \\fs,
    whereas PIL sizes by the em square.
    """
    path = glob.glob(os.path.join(fonts_dir, "*Black*.ttf"))[0]
    tt = TTFont(path)
    scale = tt["head"].unitsPerEm / (tt["OS/2"].usWinAscent + tt["OS/2"].usWinDescent)
    return ImageFont.truetype(path, FONT_SIZE), scale


def line_breaks(text, font, scale):
    """Split into two balanced lines when the caption is wider than MAX_LINE_PX."""
    words = text.split(" ")

    def width(ws):
        plain = re.sub(r"[\[\]]", "", " ".join(ws)).upper()
        return font.getlength(plain) * scale + len(plain)  # +1px letter spacing per char

    if len(words) < 2 or width(words) <= MAX_LINE_PX:
        return text
    best = min(range(1, len(words)), key=lambda i: max(width(words[:i]), width(words[i:])))
    return " ".join(words[:best]) + r"\N" + " ".join(words[best:])


def caption_markup(text):
    text = text.upper()
    return re.sub(r"\[([^\]]+)\]", lambda m: "{\\c" + YELLOW + "&}" + m.group(1) + "{\\c" + WHITE + "&}", text)


def gradient_intervals(cues):
    spans = []
    for s, e, _ in cues:
        if spans and s - spans[-1][1] < GRAD_MERGE:
            spans[-1][1] = max(spans[-1][1], e)
        else:
            spans.append([s, e])
    return spans


def gradient_events(start, end):
    events = []
    for y in range(GRAD_TOP, H, GRAD_STRIP):
        x = min(1.0, (y + GRAD_STRIP / 2 - GRAD_TOP) / (GRAD_FULL - GRAD_TOP))
        ease = x * x * (3 - 2 * x)  # smoothstep
        alpha = 255 - int(round(255 * GRAD_MAX_ALPHA * ease))
        if alpha >= 255:
            continue
        shape = f"m 0 0 l {W} 0 {W} {GRAD_STRIP} 0 {GRAD_STRIP}"
        tags = f"{{\\an7\\pos(0,{y})\\bord0\\shad0\\1c&H000000&\\1a&H{alpha:02X}&\\fad({GRAD_FADE_MS},{GRAD_FADE_MS})\\p1}}"
        events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Grad,,0,0,0,,{tags}{shape}{{\\p0}}")
    return events


def write_ass(path, cues, fonts_dir):
    font, scale = load_caption_font(fonts_dir)
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{FONT},{FONT_SIZE},{WHITE},{WHITE},&H00000000,&H90000000,0,0,0,0,100,100,1,0,1,8,4,2,60,60,{CAPTION_BOTTOM_MARGIN},1
Style: Grad,{FONT},20,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for s, e in gradient_intervals(cues):
        lines += gradient_events(s, e)
    pop = r"{\fad(60,0)\fscx72\fscy72\t(0,90,\fscx108\fscy108)\t(90,170,\fscx100\fscy100)}"
    for s, e, text in cues:
        lines.append(f"Dialogue: 1,{ass_time(s)},{ass_time(e)},Caption,,0,0,0,,{pop}{caption_markup(line_breaks(text, font, scale))}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(lines) + "\n")


def write_srt(path, cues):
    def ts(t):
        ms = int(round(t * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    with open(path, "w", encoding="utf-8") as f:
        for i, (s, e, text) in enumerate(cues, 1):
            f.write(f"{i}\n{ts(s)} --> {ts(e)}\n{re.sub(r'[\[\]]', '', text)}\n\n")


def probe_duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(out)


def build(args):
    cues = expand_cues()
    work = tempfile.mkdtemp(prefix="reel_")
    ass_path = os.path.join(work, "captions.ass")
    write_ass(ass_path, cues, args.fonts)
    if args.srt:
        write_srt(args.srt, cues)
    if args.ass_copy:
        write_ass(args.ass_copy, cues, args.fonts)

    duration = probe_duration(args.input)
    broll = json.load(open(args.broll)) if args.broll else []
    broll_dir = os.path.dirname(os.path.abspath(args.broll)) if args.broll else ""

    inputs = ["-i", args.input]
    graph = ["[0:v]setsar=1[base0]"]
    last = "base0"
    for i, clip in enumerate(broll, 1):
        inputs += ["-ss", str(clip.get("offset", 0)), "-i", os.path.join(broll_dir, clip["file"])]
        d = clip["end"] - clip["start"]
        fade = min(0.2, d / 4)
        # Cover-crop to 9:16, slow push-in, fade edges, shift onto the timeline.
        graph.append(
            f"[{i}:v]trim=duration={d:.3f},setpts=PTS-STARTPTS,fps=60,"
            f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
            f"scale=w='{W}*(1+0.06*t/{d:.3f})':h=-2:eval=frame,crop={W}:{H},"
            f"format=yuva420p,fade=t=in:st=0:d={fade:.3f}:alpha=1,fade=t=out:st={d - fade:.3f}:d={fade:.3f}:alpha=1,"
            f"setpts=PTS+{clip['start']:.3f}/TB[b{i}]"
        )
        graph.append(f"[{last}][b{i}]overlay=eof_action=pass:enable='between(t,{clip['start']:.3f},{clip['end']:.3f})'[base{i}]")
        last = f"base{i}"
    fonts_dir = os.path.abspath(args.fonts).replace(":", r"\:")
    graph.append(f"[{last}]subtitles=filename='{ass_path}':fontsdir='{fonts_dir}',format=yuv420p[vout]")

    audio_map = "0:a"
    if args.music:
        idx = len(broll) + 1
        inputs += ["-stream_loop", "-1", "-i", args.music]
        fade_out = max(duration - 2.0, 0)
        graph.append("[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voice][key]")
        graph.append(
            f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=duration={duration:.3f},"
            f"volume={args.music_volume},afade=t=in:st=0:d=1.0,afade=t=out:st={fade_out:.3f}:d=2.0[bed]"
        )
        # Duck the music under the voice.
        graph.append("[bed][key]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=350[ducked]")
        graph.append("[voice][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[aout]")
        audio_map = "[aout]"

    cmd = ["ffmpeg", "-hide_banner", "-y", *inputs, "-filter_complex", ";".join(graph),
           "-map", "[vout]", "-map", audio_map,
           "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-profile:v", "high", "-pix_fmt", "yuv420p",
           "-r", "60", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
           "-t", f"{duration:.3f}", args.out]
    print(" ".join(cmd[:4]), "... ->", args.out)
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--fonts", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--broll")
    p.add_argument("--music")
    p.add_argument("--music-volume", type=float, default=0.14)
    p.add_argument("--srt")
    p.add_argument("--ass-copy")
    build(p.parse_args())
