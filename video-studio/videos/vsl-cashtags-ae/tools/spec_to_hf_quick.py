"""spec.json -> single-file HyperFrames index.html (HTML preview back end, see SCHEMA.md).

usage: python3 -I tools/spec_to_hf_quick.py spec.json index.html
"""
import html, json, math, sys

ASC, DESC = 0.96875, 494 / 2048
WEIGHT = {"Inter-Regular": 400, "Inter-Medium": 500, "Inter-SemiBold": 600, "Inter-Bold": 700,
          "Inter-ExtraBold": 800, "Inter-Black": 900}
EASE = {"out": (0.10, 0.20), "in": (0.80, 0.90), "inout": (0.70, 0.30), "soft": (0.3333, 0.6667)}


def rgba(hexc, op=100):
    h = hexc.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{op / 100:.3f})"


def first(v):
    return v["k"][0][1] if isinstance(v, dict) else v


def num(x):
    return float(f"{x:.4f}")


class Gen:
    def __init__(self, spec):
        self.s = spec
        self.comps = {c["id"]: c for c in spec["comps"]}
        self.assets = {a["id"]: a for a in spec["assets"]}
        self.n = 0
        self.js = []          # timeline statements
        self.media = []       # root-level <audio>
        self.track = 1

    def nid(self):
        self.n += 1
        return f"l{self.n}"

    # --- animation emission -------------------------------------------------
    def anim(self, target, v, conv, off):
        """v: static or {"k": ...}; conv(value) -> dict of GSAP props."""
        if not isinstance(v, dict):
            self.js.append(f"tl.set({target},{json.dumps(conv(v))},0);")
            return
        ks = v["k"]
        self.js.append(f"tl.set({target},{json.dumps(conv(ks[0][1]))},0);")
        for a, b in zip(ks, ks[1:]):
            e = a[2] if len(a) > 2 else "out"
            ta, tb = num(a[0] + off), num(b[0] + off)
            if e == "hold" or tb - ta < 1e-4:
                self.js.append(f"tl.set({target},{json.dumps(conv(b[1]))},{tb});")
                continue
            ease = '"none"' if e == "linear" else f"E.{e}"
            to = conv(b[1])
            to_s = json.dumps(to)[:-1] + f',"duration":{num(tb - ta)},"ease":{ease},"immediateRender":false}}'
            self.js.append(f"tl.fromTo({target},{json.dumps(conv(a[1]))},{to_s},{ta});")

    def anim_fn(self, fn, v, off):
        """Animate a proxy {v0..vn} and call JS function fn(value) on every update (seek-safe)."""
        def props(val):
            arr = val if isinstance(val, list) else [val]
            return "{" + ",".join(f"v{i}:{num(x)}" for i, x in enumerate(arr)) + "}"
        if not isinstance(v, dict):
            self.js.append(f"{fn}({json.dumps(v)});")
            return
        ks = v["k"]
        n = len(ks[0][1]) if isinstance(ks[0][1], list) else 1
        getter = "[" + ",".join(f"p.v{i}" for i in range(n)) + "]" if isinstance(ks[0][1], list) else "p.v0"
        self.js.append(f"(function(){{var p={props(ks[0][1])};var f={fn};var u=function(){{f({getter})}};u();"
                       f"tl.set(p,Object.assign({props(ks[0][1])},{{onUpdate:u}}),0);")
        for a, b in zip(ks, ks[1:]):
            e = a[2] if len(a) > 2 else "out"
            ta, tb = num(a[0] + off), num(b[0] + off)
            if e == "hold" or tb - ta < 1e-4:
                self.js.append(f"tl.set(p,Object.assign({props(b[1])},{{onUpdate:u}}),{tb});")
                continue
            ease = '"none"' if e == "linear" else f"E.{e}"
            self.js.append(f"tl.fromTo(p,{props(a[1])},Object.assign({props(b[1])},{{duration:{num(tb - ta)},ease:{ease},"
                           f"immediateRender:false,onUpdate:u}}),{ta});")
        self.js.append("})();")

    # --- layers ---------------------------------------------------------------
    def layer(self, L, comp, off, parent_dur):
        t = L["type"]
        if t == "audio":
            a = self.assets[L["asset"]]
            st = L.get("start", 0)
            db = first(L.get("audioLevels", 0))
            self.media.append(
                f'<audio id="{self.nid()}" src="{a["preview"]}" data-start="{num(L["in"] + off)}" '
                f'data-duration="{num(L["out"] - L["in"])}" data-media-start="{num(L["in"] - st)}" '
                f'data-volume="{10 ** (db / 20):.4f}" data-track-index="{self.next_track()}"></audio>')
            return ""
        lid = self.nid()
        T = f'"#{lid}"'
        cw, ch = comp["width"], comp["height"]
        # source box + default anchor/position
        if t in ("image",):
            a = self.assets[L["asset"]]
            sw, sh = a["width"], a["height"]
            danch, dpos = [sw / 2, sh / 2], [cw / 2, ch / 2]
        elif t == "footage":
            a = self.assets[L["asset"]]
            sw, sh = a["width"], a["height"]
            danch, dpos = [sw / 2, sh / 2], [cw / 2, ch / 2]
        elif t == "comp":
            c = self.comps[L["comp"]]
            sw, sh = c["width"], c["height"]
            danch, dpos = [sw / 2, sh / 2], [cw / 2, ch / 2]
        else:
            sw = sh = 0
            danch, dpos = [0, 0], [0, 0]
        ax, ay = L.get("anchor", danch)
        pos = L.get("position", dpos)
        # transforms
        self.anim(T, pos, lambda v: {"x": num(v[0]), "y": num(v[1])}, off)
        if "scale" in L:
            self.anim(T, L["scale"], lambda v: {"scaleX": num(v[0] / 100), "scaleY": num(v[1] / 100)}, off)
        if "rotation" in L:
            self.anim(T, L["rotation"], lambda v: {"rotation": num(v)}, off)
        if "opacity" in L:
            self.anim(T, L["opacity"], lambda v: {"opacity": num(v / 100)}, off)
        # filters
        if "shadow" in L or "blur" in L:
            sh_ = L.get("shadow")
            ds = ""
            if sh_:
                d = math.radians(sh_["direction"])
                dx, dy = sh_["distance"] * math.sin(d), -sh_["distance"] * math.cos(d)
                ds = f"drop-shadow({dx:.1f}px {dy:.1f}px {sh_['softness'] / 2:.1f}px {rgba(sh_['color'], sh_['opacity'])})"
            fn = f'(function(b){{var e=document.getElementById("{lid}");e.style.filter="{ds}"+(b>0.05?" blur("+(b/2).toFixed(2)+"px)":"")||"none";}})'
            self.anim_fn(fn, L.get("blur", 0), off)
        # visibility (not for media-bearing comps' children handled by runtime)
        a_in, a_out = num(L["in"] + off), num(L["out"] + off)
        if t != "footage":
            if L["in"] > 1e-4:
                self.js.append(f'tl.set({T},{{visibility:"hidden"}},0);tl.set({T},{{visibility:"visible"}},{a_in});')
            if L["out"] < parent_dur - 1e-4:
                self.js.append(f'tl.set({T},{{visibility:"hidden"}},{a_out});')
        inner = self.content(L, lid, off, sw, sh)
        clip = ""
        if "mask" in L:
            r = L["mask"]["radius"]
            fn = (f'(function(m){{document.getElementById("{lid}i").style.clipPath="inset("+m[1]+"px "+({sw}-m[2])+"px "'
                  f'+({sh}-m[3])+"px "+m[0]+"px round {r}px)";}})')
            self.anim_fn(fn, L["mask"]["rect"], off)
        size = f"width:{sw}px;height:{sh}px;" if sw else ""
        ovf = "overflow:hidden;" if t == "comp" else ""
        return (f'<div class="L" id="{lid}" data-name="{html.escape(L["name"])}">'
                f'<div class="I" id="{lid}i" style="left:{-ax}px;top:{-ay}px;{size}{ovf}">{inner}</div></div>')

    def next_track(self):
        self.track += 1
        return self.track

    def content(self, L, lid, off, sw, sh):
        t = L["type"]
        if t == "comp":
            c = self.comps[L["comp"]]
            st = L.get("start", L["in"])
            return "".join(self.layer(x, c, off + st, c["duration"]) for x in c["layers"])
        if t == "image":
            a = self.assets[L["asset"]]
            return f'<img src="{a["preview"]}" style="position:absolute;left:0;top:0;width:{sw}px;height:{sh}px" alt="">'
        if t == "footage":
            a = self.assets[L["asset"]]
            st = L.get("start", 0)
            aud = L.get("audio", True)
            db = first(L.get("audioLevels", 0))
            attrs = (f'data-has-audio="true" data-volume="{10 ** (db / 20):.4f}"' if aud else "muted")
            return (f'<video id="{lid}v" class="clip" src="{a["preview"]}" playsinline {attrs} '
                    f'data-start="{num(L["in"] + off)}" data-duration="{num(L["out"] - L["in"])}" '
                    f'data-media-start="{num(L["in"] - st)}" data-track-index="0" '
                    f'style="position:absolute;left:0;top:0;width:{sw}px;height:{sh}px"></video>')
        if t == "text":
            size = L["size"]
            lead = L.get("leading", round(size * 1.2))
            top = (lead - (ASC + DESC) * size) / 2 + ASC * size
            just = L.get("justify", "left")
            tx = {"left": "0", "center": "-50%", "right": "-100%"}[just]
            style = (f"left:0;top:{-top:.2f}px;transform:translateX({tx});text-align:{just};"
                     f"font-weight:{WEIGHT[L['font']]};font-size:{size}px;line-height:{lead}px;"
                     f"letter-spacing:{L.get('tracking', 0) / 1000:.4f}em;color:{L['color']}")
            if "karaoke" in L:
                k = L["karaoke"]
                words = L["text"].split(" ")
                spans = []
                for i, w in enumerate(words):
                    spans.append(f'<span id="{lid}w{i}" style="color:{k["dim"]}">{html.escape(w)}</span>')
                    self.js.append(f'tl.set("#{lid}w{i}",{{color:"{k["dim"]}"}},0);'
                                   f'tl.set("#{lid}w{i}",{{color:"{L["color"]}"}},{num(k["times"][i] + off)});')
                body = " ".join(spans)
            else:
                body = html.escape(L["text"])
            return f'<div class="T" style="{style}">{body}</div>'
        # shapes
        fill = L.get("fill")
        stroke = L.get("stroke")
        sw_ = L.get("strokeWidth", 0)
        fo = first(L.get("fillOpacity", 100)) / 100
        so = first(L.get("strokeOpacity", 100)) / 100
        cap = {"butt": "butt", "round": "round", "square": "square"}[L.get("lineCap", "butt" if t != "path" else "round")]
        join = L.get("lineJoin", "round")
        paint = (f'fill="{first(fill) if fill else "none"}" fill-opacity="{fo}" '
                 f'stroke="{stroke if stroke and sw_ else "none"}" stroke-width="{sw_}" stroke-opacity="{so}" '
                 f'stroke-linecap="{cap}" stroke-linejoin="{join}"')
        trim = L.get("trim")
        pl = ' pathLength="100"' if trim else ""
        sid = f"{lid}s"
        if t == "rect":
            w, h = first(L["size"])
            r = min(L.get("radius", 0), w / 2, h / 2)
            el = f'<rect id="{sid}" x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="{r}" ry="{r}"{pl} {paint}/>'
            if isinstance(L["size"], dict):
                rr = L.get("radius", 0)
                fn = (f'(function(s){{var e=document.getElementById("{sid}");e.setAttribute("x",-s[0]/2);e.setAttribute("y",-s[1]/2);'
                      f'e.setAttribute("width",s[0]);e.setAttribute("height",s[1]);var r=Math.min({rr},s[0]/2,s[1]/2);'
                      f'e.setAttribute("rx",r);e.setAttribute("ry",r);}})')
                self.anim_fn(fn, L["size"], off)
        elif t == "ellipse":
            w, h = first(L["size"])
            rx, ry = w / 2, h / 2
            d = f"M 0 {-ry} A {rx} {ry} 0 1 1 0 {ry} A {rx} {ry} 0 1 1 0 {-ry} Z"
            el = f'<path id="{sid}" d="{d}"{pl} {paint}/>'
        elif t == "path":
            ds = []
            for p in L["paths"]:
                v = p["v"]
                n = len(v)
                ii = p.get("i", [[0, 0]] * n)
                oo = p.get("o", [[0, 0]] * n)
                seg = [f"M {v[0][0]} {v[0][1]}"]
                rng = range(n) if p.get("closed") else range(n - 1)
                for k in rng:
                    k2 = (k + 1) % n
                    c1 = (v[k][0] + oo[k][0], v[k][1] + oo[k][1])
                    c2 = (v[k2][0] + ii[k2][0], v[k2][1] + ii[k2][1])
                    seg.append(f"C {c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {v[k2][0]} {v[k2][1]}")
                if p.get("closed"):
                    seg.append("Z")
                ds.append(" ".join(seg))
            el = "".join(f'<path class="{sid}" d="{d}"{pl} {paint}/>' for d in ds)
        else:
            raise ValueError(t)
        if trim:
            sel = f'document.querySelectorAll("#{lid} svg > *")'
            fn = (f'(function(t){{var es={sel};for(var i=0;i<es.length;i++){{var a=t[0],b=t[1],L=Math.max(0,b-a);'
                  f'es[i].setAttribute("stroke-dasharray",L.toFixed(3)+" 200");es[i].setAttribute("stroke-dashoffset",(-a).toFixed(3));'
                  f'es[i].style.visibility=L<0.05?"hidden":"visible";}}}})')
            st_, en_ = trim.get("start", 0), trim.get("end", 100)
            # combine start/end into one animated pair
            self.anim_fn(fn, self.pair(st_, en_), off)
        return f'<svg width="1" height="1">{el}</svg>'

    @staticmethod
    def pair(a, b):
        """Merge two anims into one anim of [a, b] (keys at the union of times, eased per source)."""
        if not isinstance(a, dict) and not isinstance(b, dict):
            return [a, b]
        from qc_face import ev
        times = sorted({k[0] for v in (a, b) if isinstance(v, dict) for k in v["k"]})
        # sample densely between keys so each channel keeps its own easing
        pts = []
        for t0, t1 in zip(times, times[1:]):
            for j in range(8):
                pts.append(t0 + (t1 - t0) * j / 8)
        pts.append(times[-1])
        return {"k": [[round(t, 4), [ev(a, t), ev(b, t)], "linear"] for t in pts]}

    def build(self):
        main = self.comps[self.s["main"]]
        body = "".join(self.layer(L, main, 0.0, main["duration"]) for L in main["layers"])
        fonts = "".join(
            f'@font-face{{font-family:"Inter";src:url("assets/fonts/{k}.otf") format("opentype");font-weight:{w};font-style:normal}}'
            for k, w in WEIGHT.items())
        js = "\n".join(self.js)
        return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{html.escape(self.s["name"])} preview</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      {fonts}
      html, body {{ margin: 0; padding: 0; background: #0A1F44; }}
      #root {{ position: relative; width: {main["width"]}px; height: {main["height"]}px; overflow: hidden; background: #0A1F44;
               font-family: "Inter", sans-serif; }}
      #root .L {{ position: absolute; left: 0; top: 0; transform-origin: 0 0; }}
      #root .I {{ position: absolute; }}
      #root svg {{ position: absolute; left: 0; top: 0; overflow: visible; }}
      #root .T {{ position: absolute; white-space: pre; font-kerning: normal; text-rendering: geometricPrecision; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{main["duration"]}" data-width="{main["width"]}" data-height="{main["height"]}">
      {body}
      {"".join(self.media)}
    </div>
    <script>
      (function () {{
        function bz(x1, x2) {{
          return function (p) {{
            if (p <= 0) return 0; if (p >= 1) return 1;
            var lo = 0, hi = 1, u = 0.5;
            for (var i = 0; i < 40; i++) {{
              u = (lo + hi) / 2;
              var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
              if (x < p) lo = u; else hi = u;
            }}
            u = (lo + hi) / 2;
            return 3 * (1 - u) * u * u + u * u * u;
          }};
        }}
        var E = {{ out: bz(0.10, 0.20), "in": bz(0.80, 0.90), inout: bz(0.70, 0.30), soft: bz(0.3333, 0.6667) }};
        var tl = gsap.timeline({{ paused: true }});
{js}
        tl.seek(0);
        window.__timelines = window.__timelines || {{}};
        window.__timelines["main"] = tl;
      }})();
    </script>
  </body>
</html>
"""


if __name__ == "__main__":
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    spec = json.load(open(sys.argv[1]))
    out = Gen(spec).build()
    open(sys.argv[2], "w").write(out)
    print("wrote", sys.argv[2], len(out) // 1024, "KB")
