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
    # intro blink into b1
    (2.02, "whoosh-short", 0.22, "blink"),
    # b1 three years (2.10–6.50)
    (3.78, "click-soft", 0.3, "b1 year tick"),
    (4.00, "click-soft", 0.3, "b1 year tick"),
    (4.22, "click-soft", 0.3, "b1 year tick"),
    (4.44, "click-soft", 0.3, "b1 year tick"),
    (5.10, "whoosh", 0.24, "b1 phone rises"),
    (5.86, "pop", 0.34, "b1 question badge"),
    (6.36, "whoosh-short", 0.22, "b1 out"),
    # b2 balance unknown (15.10–18.90)
    (15.20, "whoosh", 0.24, "b2 in"),
    (16.40, "chime", 0.4, "b2 fingerprint unlock"),
    (18.24, "sparkle", 0.11, "b2 question marks land"),
    (18.76, "whoosh-short", 0.22, "b2 out"),
    # b3 chart crash (20.95–22.85)
    (20.90, "whoosh", 0.24, "b3 blocks"),
    (22.00, "impact-bass-1", 0.11, "b3 crash"),
    (22.00, "glitch-2", 0.06, "b3 crash glitch", 0.9, 0.8),
    (22.71, "whoosh-short", 0.22, "b3 out"),
    # b4 two voices (25.55–29.40)
    (25.65, "whoosh", 0.24, "b4 in"),
    (26.72, "pop", 0.34, "b4 VS"),
    (27.30, "impact-bass-1", 0.1, "b4 harsh card slams"),
    (29.26, "whoosh-short", 0.22, "b4 out"),
    # b5 same date (32.40–38.15)
    (32.50, "whoosh", 0.24, "b5 in"),
    (34.16, "whoosh-short", 0.22, "b5 page tears"),
    (34.80, "impact-bass-1", 0.1, "b5 SAME VOICE"),
    (35.76, "impact-bass-1", 0.1, "b5 SAME HABITS"),
    (37.04, "impact-bass-1", 0.1, "b5 +3 YEARS"),
    (38.01, "whoosh-short", 0.22, "b5 out"),
    # b6 number vs voice (40.00–45.05)
    (39.95, "whoosh", 0.24, "b6 blocks"),
    (41.52, "pop", 0.34, "b6 THE NUMBER"),
    (42.62, "sparkle", 0.11, "b6 counter lands"),
    (43.84, "pop", 0.34, "b6 THE VOICE"),
    (44.91, "whoosh-short", 0.22, "b6 out"),
    # b7 two futures (46.40–50.00)
    (46.50, "whoosh", 0.24, "b7 in"),
    (48.00, "impact-bass-2", 0.1, "b7 DON'T WAIT stamp"),
    (48.85, "whoosh-short", 0.22, "b7 dot takes the amber path"),
    (49.86, "whoosh-short", 0.22, "b7 out"),
    # CTA (50.00–51.76)
    (50.08, "impact-bass-1", 0.12, "CTA JOIN US"),
    (50.72, "pop", 0.34, "CTA button"),
    (51.02, "sparkle", 0.11, "CTA sheen"),
]

END = 51.76
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
