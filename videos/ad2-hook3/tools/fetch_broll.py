"""Search and download free stock video B-roll from Pexels.

Needs the PEXELS_API_KEY environment variable (a free key from pexels.com/api) and network
access to api.pexels.com, videos.pexels.com and images.pexels.com.

Run from the project root:

  python3 tools/fetch_broll.py search "man checking banking app" [--count 8] [--min-seconds 4]
  python3 tools/fetch_broll.py thumb <video-id>            # save the preview image to look at
  python3 tools/fetch_broll.py get <video-id> --name phone-banking [--start 1.5 --seconds 5]

`get` downloads the best-matching file, crops and scales it to fill 1080x1920 at 25 fps
(muted: B-roll never carries sound), writes assets/broll/<name>-<id>.mp4, and records where
it came from in assets/broll/ledger.json. Pexels videos are free for commercial use with no
attribution required (https://www.pexels.com/license/); the ledger keeps the provenance anyway.
"""

import argparse
import datetime
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BROLL = ROOT / "assets/broll"
LEDGER = BROLL / "ledger.json"
API = "https://api.pexels.com/videos"
TARGET_W, TARGET_H, FPS = 1080, 1920, 25


def api_get(path, params=None):
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        sys.exit(
            "PEXELS_API_KEY is not set. Add a free Pexels API key to this environment's "
            "settings (Network secrets / environment variables) and start a new session."
        )
    url = f"{API}/{path}" + (f"?{urllib.parse.urlencode(params)}" if params else "")
    req = urllib.request.Request(url, headers={"Authorization": key, "User-Agent": "hyperframes-broll/1"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "hyperframes-broll/1"})
    with urllib.request.urlopen(req, timeout=120) as res, open(dest, "wb") as out:
        while chunk := res.read(1 << 16):
            out.write(chunk)


def pick_file(video):
    """The rendition that best fills 1080x1920 after a 9:16 crop, at <= 30 fps.

    Judged by the height left after cropping to 9:16: the smallest file that still covers 1920
    wins; when none does, the largest one (least upscaling)."""
    files = [f for f in video.get("video_files", []) if f.get("file_type") == "video/mp4" and f.get("width")]
    if not files:
        return None

    def score(f):
        cropped_h = min(f["height"], f["width"] * TARGET_H / TARGET_W)
        fps = f.get("fps") or 25
        covers = cropped_h >= TARGET_H
        return (
            0 if fps <= 30.5 else 1,
            0 if covers else 1,
            cropped_h if covers else -cropped_h,
        )

    return sorted(files, key=score)[0]


def cmd_search(args):
    params = {"query": args.query, "per_page": max(args.count * 2, 15)}
    if args.orientation != "any":
        params["orientation"] = args.orientation
    data = api_get("search", params)
    shown = 0
    for v in data.get("videos", []):
        if v.get("duration", 0) < args.min_seconds:
            continue
        f = pick_file(v)
        if not f:
            continue
        print(
            f"{v['id']:>10}  {v['duration']:>3}s  {v['width']}x{v['height']}  best {f['width']}x{f['height']}"
            f"@{f.get('fps') or '?'}  by {v['user']['name']}  {v['url']}"
        )
        shown += 1
        if shown >= args.count:
            break
    if not shown:
        print("no matches; try other words or --orientation any")


def cmd_thumb(args):
    v = api_get(f"videos/{args.id}")
    dest = Path(tempfile.gettempdir()) / f"pexels-{args.id}.jpg"
    download(v["image"], dest)
    print(dest)


def cmd_get(args):
    v = api_get(f"videos/{args.id}")
    f = pick_file(v)
    if not f:
        sys.exit(f"video {args.id} has no mp4 rendition")
    BROLL.mkdir(parents=True, exist_ok=True)
    out = BROLL / f"{args.name}-{args.id}.mp4"
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.mp4"
        download(f["link"], raw)
        trim = []
        if args.start:
            trim += ["-ss", str(args.start)]
        if args.seconds:
            trim += ["-t", str(args.seconds)]
        vf = (
            f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=increase,"
            f"crop={TARGET_W}:{TARGET_H},fps={FPS},format=yuv420p"
        )
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", *trim, "-i", str(raw), "-vf", vf, "-an",
             "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", str(out)],
            check=True,
        )
    ledger = json.loads(LEDGER.read_text()) if LEDGER.exists() else []
    ledger = [e for e in ledger if e.get("file") != out.name]
    ledger.append(
        {
            "file": out.name,
            "source": v["url"],
            "pexels_id": v["id"],
            "author": v["user"]["name"],
            "author_url": v["user"]["url"],
            "rendition": f"{f['width']}x{f['height']}",
            "trim": {"start": args.start or 0, "seconds": args.seconds},
            "license": "Pexels License (free commercial use, no attribution required)",
            "downloaded": datetime.date.today().isoformat(),
        }
    )
    LEDGER.write_text(json.dumps(ledger, indent=2) + "\n")
    print(out.relative_to(ROOT))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--count", type=int, default=8)
    s.add_argument("--min-seconds", type=float, default=3)
    s.add_argument("--orientation", choices=["portrait", "landscape", "square", "any"], default="portrait")
    s.set_defaults(fn=cmd_search)
    t = sub.add_parser("thumb")
    t.add_argument("id")
    t.set_defaults(fn=cmd_thumb)
    g = sub.add_parser("get")
    g.add_argument("id")
    g.add_argument("--name", required=True, help="short kebab-case label, e.g. phone-banking")
    g.add_argument("--start", type=float, default=0, help="seconds into the clip to start")
    g.add_argument("--seconds", type=float, default=None, help="length to keep")
    g.set_defaults(fn=cmd_get)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
