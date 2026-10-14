"""Original garba-style background score for Ad 2 — 6/8 at 96 BPM (dotted quarter), D Mixolydian.

Rendered with the GeneralUser GS soundfont (free for commercial music production). Every note is
composed here, so the track is original and copyright-free.

Usage: python compose_garba.py GeneralUser-GS.sf2 out.wav [total_seconds]

Grid: an eighth note = 0.2083 s, a bar (6 eighths) = 1.25 s.
Sections: intro alaap 0–2.5 s, groove from 2.5 s, lift at 20 s, full at 36.25 s, CTA peak at 43.75 s.
"""

import sys
import wave

import numpy as np
import tinysoundfont.synth as tsf
from scipy.signal import butter, fftconvolve, sosfilt

SF2, OUT = sys.argv[1], sys.argv[2]
TOTAL = float(sys.argv[3]) if len(sys.argv) > 3 else 52.37
SR = 44100
E = 60 / 96 / 3  # eighth note
BAR = 6 * E
NBARS = int(TOTAL / BAR) + 1

CH = {"drone": 0, "shenai": 1, "flute": 2, "strings": 3, "bass": 4, "pad": 5, "taiko": 6}
PROG = {"drone": 104, "shenai": 111, "flute": 73, "strings": 48, "bass": 33, "pad": 89, "taiko": 116}
DRUMS = 9
events = []


def note(ch, key, t, dur, vel):
    if t >= TOTAL:
        return
    events.append((t, 1, "on", (ch, key, int(max(1, min(127, vel))))))
    events.append((min(t + dur, TOTAL), 0, "off", (ch, key)))


def hit(key, t, vel):
    if t < TOTAL:
        events.append((t, 1, "on", (DRUMS, key, int(vel))))
        events.append((t + 0.1, 0, "off", (DRUMS, key)))


def at(bar, eighth=0.0):
    return bar * BAR + eighth * E


# I–I–IV–V / I–bVII–IV–V, two bars per chord
CHORDS = {"D": (38, [50, 54, 57, 62]), "G": (43, [55, 59, 62, 67]), "A": (45, [57, 61, 64, 69]), "C": (36, [48, 52, 55, 60])}
CYCLE = ["D", "D", "G", "A", "D", "C", "G", "A"]


