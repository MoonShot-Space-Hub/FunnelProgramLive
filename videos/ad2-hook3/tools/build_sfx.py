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
    # g1 Navratri night (2.48–5.38) and songs/steps (5.38–9.58)
    (2.55, "whoosh", 0.24, "g1 in"),
    (4.56, "sparkle", 0.11, "NAVRATRI chip"),
    (5.42, "whoosh-short", 0.22, "g1b in"),
    (5.44, "click-soft", 0.3, "song tick 1"),
    (5.96, "click-soft", 0.3, "song tick 2"),
    (6.48, "click-soft", 0.3, "song tick 3"),
    (6.80, "pop", 0.34, "NEW STEPS chip"),
    (9.04, "sparkle", 0.11, "rhythm waveform"),
    # g2 trends change (9.58–14.34)
    (9.52, "whoosh", 0.24, "g2 blocks"),
    (12.16, "pop", 0.34, "UPTREND"),
    (12.80, "whoosh-short", 0.22, "DOWNTREND"),
    (13.84, "pop", 0.34, "SIDEWAYS"),
    (14.20, "whoosh-short", 0.22, "g2 out"),
    # loss (17.42–19.32), 3D chart crash
    (17.36, "whoosh", 0.24, "loss blocks"),
    (18.47, "impact-bass-1", 0.1, "crash"),
    (18.47, "glitch-2", 0.06, "crash glitch", 0.9, 0.8),
    (19.18, "whoosh-short", 0.22, "loss out"),
    # g4 step 1 (24.60–29.92)
    (24.67, "whoosh", 0.24, "g4 in"),
    (24.72, "impact-bass-1", 0.08, "STEP 1 badge"),
    (25.36, "pop", 0.3, "ENTRY"),
    (25.68, "pop", 0.3, "EXIT"),
    (26.16, "pop", 0.3, "STOP LOSS"),
    (26.72, "pop", 0.3, "TARGET"),
    (27.36, "click-soft", 0.3, "uptrend tile"),
    (28.16, "click-soft", 0.3, "downtrend tile"),
    (28.96, "click-soft", 0.3, "sideways tile"),
    (29.78, "whoosh-short", 0.22, "g4 out"),
    # g5 bundle (36.48–44.10)
    (36.55, "whoosh", 0.24, "g5 in"),
    (36.96, "pop", 0.34, "MASTERCLASS card"),
    (38.64, "pop", 0.3, "plus"),
    (39.20, "whoosh-short", 0.2, "RISK MANAGEMENT card"),
    (40.32, "whoosh-short", 0.2, "MIND MANAGEMENT card"),
    (43.36, "impact-bass-2", 0.09, "FREE stamp"),
    (43.36, "sparkle", 0.11, "FREE petals"),
    (43.96, "whoosh-short", 0.22, "g5 out"),
    # CTA overlay (44.36–52.36)
    (45.84, "pop", 0.34, "1-HOUR MASTERCLASS chip"),
    (49.28, "click-soft", 0.3, "SYSTEMATIC TRADER badge"),
    (50.64, "pop", 0.34, "BOOK YOUR SEAT button"),
    (51.36, "click-soft", 0.34, "button tap"),
    (52.12, "sparkle", 0.1, "final sparkle"),
]

END = 52.36
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
