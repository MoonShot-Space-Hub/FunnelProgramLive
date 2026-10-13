"""Generate AI video B-roll with Google Veo through the Gemini API.

Needs the GEMINI_API_KEY environment variable (Google AI Studio key with Veo access; Veo is a
paid feature) and network access to generativelanguage.googleapis.com.

Run from the project root:

  python3 tools/generate_broll_veo.py models                  # which Veo models this key can use
  python3 tools/generate_broll_veo.py list                    # the prompts in broll/veo-prompts.json
  python3 tools/generate_broll_veo.py generate b1-phone-check [--model veo-3.0-fast-generate-001]
  python3 tools/generate_broll_veo.py generate --all

`generate` submits the prompt as a long-running job, polls until it finishes, downloads the
clip, keeps the original in assets/broll/veo/, writes a 1080x1920 25 fps muted copy to
assets/broll/<id>.mp4 (trimmed to the prompt's `seconds` from `start`), and records the model
and prompt in assets/broll/ledger.json. Each call costs money: check `models` and the prompt
list before running --all.
"""

import argparse
import datetime
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "broll/veo-prompts.json"
BROLL = ROOT / "assets/broll"
RAW = BROLL / "veo"
LEDGER = BROLL / "ledger.json"
BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "veo-3.0-fast-generate-001"
TARGET_W, TARGET_H, FPS = 1080, 1920, 25


def key():
    k = os.environ.get("GEMINI_API_KEY")
    if not k:
        sys.exit(
            "GEMINI_API_KEY is not set. Add a Gemini API key to this environment's settings "
            "(Network secrets / environment variables) and start a new session."
        )
    return k


def call(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "x-goog-api-key": key(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        sys.exit(f"{method} {url.split('?')[0]} -> HTTP {e.code}\n{detail}")


def find_video_uri(obj):
    """The generated video's download URI, wherever this API version puts it."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("uri", "videoUri", "gcsUri") and isinstance(v, str) and v.startswith("http"):
                return v
            found = find_video_uri(v)
            if found:
                return found
    elif isinstance(obj, list):
        for v in obj:
            found = find_video_uri(v)
            if found:
                return found
    return None


def load_prompts():
    return json.loads(PROMPTS.read_text())


def cmd_models(_):
    data = call("GET", f"{BASE}/models?pageSize=1000")
    veo = [m for m in data.get("models", []) if "veo" in m.get("name", "")]
    if not veo:
        print("no Veo models visible to this key")
    for m in veo:
        print(m["name"].removeprefix("models/"), "|", ", ".join(m.get("supportedGenerationMethods", [])))


def cmd_list(_):
    p = load_prompts()
    for item in p["clips"]:
        print(f"{item['id']:<22} {item['window']:<14} {item['seconds']}s  {item['line']}")


def generate_one(item, defaults, model):
    params = dict(defaults.get("parameters", {}))
    params.update(item.get("parameters", {}))
    body = {"instances": [{"prompt": item["prompt"]}], "parameters": params}
    print(f"[{item['id']}] submitting to {model} ...", flush=True)
    op = call("POST", f"{BASE}/models/{model}:predictLongRunning", body)
    name = op["name"]
    deadline = time.time() + 15 * 60
    while not op.get("done"):
        if time.time() > deadline:
            sys.exit(f"[{item['id']}] still running after 15 min; operation {name}")
        time.sleep(10)
        op = call("GET", f"{BASE}/{name}")
    if "error" in op:
        sys.exit(f"[{item['id']}] failed: {json.dumps(op['error'])}")
    uri = find_video_uri(op.get("response", op))
    if not uri:
        sys.exit(f"[{item['id']}] finished without a video URI:\n{json.dumps(op)[:2000]}")

    RAW.mkdir(parents=True, exist_ok=True)
    raw = RAW / f"{item['id']}.mp4"
    req = urllib.request.Request(uri, headers={"x-goog-api-key": key()})
    with urllib.request.urlopen(req, timeout=300) as res, open(raw, "wb") as out:
        while chunk := res.read(1 << 16):
            out.write(chunk)

    out_path = BROLL / f"{item['id']}.mp4"
    vf = (f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=increase,"
          f"crop={TARGET_W}:{TARGET_H},fps={FPS},format=yuv420p")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(item.get("start", 0)), "-t", str(item["seconds"]),
         "-i", str(raw), "-vf", vf, "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-movflags", "+faststart", str(out_path)],
        check=True,
    )
    ledger = json.loads(LEDGER.read_text()) if LEDGER.exists() else []
    ledger = [e for e in ledger if e.get("file") != out_path.name]
    ledger.append({
        "file": out_path.name,
        "source": "AI-generated with Google Veo (Gemini API)",
        "model": model,
        "prompt": item["prompt"],
        "parameters": params,
        "raw": str(raw.relative_to(ROOT)),
        "generated": datetime.date.today().isoformat(),
    })
    LEDGER.write_text(json.dumps(ledger, indent=2) + "\n")
    print(f"[{item['id']}] -> {out_path.relative_to(ROOT)}")


def cmd_generate(args):
    p = load_prompts()
    items = p["clips"] if args.all else [c for c in p["clips"] if c["id"] in args.ids]
    missing = set(args.ids) - {c["id"] for c in items}
    if missing or not items:
        sys.exit(f"unknown prompt id(s): {', '.join(sorted(missing)) or '(none given)'}")
    model = args.model or p.get("model", DEFAULT_MODEL)
    for item in items:
        generate_one(item, p, model)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("models").set_defaults(fn=cmd_models)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    g = sub.add_parser("generate")
    g.add_argument("ids", nargs="*")
    g.add_argument("--all", action="store_true")
    g.add_argument("--model")
    g.set_defaults(fn=cmd_generate)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
