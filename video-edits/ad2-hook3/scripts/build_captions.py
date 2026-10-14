"""Build word-timed English caption pages (src/data/captions.json).

The speaker talks in Hindi/Hinglish; captions are an English translation, so each
page is pinned to the time span of the phrase it translates and words inside the
page are spread across the voiced frames of that span.
"""
import json, sys, numpy as np, soundfile as sf

WAV, OUT = sys.argv[1], sys.argv[2]

# (start, end, [lines]); line = (kind, "words"); word style suffix: *k keyword, *a accent, *r red, *g green
# kind: "lead" = smaller set-up line, "punch" = big line. mode "graphic" = shown by a motion graphic instead.
PAGES = [
    (0.05, 2.40, [("lead", "CAN WE COMPARE"), ("punch", "TRADING*k WITH GARBA?*a")]),
    (2.50, 3.85, [("lead", "IF YOU'VE EVER PLAYED"), ("punch", "GARBA*a IN NAVRATRI*k")]),
    (3.85, 4.64, [("lead", "YOU MUST HAVE"), ("punch", "NOTICED...")]),
    (4.64, 6.40, [("lead", "DIFFERENT SONGS,"), ("punch", "DIFFERENT STEPS*k")]),
    (6.40, 7.64, [("lead", "START"), ("punch", "INSTANTLY*a")]),
    (7.64, 8.60, [("lead", "BECAUSE"), ("punch", "EVERY SONG")]),
    (8.60, 9.70, [("lead", "HAS ITS OWN"), ("punch", "RHYTHM*a")]),
    (9.70, 10.60, [("lead", "IN THE SAME WAY,")]),
    (10.60, 12.10, [("lead", "IN OUR MARKET"), ("punch", "TRENDS*k CHANGE*k TOO")]),
    (12.10, 13.45, [("punch", "UPTREND*g ➜ DOWNTREND*r")]),
    (13.45, 14.20, [("punch", "DOWNTREND*r ➜ SIDEWAYS*k")]),
    (14.20, 15.50, [("lead", "AND IF YOUR"), ("punch", "STRATEGY,*k")]),
    (15.50, 16.40, [("lead", "YOUR"), ("punch", "STEPS*k")]),
    (16.40, 17.56, [("punch", "DON'T CHANGE...")]),
    (17.56, 18.34, [("lead", "YOU'LL"), ("punch", "STRUGGLE,*a")]),
    (18.34, 19.30, [("lead", "YOU'LL FACE"), ("punch", "LOSSES!*r")]),
    (19.40, 20.90, [("lead", "THAT'S WHY A"), ("punch", "SYSTEMATIC*k APPROACH*k")]),
    (20.90, 21.98, [("lead", "IS SO"), ("punch", "IMPORTANT*a")]),
    (21.98, 22.90, [("lead", "SO IF YOU"), ("punch", "WANT TO")]),
    (22.90, 24.42, [("lead", "LEARN THIS"), ("punch", "SYSTEMATIC*k APPROACH*k")]),
    (24.42, 27.04, "graphic"),
    (27.04, 28.00, [("lead", "THEN, WHAT IS AN"), ("punch", "UPTREND?*g")]),
    (28.00, 28.90, [("lead", "A"), ("punch", "DOWNTREND?*r")]),
    (28.90, 29.82, [("lead", "A"), ("punch", "SIDEWAYS*k TREND?")]),
    (29.82, 30.60, [("lead", "IDENTIFYING"), ("punch", "THIS")]),
    (30.60, 31.52, [("lead", "IS"), ("punch", "CRUCIAL*a")]),
    (31.52, 32.50, [("lead", "AND ACCORDINGLY,")]),
    (32.50, 33.94, [("lead", "WE IMPLEMENT"), ("punch", "OUR SYSTEM*k")]),
    (33.94, 35.28, [("lead", "I'M TEACHING"), ("punch", "ALL OF THIS")]),
    (35.28, 36.44, [("lead", "IN A"), ("punch", "FREE*k MASTERCLASS*a")]),
    (36.44, 37.50, [("lead", "IN THIS ONE"), ("punch", "MASTERCLASS")]),
    (37.50, 38.52, [("lead", "YOU'LL LEARN"), ("punch", "EVERYTHING*k")]),
    (38.52, 39.90, [("lead", "PLUS YOUR"), ("punch", "RISK*k MANAGEMENT")]),
    (39.90, 41.36, [("lead", "AND YOUR"), ("punch", "MIND*a MANAGEMENT")]),
    (41.36, 42.10, [("lead", "HOW TO"), ("punch", "HANDLE IT")]),
    (42.10, 42.92, [("lead", "YOU'LL LEARN"), ("punch", "THAT TOO")]),
    (42.92, 43.88, [("lead", "AND IT'S"), ("punch", "ABSOLUTELY")]),
    (43.88, 44.30, "graphic"),
    (44.30, 45.10, [("lead", "SO CLICK"), ("punch", "ON THE LINK")]),
    (45.10, 45.65, [("lead", "AND CHECK OUT THIS")]),
    (45.65, 46.85, [("punch", "1-HOUR*k MASTERCLASS*a")]),
    (46.85, 47.52, [("lead", "WHERE YOU LEARN")]),
    (47.52, 48.50, [("lead", "THE"), ("punch", "STEP-BY-STEP*k PROCESS")]),
    (48.50, 50.41, [("lead", "TO BECOME A"), ("punch", "SYSTEMATIC*k TRADER*k")]),
    (50.41, 51.28, [("lead", "SO CLICK"), ("punch", "THE LINK")]),
    (51.28, 52.37, [("lead", "& BOOK YOUR SEAT"), ("punch", "RIGHT NOW!*k")]),
]

x, sr = sf.read(WAV, dtype="float32")
hop = sr // 100
n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
floor = np.percentile(db, 10)
voiced = db > max(floor + 14, db.max() - 38)

def word_times(ps, pe, words):
    a, b = int(ps * 100), max(int(ps * 100) + 1, int(pe * 100))
    v = voiced[a:b].astype(float) + 0.08  # small weight for unvoiced so words still spread
    cum = np.concatenate([[0], np.cumsum(v)]); cum /= cum[-1]
    w = np.array([len(t) + 2 for t in words], float); starts = np.concatenate([[0], np.cumsum(w)[:-1]]) / w.sum()
    # the first word lands at the first voiced frame of the page
    return [round(ps + float(np.searchsorted(cum, s * 0.92)) / 100, 3) for s in starts]

pages = []
for ps, pe, lines in PAGES:
    if lines == "graphic":
        pages.append({"start": ps, "end": pe, "mode": "graphic", "lines": []}); continue
    flat = [(li, tok) for li, (_, txt) in enumerate(lines) for tok in txt.split()]
    ats = word_times(ps, pe, [t.split("*")[0] for _, t in flat])
    out_lines = [{"kind": k, "words": []} for k, _ in lines]
    for (li, tok), at in zip(flat, ats):
        text, _, style = tok.partition("*")
        out_lines[li]["words"].append({"text": text, "style": style or "n", "at": at})
    pages.append({"start": ps, "end": pe, "mode": "caption", "lines": out_lines})

json.dump(pages, open(OUT, "w"), indent=1)
print(f"{len(pages)} pages written to {OUT}")
