"""Find and download license-free stock media from public search pages.

usage: python3 -I fetch_stock.py <outdir> <kind:video|music> <query> [max]
Writes <outdir>/<slug>/NN.<ext>, a preview frame per video, and sources.json (page URL, file URL, license).
"""
import json, os, re, subprocess, sys, urllib.parse, urllib.request

out, kind, query = sys.argv[1], sys.argv[2], sys.argv[3]
limit = int(sys.argv[4]) if len(sys.argv) > 4 else 4
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/141 Safari/537.36"}
slug = re.sub(r"[^a-z0-9]+", "-", query.lower()).strip("-")
dest = os.path.join(out, slug)
os.makedirs(dest, exist_ok=True)


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


SOURCES = {
    "video": [
        ("mixkit", "https://mixkit.co/free-stock-video/discover/?q={q}", r"https://assets\.mixkit\.co/videos/[^\"' ]+?\.mp4",
         "Mixkit Stock Video Free License (free for commercial use, no attribution)"),
        ("pixabay", "https://pixabay.com/videos/search/{q}/", r"https://cdn\.pixabay\.com/video/[^\"' ]+?\.mp4",
         "Pixabay Content License (free for commercial use, no attribution)"),
        ("pexels", "https://www.pexels.com/search/videos/{q}/", r"https://videos\.pexels\.com/video-files/[^\"' ]+?\.mp4",
         "Pexels License (free for commercial use, no attribution)"),
    ],
    "music": [
        ("mixkit", "https://mixkit.co/free-stock-music/discover/?q={q}", r"https://assets\.mixkit\.co/music/[^\"' ]+?\.mp3",
         "Mixkit Stock Music Free License (free for use in videos, no attribution)"),
        ("pixabay", "https://pixabay.com/music/search/{q}/", r"https://cdn\.pixabay\.com/audio/[^\"' ]+?\.mp3",
         "Pixabay Content License (free for commercial use, no attribution)"),
    ],
}

found = []
for name, page_tpl, pattern, lic in SOURCES[kind]:
    page = page_tpl.format(q=urllib.parse.quote(query.replace(" ", "-") if name == "pixabay" else query))
    try:
        html = get(page).decode("utf-8", "replace")
    except Exception as e:  # blocked host, bot wall, 404 — try the next source
        print(f"[{name}] {page}: {e}")
        continue
    urls = list(dict.fromkeys(m.replace("\\/", "/") for m in re.findall(pattern, html.replace("\\/", "/"))))
    print(f"[{name}] {len(urls)} candidates")
    for u in urls:
        if len(found) >= limit:
            break
        found.append({"source": name, "page": page, "url": u, "license": lic})
    if len(found) >= limit:
        break

for i, f in enumerate(found):
    ext = ".mp4" if kind == "video" else ".mp3"
    path = os.path.join(dest, f"{i:02d}{ext}")
    try:
        with open(path, "wb") as fh:
            fh.write(get(f["url"]))
        f["file"] = path
        if kind == "video":
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", path, "-frames:v", "1", "-vf", "scale=360:-1",
                            path.replace(".mp4", ".jpg")], check=False)
    except Exception as e:
        f["error"] = str(e)
json.dump(found, open(os.path.join(dest, "sources.json"), "w"), indent=1)
print(json.dumps([{k: v for k, v in f.items() if k != "page"} for f in found], indent=1))