def chord_at(bar):
    return CYCLE[(bar // 2) % len(CYCLE)]


GROOVE_FROM = 2          # bar 2 = 2.5 s
LIFT_FROM = 16           # 20.0 s
FULL_FROM = 29           # 36.25 s
CTA_FROM = 35            # 43.75 s

# drone: sitar tonic + fifth re-struck every 2 bars, the whole piece
for b in range(0, NBARS, 2):
    for k in (50, 57):
        note(CH["drone"], k, at(b), 2 * BAR + 0.2, 46)

# intro alaap on shenai (0–2.5 s)
for t, k, d in [(0.15, 69, 0.7), (0.85, 71, 0.35), (1.2, 74, 0.9), (2.0, 71, 0.4)]:
    note(CH["shenai"], k, t, d, 70)
note(CH["taiko"], 38, at(1, 3), 1.0, 70)

# pad + strings chords
for b in range(GROOVE_FROM, NBARS):
    root, voicing = CHORDS[chord_at(b)]
    if b % 2 == 0:
        for k in voicing:
            note(CH["pad"], k, at(b), 2 * BAR + 0.1, 50 if b < FULL_FROM else 60)
    if b >= LIFT_FROM:  # strings stab on the two pulses of each bar
        for k in voicing[1:]:
            for e8 in (0, 3):
                note(CH["strings"], k + 12, at(b, e8), 2.2 * E, 58 if b < CTA_FROM else 70)

# bass: root on the two pulses, a pickup on the last eighth
for b in range(GROOVE_FROM, NBARS):
    root, _ = CHORDS[chord_at(b)]
    note(CH["bass"], root, at(b, 0), 2.6 * E, 84)
    note(CH["bass"], root, at(b, 3), 2.6 * E, 76)
    if b >= LIFT_FROM:
        note(CH["bass"], root + 7, at(b, 5), 0.9 * E, 64)

# dhol + dandiya pattern (6/8): bass strokes on 0 and 3, treble on 2 and 5, open slap on 4
KICK, LTOM, HCONGA, OCONGA, CLAVES, TAMB, SHAKER, CRASH, HBONGO = 36, 43, 62, 63, 75, 54, 70, 49, 60
for b in range(GROOVE_FROM, NBARS):
    full = b >= FULL_FROM
    hit(KICK, at(b, 0), 92)
    hit(LTOM, at(b, 0), 80)
    hit(KICK, at(b, 3), 84)
    hit(LTOM, at(b, 3), 74)
    hit(HCONGA, at(b, 2), 70)
    hit(HCONGA, at(b, 5), 72)
    hit(OCONGA, at(b, 4), 66)
    if b >= LIFT_FROM:
        hit(HBONGO, at(b, 1), 52)
    # dandiya sticks clack on the pulses
    for e8 in (0, 3) if b < LIFT_FROM else (0, 2, 3, 5):
        hit(CLAVES, at(b, e8), 70 if full else 60)
    for e8 in range(6):
        hit(SHAKER if b < LIFT_FROM else TAMB, at(b, e8), 40 + (8 if e8 in (0, 3) else 0))
for b in (GROOVE_FROM, LIFT_FROM, FULL_FROM, CTA_FROM):
    hit(CRASH, at(b), 84)
# fill into the CTA
for i in range(6):
    hit(LTOM, at(CTA_FROM - 1, i), 60 + i * 8)
    hit(HCONGA, at(CTA_FROM - 1, i + 0.5), 56 + i * 6)

# melody: shenai answering phrases (D major pentatonic), flute doubles from the lift
PHRASE_A = [(0, 69, 1), (1, 71, 1), (2, 74, 2), (4, 76, 1), (5, 74, 1),
            (6, 71, 1), (7, 69, 1), (8, 66, 2), (10, 64, 1), (11, 62, 1)]
PHRASE_B = [(0, 74, 1), (1, 76, 1), (2, 78, 2), (4, 76, 1), (5, 74, 1),
            (6, 76, 2), (8, 74, 1), (9, 71, 1), (10, 69, 2)]
for start_bar in range(4, NBARS - 1, 4):
    phrase = PHRASE_A if (start_bar // 4) % 2 else PHRASE_B
    loud = start_bar >= FULL_FROM
    for e8, k, d in phrase:
        t = at(start_bar, e8)
        note(CH["shenai"], k, t, d * E * 0.95, 78 if loud else 68)
        if start_bar >= LIFT_FROM:
            note(CH["flute"], k + 12, t, d * E * 0.95, 60 if loud else 52)

# ending: final hit on the tonic just before the cut
end_bar = int((TOTAL - 0.6) / BAR)
for k in (50, 57, 62, 66, 69, 74):
    note(CH["strings"], k, at(end_bar, 0), 1.2, 80)
hit(CRASH, at(end_bar), 92)
hit(KICK, at(end_bar), 110)

# ---------------------------------------------------------------- render
synth = tsf.Synth(gain=-6, samplerate=SR)
sfid = synth.sfload(SF2)
for name, ch in CH.items():
    synth.program_select(ch, sfid, 0, PROG[name])
synth.program_select(DRUMS, sfid, 128, 0, is_drums=True)
for ch in list(CH.values()) + [DRUMS]:
    synth.control_change(ch, 7, 100)

events.sort(key=lambda e: (e[0], e[1]))
n = int(TOTAL * SR)
out = np.zeros((n, 2), dtype=np.float32)
cursor = 0
for t, _, kind, args in events + [(TOTAL, 9, "end", ())]:
    target = min(n, int(round(t * SR)))
    if target > cursor:
        out[cursor:target] = np.frombuffer(synth.generate(target - cursor), dtype=np.float32).reshape(-1, 2)
        cursor = target
    if kind == "on":
        synth.noteon(*args)
    elif kind == "off":
        synth.noteoff(*args)

rng = np.random.default_rng(11)  # seeded impulse response: reproducible
ir_len = int(1.6 * SR)
ir = rng.standard_normal((ir_len, 2)) * np.exp(-np.linspace(0, 8, ir_len))[:, None]
ir[: int(0.015 * SR)] = 0
ir = sosfilt(butter(2, 7000, "low", fs=SR, output="sos"), ir, axis=0)
ir /= np.sqrt((ir ** 2).sum(axis=0, keepdims=True))
wet = np.stack([fftconvolve(out[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
mix = sosfilt(butter(2, 38, "high", fs=SR, output="sos"), out * 0.82 + wet * 0.26, axis=0)
mix = mix / (np.max(np.abs(mix)) or 1.0) * 0.98
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
fi, fo = int(0.3 * SR), int(0.9 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"wrote {OUT}: {TOTAL:.2f}s, {len(events)} events")
