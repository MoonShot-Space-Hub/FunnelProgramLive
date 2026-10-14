"""Original background score for Avatar Video 2 — 90 BPM, A minor turning to C major, 43.32 s.

Rendered with the GeneralUser GS soundfont (license: free for commercial music
production). Every note below is composed here, so the result is an original,
copyright-free track.

Bar grid (90 BPM, 4/4): bar n starts at n * 2.6667 s.
Edit anchors: bar 4 = 10.67 s (growing up), bar 5 = 13.33 s (the old beliefs),
bar 11 = 29.33 s (the turn: "but you can start questioning"), bar 15 = 40.0 s (free training).
"""

import sys

import numpy as np
import tinysoundfont.synth as tsf
from scipy.signal import butter, fftconvolve, sosfilt

SF2, OUT = sys.argv[1], sys.argv[2]
SR = 44100
BPM = 90
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 43.32  # the exact cut length

# GM programs (0-indexed) and channels
CH = {"pad": 0, "piano": 1, "strings": 2, "bass": 3, "bells": 4, "choir": 5, "pulse": 6}
PROG = {"pad": 89, "piano": 0, "strings": 49, "bass": 33, "bells": 11, "choir": 52, "pulse": 48}
DRUMS = 9

events = []  # (time, order, kind, args)


def note(ch, key, t, dur, vel):
    events.append((t, 1, "on", (ch, key, int(max(1, min(127, vel))))))
    events.append((t + dur, 0, "off", (ch, key)))


def drum(key, t, vel):
    events.append((t, 1, "on", (DRUMS, key, int(vel))))
    events.append((t + 0.12, 0, "off", (DRUMS, key)))


def cc(ch, ctrl, val, t):
    events.append((t, 0, "cc", (ch, ctrl, int(val))))


def bar_t(b, beat=0.0):
    return b * BAR + beat * BEAT


# Chord table: (bass root, pad voicing, arpeggio pattern)
CHORDS = {
    "Am": (45, [57, 60, 64, 67], [57, 64, 69, 72, 76, 72, 69, 64]),
    "F": (41, [53, 57, 60, 64], [53, 60, 65, 69, 72, 69, 65, 60]),
    "C": (48, [55, 60, 64, 67], [48, 55, 60, 64, 67, 64, 60, 55]),
    "G": (43, [55, 59, 62, 67], [55, 62, 67, 71, 74, 71, 67, 62]),
    "Dm": (38, [53, 57, 62, 65], [50, 57, 62, 65, 69, 65, 62, 57]),
    "E": (40, [52, 56, 59, 64], [52, 59, 64, 68, 71, 68, 64, 59]),
    "Em": (40, [52, 55, 59, 64], [52, 59, 64, 67, 71, 67, 64, 59]),
}

# Section plan, one chord per bar (bars 0..16)
PLAN = [
    "C",                                    # 0  hook: no shortage of money (bright)
    "Am", "F", "G",                         # 1-3  A: what holds us back / not your fault
    "Am", "Dm", "E",                        # 4-6  B: growing up / the old beliefs (heavy)
    "Am", "F", "Dm", "E",                   # 7-10 C: heard often / shaping decisions / circumstances
    "C", "G", "Am", "F",                    # 11-14 D: the turn -> new habits -> begin today (lift)
    "G", "C",                               # 15-16 E: free training -> click the link
]

# ---------------------------------------------------------------- pads
cc(CH["pad"], 7, 92, 0)
for b, name in enumerate(PLAN):
    _, voicing, _ = CHORDS[name]
    vel = 56 if b == 0 else (54 if b < 4 else 60)
    if b >= 11:
        vel = 68
    for k in voicing:
        note(CH["pad"], k, bar_t(b), BAR + 0.15, vel)

# ---------------------------------------------------------------- piano arpeggios (8ths)
for b, name in enumerate(PLAN):
    if b in (0, 5, 16):  # hook is bells, the beliefs bar breathes, the end holds
        continue
    _, _, arp = CHORDS[name]
    base = 50 if b < 4 else 46
    if 7 <= b <= 10:
        base = 54
    if b >= 11:
        base = 62
    for i, k in enumerate(arp):
        accent = 10 if i % 4 == 0 else 0
        note(CH["piano"], k + 12 if b >= 11 and i % 2 else k, bar_t(b, i * 0.5), 0.9, base + accent)

