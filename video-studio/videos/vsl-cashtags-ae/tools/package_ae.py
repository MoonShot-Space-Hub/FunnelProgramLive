"""Assemble the After Effects delivery folder (and zip) from spec.json + ae/.

usage: python3 -I tools/package_ae.py [--no-footage]
  -> renders/CASHTAGS_VSL_AE/ and renders/CASHTAGS_VSL_AE.zip
"""
import json, os, shutil, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "renders", "CASHTAGS_VSL_AE")
spec = json.load(open(os.path.join(ROOT, "spec.json")))
comps = {c["id"]: c for c in spec["comps"]}


def ts(t, sep=","):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def srt():
    caps = [L for L in comps["captions"]["layers"] if L["type"] == "text"]
    lines = []
    for i, L in enumerate(caps, 1):
        lines += [str(i), f"{ts(L['in'])} --> {ts(L['out'])}", L["text"], ""]
    return "\n".join(lines)


def cue_sheet():
    out = ["#CASHTAGS VSL - cue sheet (main comp time, 30 fps)", "",
           "Each moment is a precomp in '02 Moments' and a comp marker on CASHTAGS_VSL_Main.", ""]
    for t, txt in spec["markers"]:
        name, _, line = txt.partition(" | ")
        out.append(f"{ts(t, '.')[3:]}  {name}")
        out.append(f"           \"{line}\"")
    out += ["", "Camera (A-Roll layer on the main comp): slow push-ins, jump-cut punch-ins on",
            "'called #CASHTAGS', 'so many people', 'completely free', and at both take cuts;",
            "split screen 20.9-26.1 s ('go from random guessing work to become a systematic trader').",
            "", "Captions: 'Captions (English)' precomp, word-by-word highlight (text animator)."]
    return "\n".join(out)


README = """#CASHTAGS VSL - After Effects project
=====================================

What is in this folder
----------------------
CASHTAGS_VSL_Build.jsx   Builds the whole After Effects project and saves CASHTAGS_VSL.aep here.
Footage/VSL.mp4          Your original footage, unchanged.
Images/book-3d.png       Your 3D #CASHTAGS cover.
Audio/                   Original music bed composed for this edit, plus three soft UI sound
                         effects (Pixabay licence, see SFX-CREDITS.md).
Fonts/                   Inter (SIL Open Font Licence). Install these first.
spec.json                The edit data the script reads (same data that rendered the preview MP4).
CUE_SHEET.txt            Every moment, its time and the words it illustrates.
transcript.srt           English captions / transcript with timings.

How to build the project (once)
-------------------------------
1. Install the six Inter fonts in Fonts/ (double-click each one, then Install).
   Restart After Effects if it was open.
2. In After Effects, open Preferences > Scripting & Expressions and tick
   "Allow Scripts to Write Files and Access Network". In versions before 2021 this
   option is under Preferences > General.
3. File > Scripts > Run Script File... and choose CASHTAGS_VSL_Build.jsx.
   If After Effects asks whether to save your current project, answer as you like.
4. The script imports the assets, builds every composition, layer and keyframe, adds the
   main comp to the Render Queue, saves CASHTAGS_VSL.aep in this folder and shows a summary.
   Any warning is listed in build_log.txt.
5. Open "CASHTAGS_VSL_Main" (folder 01 Main) and press Render in the Render Queue.
   If your version has no H.264 output, pick a format in Output Module, or use
   File > Export > Add to Adobe Media Encoder Queue.

Project structure
-----------------
01 Main     CASHTAGS_VSL_Main - 1920x1080, 30 fps, {dur:.2f} s. Comp markers label every moment.
            A-Roll (edited)   - your three kept takes, back to back.
02 Moments  M01-M14, one precomp per editing moment, plus Captions (English).
03 Cards    C01-C14, the UI cards. Every text layer is live text and every shape is a shape layer.
04 Footage, 05 Images, 06 Audio (Music + SFX precomp).

To edit, open a card (03 Cards) and change its text, colours or keyframes. The moment
precomps and the main comp update automatically.
Palette: Meta Blue #0866FF, navy #0A1F44, slate #56657D, soft grey #F3F5F8, white.
Typeface: Inter (Medium / SemiBold / Bold / ExtraBold / Black).

About the length
----------------
The footage you supplied is 76.8 s long. It contains two restarted sentences:
  - 30.97-34.48 s  "So you can read this book and get started with your trading journey. You can..."
  - 44.35-55.30 s  "...You must have dabbled into trading. You must have attended a podcast or a webinar,
                   but this free is for a limited time. I know you..."
Both are removed, which gives {dur:.2f} s. Every remaining word plays at its original speed and in
its original order. To restore a section, open "A-Roll (edited)" and extend the take layers.
"""


def main():
    no_footage = "--no-footage" in sys.argv
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    subprocess.check_call([sys.executable, "-I", os.path.join(ROOT, "tools", "assemble_jsx.py"),
                           os.path.join(ROOT, "spec.json"), os.path.join(OUT, "CASHTAGS_VSL_Build.jsx")])
    for sub in ["Images", "Audio", "Fonts"] + ([] if no_footage else ["Footage"]):
        shutil.copytree(os.path.join(ROOT, "ae", sub), os.path.join(OUT, sub))
    shutil.copy(os.path.join(ROOT, "spec.json"), OUT)
    open(os.path.join(OUT, "README.txt"), "w").write(README.format(dur=comps["main"]["duration"]))
    open(os.path.join(OUT, "CUE_SHEET.txt"), "w").write(cue_sheet())
    open(os.path.join(OUT, "transcript.srt"), "w").write(srt())
    zp = OUT + (".zip" if not no_footage else "_no-footage.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        for dp, _, fs in os.walk(OUT):
            for f in sorted(fs):
                full = os.path.join(dp, f)
                z.write(full, os.path.relpath(full, os.path.dirname(OUT)))
    print("package:", OUT, "| zip:", zp, round(os.path.getsize(zp) / 1e6, 1), "MB")


if __name__ == "__main__":
    main()
