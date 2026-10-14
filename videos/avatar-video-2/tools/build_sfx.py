"""Write the sound-design <audio> cues into index.html (between SFX_BEGIN / SFX_END).

Run from the project root:  python3 tools/build_sfx.py
Each cue is (event time in seconds, file, volume, optional media offset, optional duration).
The script subtracts each file's measured peak offset so the hit lands on the event.
All files are the Pixabay-licensed SFX bundled with HyperFrames (assets/sfx/CREDITS.md).
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# seconds from file start to its loudest moment (measured)
PEAK = {
    "whoosh": 0.16,
    "whoosh-short": 0.16,
    "impact-bass-1": 0.08,
    "impact-bass-2": 1.68,
    "pop": 0.13,
    "sparkle": 0.04,
    "click-soft": 0.02,
    "chime": 0.05,
    "glitch-2": 1.18,
}
LENGTH = {
    "whoosh": 0.57,
    "whoosh-short": 0.57,
    "impact-bass-1": 2.12,
    "impact-bass-2": 2.59,
    "pop": 0.72,
    "sparkle": 1.8,
    "click-soft": 0.37,
    "chime": 2.5,
    "glitch-2": 3.5,
}

# Volumes come from each file's measured loudness against the voice (-18.9 LUFS):
# impacts are mastered very hot (-4.5 to -6.5 LUFS), so they sit near 0.1;
# whooshes (-15 LUFS) near 0.23; sparkle (-11 LUFS) 0.11; glitch (-4.5 LUFS) 0.06.
CUES = [
    # c1 money everywhere (0.56–2.44)
    (0.60, "whoosh", 0.24, "c1 in"),
    (1.28, "sparkle", 0.11, "coin rain on money"),
    (1.92, "pop", 0.32, "MONEY IS EVERYWHERE chip"),
    (2.30, "whoosh-short", 0.22, "c1 out"),
    # c2 beliefs installed (6.76–9.20)
    (6.80, "whoosh", 0.24, "c2 in"),
    (8.08, "click-soft", 0.3, "progress bar"),
    (8.80, "impact-bass-1", 0.08, "padlock slams"),
    (9.06, "whoosh-short", 0.22, "c2 out"),
    # c3 rewind to childhood (11.00–13.10)
    (10.94, "whoosh", 0.24, "c3 blocks"),
    (11.06, "glitch-2", 0.05, "rewind", 0.9, 0.7),
    (12.08, "pop", 0.3, "speech bubbles"),
    # c4 the old beliefs (13.10–19.02)
    (13.14, "whoosh-short", 0.22, "c4 in"),
    (13.84, "impact-bass-1", 0.07, "HARD"),
    (14.88, "whoosh-short", 0.2, "card 2"),
    (15.84, "impact-bass-1", 0.07, "SELFISH"),
    (16.72, "whoosh-short", 0.2, "card 3"),
    (17.84, "impact-bass-1", 0.09, "NEVER"),
    (17.84, "glitch-2", 0.04, "NEVER glitch", 0.9, 0.6),
    (18.88, "whoosh-short", 0.22, "c4 out"),
    # c5 strings on your decisions (21.30–24.90)
    (21.24, "whoosh", 0.24, "c5 blocks"),
    (22.32, "whoosh-short", 0.2, "strings pull"),
    (24.00, "sparkle", 0.09, "glint on realizing"),
    (24.76, "whoosh-short", 0.22, "c5 out"),
    # c6 question the old beliefs (29.10–31.92)
    (29.14, "whoosh", 0.24, "c6 in"),
    (30.24, "impact-bass-1", 0.08, "question mark"),
    (31.04, "click-soft", 0.3, "cracks"),
    (31.36, "click-soft", 0.3, "cards split"),
    # c7 new habits, begin today (31.92–36.50)
    (31.96, "whoosh-short", 0.22, "c7 in"),
    (32.48, "whoosh-short", 0.2, "loop snaps open"),
    (32.96, "click-soft", 0.28, "step 1"),
    (33.16, "click-soft", 0.28, "step 2"),
    (33.36, "pop", 0.3, "NEW HABITS chip"),
    (35.68, "whoosh-short", 0.2, "calendar flips"),
    (36.08, "impact-bass-1", 0.08, "DAY 1 stamp"),
    (36.08, "sparkle", 0.11, "gold burst"),
    (36.36, "whoosh-short", 0.22, "c7 out"),
    # c8 free training (39.90–42.10)
    (39.94, "whoosh", 0.24, "c8 in"),
    (40.72, "impact-bass-1", 0.08, "FREE stamp"),
    (40.72, "sparkle", 0.1, "FREE burst"),
    (41.12, "click-soft", 0.28, "clock sweep"),
    (41.96, "whoosh-short", 0.22, "c8 out"),
    # CTA overlay (42.04–43.32)
    (42.16, "pop", 0.32, "CLICK THE LINK BELOW button"),
    (42.64, "click-soft", 0.34, "button tap"),
    (42.90, "sparkle", 0.09, "chevrons"),
]

END = 43.32
lines = ["      <!-- SFX_BEGIN -->"]
for n, cue in enumerate(CUES, 1):
    event, name, vol, label = cue[:4]
    media_start = cue[4] if len(cue) > 4 else 0.0
    peak = max(0.0, PEAK[name] - media_start)
    start = round(max(0.0, event - peak), 3)
    dur = cue[5] if len(cue) > 5 else LENGTH[name] - media_start
    dur = round(min(dur, END - start), 3)
    attrs = [
        f'id="sfx-{n:02d}"',
        f'src="assets/sfx/{name}.mp3"',
        f'data-start="{start}"',
        f'data-duration="{dur}"',
    ]
    if media_start:
        attrs.append(f'data-media-start="{media_start}"')
    attrs += [f'data-track-index="{9 + (n % 3)}"', f'data-volume="{vol}"', 'data-audio-group="sfx"']
    lines.append(f"      <!-- {label} -->")
    lines.append(f"      <audio {' '.join(attrs)}></audio>")
lines.append("      <!-- SFX_END -->")

index = ROOT / "index.html"
html = index.read_text()
html, count = re.subn(r"      <!-- SFX_BEGIN -->.*?<!-- SFX_END -->", "\n".join(lines), html, flags=re.S)
assert count == 1, "SFX markers not found in index.html"
index.write_text(html)
print(f"{len(CUES)} SFX cues written to index.html")