# hook: a bright bell arpeggio over the C chord, a sparkle on "money"
for i, k in enumerate([72, 76, 79, 84, 88, 84, 91, 88]):
    note(CH["bells"], k, bar_t(0, i * 0.5), 1.1, 62 - i * 2)
note(CH["piano"], 84, bar_t(0, 0.0), 2.4, 50)
note(CH["piano"], 79, bar_t(0, 2.0), 2.0, 44)

# ---------------------------------------------------------------- bass
for b, name in enumerate(PLAN):
    if b < 2:
        continue
    root, _, _ = CHORDS[name]
    if b in (5, 6):  # long held roots under the old beliefs
        note(CH["bass"], root, bar_t(b), BAR, 74)
        continue
    if b == 16:
        note(CH["bass"], root, bar_t(b), 2.0, 86)
        continue
    pattern = [(0, 1.4), (1.5, 0.45), (2, 1.4), (3.5, 0.45)] if b < 11 else [
        (0, 0.45), (0.5, 0.45), (1, 0.45), (1.5, 0.45), (2, 0.45), (2.5, 0.45), (3, 0.45), (3.5, 0.45)]
    for beat, d in pattern:
        note(CH["bass"], root, bar_t(b, beat), d * BEAT, 78 if beat == 0 else 66)

# ---------------------------------------------------------------- strings
for b, name in enumerate(PLAN):
    if b < 4:
        continue
    _, voicing, _ = CHORDS[name]
    vel = 60 if b < 7 else (62 if b < 11 else 76)
    low = b in (5, 6)  # dark, low strings for the beliefs
    for k in voicing[1:]:
        note(CH["strings"], k if low else k + 12, bar_t(b), BAR + 0.1, vel)

# staccato string pulse: "shaping your decisions without you even realizing it" (bars 8-10)
for b in range(8, 11):
    _, voicing, _ = CHORDS[PLAN[b]]
    for i in range(8):
        for k in voicing[:2]:
            note(CH["pulse"], k, bar_t(b, i * 0.5), 0.18, 68 if i % 2 == 0 else 54)

# ---------------------------------------------------------------- melody (the lift, bars 11-16)
MELODY = [  # (bar, beat, key, beats)
    (11, 0, 76, 1), (11, 1, 74, 0.5), (11, 1.5, 72, 0.5), (11, 2, 67, 2),
    (12, 0, 71, 1), (12, 1, 74, 1), (12, 2, 79, 1.5), (12, 3.5, 76, 0.5),
    (13, 0, 76, 1), (13, 1, 72, 1), (13, 2, 69, 1), (13, 3, 72, 1),
    (14, 0, 72, 1), (14, 1, 69, 1), (14, 2, 65, 1), (14, 3, 67, 1),
    (15, 0, 74, 2), (15, 2, 71, 1), (15, 3, 74, 1),
    (16, 0, 72, 2),
]
for b, beat, k, beats in MELODY:
    note(CH["bells"], k, bar_t(b, beat), beats * BEAT, 72)
    note(CH["piano"], k + 12, bar_t(b, beat), beats * BEAT, 58)

# choir: a low hum under the beliefs, a swell into the turn and the CTA
for k in [50, 57, 62]:
    note(CH["choir"], k, bar_t(5), 2 * BAR, 50)
for k in [52, 59, 64]:
    note(CH["choir"], k, bar_t(10, 2), 2 * BEAT + 0.1, 58)
for k in [60, 64, 67, 72]:
    note(CH["choir"], k, bar_t(15, 0), BAR + 1.0, 62)

# ---------------------------------------------------------------- drums
KICK, SNARE, STICK, CLAP, HAT, OHAT, CRASH, SHAKER, TOM = 36, 38, 37, 39, 42, 46, 49, 70, 45
drum(CRASH, bar_t(0, 0), 60)
for b in range(1, 17):
    if b == 4:  # memories: just a soft pulse
        drum(KICK, bar_t(b, 0), 62)
        drum(KICK, bar_t(b, 2), 56)
        continue
    if b in (5, 6):  # heartbeat under the old beliefs
        for beat in (0, 2):
            drum(KICK, bar_t(b, beat), 92)
            drum(KICK, bar_t(b, beat + 0.5), 70)
        continue
    if b < 4:  # gentle groove
        drum(KICK, bar_t(b, 0), 72)
        drum(KICK, bar_t(b, 2.5), 58)
        drum(STICK, bar_t(b, 1), 50)
        drum(STICK, bar_t(b, 3), 50)
        for i in range(8):
            drum(SHAKER, bar_t(b, i * 0.5), 46 if i % 2 else 56)
    elif b < 11:  # tense, half-time
        drum(KICK, bar_t(b, 0), 84)
        drum(KICK, bar_t(b, 0.75), 60)
        drum(CLAP, bar_t(b, 2), 66)
        for i in range(8):
            drum(HAT, bar_t(b, i * 0.5), 46 if i % 2 else 56)
    elif b < 16:  # lift: full groove
        drum(KICK, bar_t(b, 0), 96)
        drum(KICK, bar_t(b, 1.5), 76)
        drum(KICK, bar_t(b, 2.5), 84)
        drum(SNARE, bar_t(b, 1), 80)
        drum(SNARE, bar_t(b, 3), 84)
        for i in range(8):
            drum(HAT, bar_t(b, i * 0.5), 56 if i % 2 else 68)
        drum(OHAT, bar_t(b, 3.5), 58)
    else:  # 16: final hit
        drum(KICK, bar_t(b, 0), 104)
        drum(CRASH, bar_t(b, 0), 90)

# build-up fill into the turn (bar 11) and the CTA (bar 15)
for i in range(8):
    drum(TOM, bar_t(10, 2 + i * 0.25), 50 + i * 6)
for i in range(4):
    drum(SNARE, bar_t(14, 3 + i * 0.25), 56 + i * 8)
drum(CRASH, bar_t(11, 0), 88)
drum(CRASH, bar_t(15, 0), 80)
drum(CRASH, bar_t(5, 0), 62)

# ---------------------------------------------------------------- render
synth = tsf.Synth(gain=-6, samplerate=SR)
sfid = synth.sfload(SF2)
for name, ch in CH.items():
    synth.program_select(ch, sfid, 0, PROG[name])
synth.program_select(DRUMS, sfid, 128, 0, is_drums=True)
for ch in list(CH.values()) + [DRUMS]:
    synth.control_change(ch, 7, 100)

SOLO = sys.argv[3] if len(sys.argv) > 3 else None
if SOLO is not None:
    keep = DRUMS if SOLO == "drums" else CH[SOLO]
    events = [e for e in events if e[3][0] == keep]
events.sort(key=lambda e: (e[0], e[1]))
total_samples = int(TOTAL * SR)
out = np.zeros((total_samples, 2), dtype=np.float32)
cursor = 0
for t, _, kind, args in events + [(TOTAL, 9, "end", ())]:
    target = min(total_samples, int(round(t * SR)))
    if target > cursor:
        buf = synth.generate(target - cursor)
        out[cursor:target] = np.frombuffer(buf, dtype=np.float32).reshape(-1, 2)
        cursor = target
    if kind == "on":
        synth.noteon(*args)
    elif kind == "off":
        synth.noteoff(*args)
    elif kind == "cc":
        synth.control_change(*args)

# ---------------------------------------------------------------- reverb + tone
rng = np.random.default_rng(7)  # seeded: the impulse response is reproducible
ir_len = int(2.4 * SR)
decay = np.exp(-np.linspace(0, 7.5, ir_len))
ir = rng.standard_normal((ir_len, 2)) * decay[:, None]
ir[: int(0.02 * SR)] = 0  # 20 ms pre-delay
sos_ir = butter(2, 6500, "low", fs=SR, output="sos")
ir = sosfilt(sos_ir, ir, axis=0)
ir /= np.sqrt((ir ** 2).sum(axis=0, keepdims=True))
wet = np.stack([fftconvolve(out[:, c], ir[:, c])[:total_samples] for c in range(2)], axis=1)
mix = out * 0.78 + wet * 0.34

# gentle high-pass to keep the low end out of the voice's way, soft-knee limiter
sos_hp = butter(2, 38, "high", fs=SR, output="sos")
mix = sosfilt(sos_hp, mix, axis=0)
peak = np.max(np.abs(mix)) or 1.0
mix = mix / peak * 0.98
mix = np.tanh(mix * 1.6) / np.tanh(1.6)

# fade in the first 0.4 s, fade out the last 1.1 s
fi = int(0.4 * SR)
fo = int(1.1 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
import wave

with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}: {TOTAL:.2f}s, {len(events)} events")
