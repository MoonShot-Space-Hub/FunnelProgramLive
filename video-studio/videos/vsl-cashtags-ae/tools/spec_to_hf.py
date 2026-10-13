#!/usr/bin/env python3
"""spec.json -> single-file HyperFrames composition (the HTML preview back end).

Usage:
    python3 -I tools/spec_to_hf.py spec.json index.html

Contract: SCHEMA.md, section "Back-end requirements / HTML back end". Nothing visual is
invented here: every pixel comes from the spec. Readings of the schema that needed a choice
are listed under NOTES below.

Element model (one per visual layer, DOM order = painting order, bottom to top):

    <div class="L" id="Ln">               outer box at the comp origin, transform-origin 0 0.
                                          GSAP animates x, y, rotation, scaleX, scaleY, opacity
                                          (GSAP's 2D transform order is translate, rotate, scale,
                                          which is position + R * S * (p - anchor)). Visibility,
                                          drop shadow and blur (CSS filter) also live here.
      <div class="I" id="Lni">            the layer-space box, offset by -anchor. Mask
                                          (clip-path) applies here. For a comp layer this box is
                                          the comp itself: comp width x height, overflow hidden.
        content                           SVG shape | text box | <img> | <video> | child layers
      </div>
    </div>

Timing: every tween sits on the one paused root timeline at absolute (root) time. Absolute
time = comp-local time + the sum of the `start` offsets of the comp layers above it. Each
animated property becomes a contiguous chain of fromTo tweens that starts at time 0 (the first
one with immediateRender), so a seek to any time in any order lands on the right value. "hold"
segments use a step ease that switches 0.1 ms before the next key, so a frame sampled exactly
on the key (float noise included) already shows the new value. Properties that do not map to
one CSS property (visibility, blur, mask, shape size, colour, trim) are tweened on a small
controller object whose getter/setter functions write the DOM.

Media: <video> and <audio> playback and visibility belong to the HyperFrames runtime. Their
data-start / data-duration / data-media-start are absolute and clamped to the layer's own
window, the source length, and every enclosing comp layer's window (the runtime makes a timed
<video> visible on its own, ignoring a hidden ancestor, so the window must already be exact).

NOTES (schema readings):
- A comp's `bg` is painted only for the main (rendered) comp. AE draws a nested comp's
  background as transparent, so nested comps get no background.
- Animated `audioLevels`: data-volume is the first key (as SCHEMA.md says), and the eased curve
  is also written as a data-automation volume lane (absolute gain, clip-local time), sampled
  from the same eases, so the preview mix follows the fades.
- Trim on a filled shape: AE trims the path before Stroke and Fill, so the fill is the trimmed
  open path closed by a straight line. The fill is drawn as a polygon sampled along the
  trimmed path (getPointAtLength); the stroke uses pathLength=100 + dasharray/dashoffset.
- Karaoke: words are split on single spaces as SCHEMA.md says; a word that contains a line
  break stays one span.
- Text: the first baseline sits on the layer origin using the Inter vertical metrics from
  SCHEMA.md (ascender 0.96875 em, descender 0.2412 em) and CSS half-leading.
"""

import json
import math
import sys
from html import escape

FONT_WEIGHTS = {
    "Inter-Regular": 400,
    "Inter-Medium": 500,
    "Inter-SemiBold": 600,
    "Inter-Bold": 700,
    "Inter-ExtraBold": 800,
    "Inter-Black": 900,
}
ASCENT = 1984 / 2048
DESCENT = 494 / 2048

# ease name -> (outgoing influence % at the start key, incoming influence % at the end key)
EASES = {"out": (10.0, 80.0), "in": (80.0, 10.0), "inout": (70.0, 70.0), "soft": (33.33, 33.33)}
DISCRETE_EASES = ("linear", "hold")

STATIC_DUR = 0.001  # length of the one-key "static" tween at time 0
HOLD_EPS = 1e-4  # hold / visibility steps switch this long before the key time
KAPPA = 0.5522847498  # circle bezier handle length
LAYER_TYPES = ("rect", "ellipse", "path", "text", "image", "footage", "audio", "comp")


class SpecError(Exception):
    pass


# ---------------------------------------------------------------- numbers and eases


def rnd(x, nd=6):
    v = round(float(x), nd)
    return 0.0 if v == 0 else v


def num(x):
    """Compact decimal string for HTML attributes / CSS."""
    v = rnd(x, 4)
    if v == int(v):
        return str(int(v))
    return ("%.4f" % v).rstrip("0").rstrip(".")


def tnum(x):
    """Compact decimal string for times (6 decimals)."""
    v = rnd(x, 6)
    if v == int(v):
        return str(int(v))
    return ("%.6f" % v).rstrip("0").rstrip(".")


def bezier_ease(x1, x2):
    """cubic-bezier(x1, 0, x2, 1): AE temporal ease with speed 0 at both keys."""

    def f(p):
        if p <= 0:
            return 0.0
        if p >= 1:
            return 1.0
        lo, hi, t = 0.0, 1.0, p
        for _ in range(64):
            x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
            if abs(x - p) < 1e-12:
                break
            if x < p:
                lo = t
            else:
                hi = t
            t = (lo + hi) / 2
        return t * t * (3 - 2 * t)

    return f


def ease_params(name):
    o, i = EASES[name]
    return [o / 100.0, 1 - i / 100.0]


EASE_FN = {name: bezier_ease(*ease_params(name)) for name in EASES}


def ease_ratio(name, p):
    if name == "linear":
        return p
    if name == "hold":
        return 0.0 if p < 1 else 1.0
    return EASE_FN[name](p)


# ---------------------------------------------------------------- values and keyframes


def is_anim(v):
    return isinstance(v, dict) and "k" in v


def hex_rgb(c):
    if not isinstance(c, str) or len(c) != 7 or c[0] != "#":
        raise SpecError("bad colour %r (want #RRGGBB)" % (c,))
    return [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)]


def rgb_hex(rgb):
    return "#" + "".join("%02X" % max(0, min(255, int(round(v)))) for v in rgb)


def lerp(a, b, r):
    if isinstance(a, str):
        return rgb_hex([x + (y - x) * r for x, y in zip(hex_rgb(a), hex_rgb(b))])
    if isinstance(a, (list, tuple)):
        return [x + (y - x) * r for x, y in zip(a, b)]
    return a + (b - a) * r


def norm_keys(v, where):
    """Static value -> one key at t=0. Animated -> sorted keys, later duplicates win (as in AE)."""
    if not is_anim(v):
        return [[0.0, v, "linear"]]
    ks = v["k"]
    if not isinstance(ks, list) or not ks:
        raise SpecError("%s: empty keyframe list" % where)
    out = []
    for k in ks:
        if not isinstance(k, (list, tuple)) or len(k) < 2:
            raise SpecError("%s: bad key %r" % (where, k))
        e = k[2] if len(k) > 2 and k[2] is not None else "out"
        if e not in EASES and e not in DISCRETE_EASES:
            raise SpecError("%s: unknown ease %r" % (where, e))
        out.append([float(k[0]), k[1], e])
    out.sort(key=lambda k: k[0])
    dedup = []
    for k in out:
        if dedup and abs(dedup[-1][0] - k[0]) < 1e-9:
            dedup[-1] = k
        else:
            dedup.append(k)
    return dedup


def value_at(keys, t):
    if t <= keys[0][0]:
        return keys[0][1]
    if t >= keys[-1][0]:
        return keys[-1][1]
    for i in range(len(keys) - 1):
        ta, va, ea = keys[i]
        tb, vb, _ = keys[i + 1]
        if ta <= t < tb:
            return lerp(va, vb, ease_ratio(ea, (t - ta) / (tb - ta)))
    return keys[-1][1]


def first_value(v):
    return norm_keys(v, "value")[0][1]


def segments(keys, offset, conv):
    """Keyframes (containing-comp time) -> contiguous tween chain at absolute time >= 0.

    Each segment is [t0, duration, from_values, to_values, ease_spec]. ease_spec is an ease
    name, ["hold", threshold] (step ease), or [name, u0] (the tail of a bezier segment that
    started before time 0)."""
    ks = [[offset + t, v, e] for t, v, e in keys]
    last = ks[-1]
    if len(ks) == 1 or last[0] <= 0:
        return [[0.0, STATIC_DUR, conv(last[1]), conv(last[1]), "linear"]]
    segs = []
    if ks[0][0] > 0:
        segs.append([0.0, ks[0][0], conv(ks[0][1]), conv(ks[0][1]), "linear"])
    for i in range(len(ks) - 1):
        ta, va, ea = ks[i]
        tb, vb, _ = ks[i + 1]
        if tb <= 0:
            continue
        t0 = max(ta, 0.0)
        dur = tb - t0
        if ea == "hold":
            segs.append([t0, dur, conv(va), conv(vb), ["hold", rnd(max(0.0, 1 - HOLD_EPS / dur), 9)]])
        elif ta >= 0:
            segs.append([t0, dur, conv(va), conv(vb), ea])
        else:
            u0 = -ta / (tb - ta)
            v0 = lerp(va, vb, ease_ratio(ea, u0))
            spec = "linear" if ea == "linear" else [ea, rnd(u0, 9)]
            segs.append([t0, dur, conv(v0), conv(vb), spec])
    return segs


def round_tree(x):
    if isinstance(x, float):
        return rnd(x, 6)
    if isinstance(x, list):
        return [round_tree(v) for v in x]
    if isinstance(x, dict):
        return {k: round_tree(v) for k, v in x.items()}
    return x


# ---------------------------------------------------------------- geometry helpers


def ellipse_d(w, h):
    a, b = w / 2.0, h / 2.0
    ka, kb = a * KAPPA, b * KAPPA
    n = num
    return (
        "M0 %s" % n(-b)
        + "C%s %s %s %s %s 0" % (n(ka), n(-b), n(a), n(-kb), n(a))
        + "C%s %s %s %s 0 %s" % (n(a), n(kb), n(ka), n(b), n(b))
        + "C%s %s %s %s %s 0" % (n(-ka), n(b), n(-a), n(kb), n(-a))
        + "C%s %s %s %s 0 %s" % (n(-a), n(-kb), n(-ka), n(-b), n(-b))
        + "Z"
    )


def subpath_d(p, where):
    v = p.get("v") or []
    if not v:
        raise SpecError("%s: path without vertices" % where)
    n = len(v)
    ins = p.get("i") or [[0, 0]] * n
    outs = p.get("o") or [[0, 0]] * n
    if len(ins) != n or len(outs) != n:
        raise SpecError("%s: i/o tangent count must match vertex count" % where)

    def seg(a, b):
        o, i = outs[a], ins[b]
        if o[0] == 0 and o[1] == 0 and i[0] == 0 and i[1] == 0:
            return "L%s %s" % (num(v[b][0]), num(v[b][1]))
        return "C%s %s %s %s %s %s" % (
            num(v[a][0] + o[0]), num(v[a][1] + o[1]),
            num(v[b][0] + i[0]), num(v[b][1] + i[1]),
            num(v[b][0]), num(v[b][1]),
        )

    d = "M%s %s" % (num(v[0][0]), num(v[0][1]))
    for k in range(n - 1):
        d += seg(k, k + 1)
    if p.get("closed"):
        if n > 1:
            d += seg(n - 1, 0)
        d += "Z"
    return d


def shadow_css(sh):
    color = hex_rgb(sh.get("color", "#000000"))
    op = float(sh.get("opacity", 100)) / 100.0
    direction = math.radians(float(sh.get("direction", 180)))
    dist = float(sh.get("distance", 0))
    soft = float(sh.get("softness", 0))
    dx = dist * math.sin(direction)
    dy = -dist * math.cos(direction)
    return "drop-shadow(%spx %spx %spx rgba(%d,%d,%d,%s))" % (
        num(dx), num(dy), num(soft / 2.0), color[0], color[1], color[2], num(op))


def db_gain(db):
    return 10 ** (float(db) / 20.0)


# ---------------------------------------------------------------- builder


class Builder:
    def __init__(self, spec):
        self.spec = spec
        if spec.get("version") != 1:
            raise SpecError("spec version must be 1")
        self.fps = float(spec.get("fps", 30))
        self.assets = {}
        for a in spec.get("assets", []):
            self.assets[a["id"]] = a
        self.comps = {}
        for c in spec.get("comps", []):
            for layer in c.get("layers", []):
                if layer.get("type") == "comp" and layer.get("comp") not in self.comps:
                    raise SpecError(
                        "comp %r uses comp %r, which is not listed before it" % (c.get("id"), layer.get("comp")))
            self.comps[c["id"]] = c
        if spec.get("main") not in self.comps:
            raise SpecError("main comp %r not found" % spec.get("main"))
        self.main = self.comps[spec["main"]]
        self.dur = float(self.main["duration"])
        self.n = 0
        self.ctls = []  # controller configs
        self.tweens = []  # [kind, ref, names, segments]; kind 0 = element id, 1 = controller index
        self.audio_html = []
        self.media_n = 0
        self.warnings = []
        self.fonts = set()

    def warn(self, msg):
        self.warnings.append(msg)

    def new_id(self):
        self.n += 1
        return "L%d" % self.n

    def asset(self, layer, where, kind):
        aid = layer.get("asset")
        a = self.assets.get(aid)
        if a is None:
            raise SpecError("%s: unknown asset %r" % (where, aid))
        if a.get("type") != kind:
            raise SpecError("%s: asset %r is %s, layer needs %s" % (where, aid, a.get("type"), kind))
        if not a.get("preview"):
            raise SpecError("%s: asset %r has no preview path" % (where, aid))
        return a

    def track(self, kind, ref, names, keys, offset, conv):
        self.tweens.append([kind, ref, names, segments(keys, offset, conv)])

    def add_ctl(self, cfg):
        self.ctls.append(cfg)
        return len(self.ctls) - 1

    # ---------------------------------------------------------------- comps and layers

    def comp_layers(self, comp, offset, win, path):
        out = []
        for idx, layer in enumerate(comp.get("layers", [])):
            where = "%s/%s" % (path, layer.get("name", "#%d" % idx))
            out.append(self.layer(comp, layer, offset, win, where))
        return "".join(out)

    def layer(self, comp, L, offset, win, where):
        t = L.get("type")
        if t not in LAYER_TYPES:
            raise SpecError("%s: unknown layer type %r" % (where, t))
        if "in" not in L or "out" not in L:
            raise SpecError("%s: in and out are required" % where)
        lin, lout = float(L["in"]), float(L["out"])
        lo, hi = lin, lout
        sub = None
        if t in ("footage", "audio"):
            a = self.asset(L, where, "footage" if t == "footage" else "audio")
            start = float(L.get("start", 0))
            lo = max(lo, start)
            if a.get("duration"):
                hi = min(hi, start + float(a["duration"]))
        elif t == "comp":
            sub = self.comps.get(L.get("comp"))
            if sub is None:
                raise SpecError("%s: unknown comp %r" % (where, L.get("comp")))
            start = float(L.get("start", lin))
            lo = max(lo, start)
            hi = min(hi, start + float(sub["duration"]))
        abs_lo, abs_hi = offset + lo, offset + hi
        if t == "audio":
            self.media(L, where, a, offset, start, abs_lo, abs_hi, win, None)
            return ""
        if hi - lo <= 1e-9 or abs_hi <= 0 or abs_lo >= self.dur:
            self.warn("%s: never visible, skipped" % where)
            return ""

        lid = self.new_id()
        iid = lid + "i"
        cfg = {"o": lid}
        props = {}  # controller prop -> (keys, offset, conv)

        # visibility [abs_lo, abs_hi): steps on a controller, hidden outside
        vis = [[0.0, 1 if abs_lo <= 1e-9 else 0, "hold"]]
        if abs_lo > 1e-9:
            vis.append([abs_lo, 1, "hold"])
        if abs_hi < self.dur - 1e-9:
            vis.append([abs_hi, 0, "hold"])
        outer_style = ""
        if len(vis) > 1:
            cfg["vis"] = 1
            props["vis"] = (vis, 0.0, lambda v: [v])
            if abs_lo > 1e-9:
                outer_style = "visibility:hidden"

        # transform defaults
        cw, ch = float(comp["width"]), float(comp["height"])
        if t in ("rect", "ellipse", "path", "text"):
            anchor = L.get("anchor", [0, 0])
        elif t == "comp":
            anchor = L.get("anchor", [float(sub["width"]) / 2, float(sub["height"]) / 2])
        else:
            a = self.asset(L, where, t)
            anchor = L.get("anchor", [float(a["width"]) / 2, float(a["height"]) / 2])
        if "position" in L:
            pos = L["position"]
        elif t == "path":
            pos = [0, 0]
        elif t in ("image", "footage", "comp"):
            pos = [cw / 2, ch / 2]
        else:
            raise SpecError("%s: position is required for %s layers" % (where, t))

        static_names, static_vals = [], []
        for names, val, conv in (
            (["x", "y"], pos, lambda v: [float(v[0]), float(v[1])]),
            (["scaleX", "scaleY"], L.get("scale", [100, 100]), lambda v: [float(v[0]) / 100, float(v[1]) / 100]),
            (["rotation"], L.get("rotation", 0), lambda v: [float(v)]),
            (["opacity"], L.get("opacity", 100), lambda v: [float(v) / 100]),
        ):
            if is_anim(val):
                self.track(0, lid, names, norm_keys(val, "%s %s" % (where, names[0])), offset, conv)
            else:
                static_names += names
                static_vals += conv(val)
        if static_names:
            self.tweens.append([0, lid, static_names, [[0.0, STATIC_DUR, static_vals, static_vals, "linear"]]])

        # filter: drop shadow, then blur
        sh = shadow_css(L["shadow"]) if L.get("shadow") else ""
        blur = L.get("blur")
        if is_anim(blur):
            cfg["flt"] = sh
            props["bl"] = (norm_keys(blur, where + " blur"), offset, lambda v: [float(v)])
        else:
            parts = [sh] if sh else []
            if blur:
                parts.append("blur(%spx)" % num(float(blur) / 2))
            if parts:
                outer_style += (";" if outer_style else "") + "filter:" + " ".join(parts)

        ax, ay = float(anchor[0]), float(anchor[1])
        inner_style = "left:%spx;top:%spx" % (num(-ax), num(-ay))

        # mask on the layer's source box
        if L.get("mask") is not None:
            if t not in ("footage", "comp"):
                raise SpecError("%s: mask is only allowed on footage and comp layers" % where)
            m = L["mask"]
            if t == "comp":
                bw, bh = float(sub["width"]), float(sub["height"])
            else:
                bw, bh = float(a["width"]), float(a["height"])
            r = float(m.get("radius", 0))
            if is_anim(m.get("rect")):
                cfg["msk"] = {"i": iid, "W": bw, "H": bh, "r": r}
                props["m"] = (norm_keys(m["rect"], where + " mask"), offset, lambda v: [float(x) for x in v])
            else:
                x0, y0, x1, y1 = [float(x) for x in m["rect"]]
                inner_style += ";clip-path:inset(%spx %spx %spx %spx round %spx)" % (
                    num(y0), num(bw - x1), num(bh - y1), num(x0), num(r))

        # content
        cls = "I"
        if t in ("rect", "ellipse", "path"):
            content = self.shape(L, t, where, lid, cfg, props, offset)
        elif t == "text":
            content = self.text(L, where, lid, offset)
        elif t == "image":
            content = '<img class="M" src="%s" alt="" style="width:%spx;height:%spx">' % (
                escape(a["preview"]), num(a["width"]), num(a["height"]))
            inner_style += ";width:%spx;height:%spx" % (num(a["width"]), num(a["height"]))
        elif t == "footage":
            inner_style += ";width:%spx;height:%spx" % (num(a["width"]), num(a["height"]))
            content = self.media(L, where, a, offset, start, abs_lo, abs_hi, win,
                                 (float(a["width"]), float(a["height"])))
        else:  # comp
            inner_style += ";width:%spx;height:%spx" % (num(sub["width"]), num(sub["height"]))
            cls = "I C"
            sub_off = offset + start
            sub_win = (max(win[0], abs_lo), min(win[1], abs_hi))
            content = self.comp_layers(sub, sub_off, sub_win, "%s>%s" % (where, sub["id"]))

        # controller
        if len(cfg) > 1:
            ci = self.add_ctl(cfg)
            for key, (keys, off, conv) in props.items():
                names = ["m0", "m1", "m2", "m3"] if key == "m" else (["w", "h"] if key == "wh" else [key])
                self.track(1, ci, names, keys, off, conv)

        label = escape(where.replace("--", "- -"), quote=False)
        return '<!-- %s --><div id="%s" class="L"%s><div id="%s" class="%s" style="%s">%s</div></div>\n' % (
            label, lid, (' style="%s"' % outer_style) if outer_style else "", iid, cls, inner_style, content)

    # ---------------------------------------------------------------- shapes

    def shape(self, L, t, where, lid, cfg, props, offset):
        fill = L.get("fill")
        stroke = L.get("stroke")
        sw = float(L.get("strokeWidth", 0) or 0)
        if stroke and sw <= 0:
            stroke = None
        fill_anim = is_anim(fill)
        fill0 = first_value(fill) if fill_anim else fill
        fo, so = L.get("fillOpacity", 100), L.get("strokeOpacity", 100)
        trim = L.get("trim") if t in ("ellipse", "path") else None
        if L.get("trim") and t == "rect":
            raise SpecError("%s: trim is only allowed on ellipse and path layers" % where)
        cap = L.get("lineCap", "butt")
        join = L.get("lineJoin", "round") if t == "path" else "miter"

        def paint_attrs(do_fill, do_stroke):
            s = ""
            if do_fill and fill0:
                s += ' fill="%s"' % fill0
                if not is_anim(fo) and float(fo) != 100:
                    s += ' fill-opacity="%s"' % num(float(fo) / 100)
            else:
                s += ' fill="none"'
            if do_stroke and stroke:
                s += ' stroke="%s" stroke-width="%s" stroke-linecap="%s" stroke-linejoin="%s"' % (
                    stroke, num(sw), cap, join)
                if not is_anim(so) and float(so) != 100:
                    s += ' stroke-opacity="%s"' % num(float(so) / 100)
            else:
                s += ' stroke="none"'
            return s

        size = L.get("size")
        elems = []
        fill_ids, stroke_ids, geo_ids = [], [], []
        if t == "rect":
            if size is None:
                raise SpecError("%s: size is required" % where)
            w, h = [abs(float(x)) for x in first_value(size)]
            radius = float(L.get("radius", 0) or 0)
            rr = min(radius, w / 2, h / 2)
            eid = lid + "r"
            elems.append('<rect id="%s" x="%s" y="%s" width="%s" height="%s" rx="%s" ry="%s"%s/>' % (
                eid, num(-w / 2), num(-h / 2), num(w), num(h), num(rr), num(rr), paint_attrs(True, True)))
            fill_ids, stroke_ids, geo_ids = [eid], [eid], [eid]
            if is_anim(size):
                cfg["geo"] = {"k": "rect", "r": radius, "e": geo_ids}
                props["wh"] = (norm_keys(size, where + " size"), offset, lambda v: [float(v[0]), float(v[1])])
        else:
            if t == "ellipse":
                if size is None:
                    raise SpecError("%s: size is required" % where)
                w, h = [float(x) for x in first_value(size)]
                subpaths = [ellipse_d(w, h)]
            else:
                paths = L.get("paths") or []
                if not paths:
                    raise SpecError("%s: paths is required" % where)
                subpaths = [subpath_d(p, "%s path %d" % (where, k)) for k, p in enumerate(paths)]
            if trim:
                if fill0:
                    fid = lid + "f"
                    elems.append('<path id="%s" d="%s"%s/>' % (fid, "".join(subpaths), paint_attrs(True, False)))
                    fill_ids = [fid]
                for k, d in enumerate(subpaths):
                    sid = "%ss%d" % (lid, k)
                    elems.append('<path id="%s" d="%s" pathLength="100"%s/>' % (sid, d, paint_attrs(False, True)))
                    stroke_ids.append(sid)
                geo_ids = stroke_ids + fill_ids
            else:
                eid = lid + "p"
                elems.append('<path id="%s" d="%s"%s/>' % (eid, "".join(subpaths), paint_attrs(True, True)))
                fill_ids, stroke_ids, geo_ids = [eid], [eid], [eid]
            if t == "ellipse" and is_anim(size):
                cfg["geo"] = {"k": "ell", "e": geo_ids}
                props["wh"] = (norm_keys(size, where + " size"), offset, lambda v: [float(v[0]), float(v[1])])
            if trim:
                cfg["trim"] = {"s": stroke_ids, "f": fill_ids[0] if fill_ids else None}
                props["ts"] = (norm_keys(trim.get("start", 0), where + " trim start"), offset, lambda v: [float(v)])
                props["te"] = (norm_keys(trim.get("end", 100), where + " trim end"), offset, lambda v: [float(v)])
        if fill_anim and fill_ids:
            cfg["fc"] = fill_ids
            props["fc"] = (norm_keys(fill, where + " fill"), offset, lambda v: [v])
        if is_anim(fo) and fill0 and fill_ids:
            cfg["fo"] = fill_ids
            props["fo"] = (norm_keys(fo, where + " fillOpacity"), offset, lambda v: [float(v)])
        if is_anim(so) and stroke and stroke_ids:
            cfg["so"] = stroke_ids
            props["so"] = (norm_keys(so, where + " strokeOpacity"), offset, lambda v: [float(v)])
        return '<svg class="S" width="1" height="1">%s</svg>' % "".join(elems)

    # ---------------------------------------------------------------- text

    def text(self, L, where, lid, offset):
        s = L.get("text", "")
        font = L.get("font", "Inter-Regular")
        if font not in FONT_WEIGHTS:
            raise SpecError("%s: unknown font %r" % (where, font))
        self.fonts.add(font)
        size = float(L.get("size", 0))
        if size <= 0:
            raise SpecError("%s: size must be > 0" % where)
        leading = float(L["leading"]) if L.get("leading") is not None else float(round(size * 1.2))
        tracking = float(L.get("tracking", 0) or 0)
        justify = L.get("justify", "left")
        if justify not in ("left", "center", "right"):
            raise SpecError("%s: bad justify %r" % (where, justify))
        color = L.get("color", "#000000")
        hex_rgb(color)
        baseline = leading / 2 + (ASCENT - DESCENT) / 2 * size
        style = "top:%spx;font-weight:%d;font-size:%spx;line-height:%spx;color:%s;text-align:%s" % (
            num(-baseline), FONT_WEIGHTS[font], num(size), num(leading), color, justify)
        if tracking:
            style += ";letter-spacing:%sem" % num(tracking / 1000.0)
        if justify == "center":
            style += ";transform:translateX(-50%)"
        elif justify == "right":
            style += ";transform:translateX(-100%)"
        k = L.get("karaoke")
        if k:
            words = s.split(" ")
            times = k.get("times", [])
            dim = k.get("dim", color)
            hex_rgb(dim)
            if len(times) != len(words):
                self.warn("%s: karaoke has %d times for %d words" % (where, len(times), len(words)))
            parts = []
            for i, wd in enumerate(words):
                wid = "%sw%d" % (lid, i)
                if i < len(times):
                    tabs = offset + float(times[i])
                    if tabs > 0:
                        parts.append('<span id="%s" style="color:%s">%s</span>' % (wid, dim, escape(wd, quote=False)))
                        self.tweens.append([0, wid, ["color"], segments(
                            [[0.0, dim, "hold"], [tabs, color, "hold"]], 0.0, lambda v: [v])])
                        continue
                parts.append('<span id="%s">%s</span>' % (wid, escape(wd, quote=False)))
            body = " ".join(parts)
        else:
            body = escape(s, quote=False)
        return '<div class="T" style="%s">%s</div>' % (style, body)

    # ---------------------------------------------------------------- media

    def media(self, L, where, a, offset, start, abs_lo, abs_hi, win, box):
        lo = max(abs_lo, win[0], 0.0)
        hi = min(abs_hi, win[1], self.dur)
        if hi - lo < 0.5 / self.fps:
            self.warn("%s: no audible/visible window after clamping, skipped" % where)
            return ""
        self.media_n += 1
        mid = ("v%d" if box else "a%d") % self.media_n
        media_start = lo - (offset + start)
        levels = L.get("audioLevels", 0)
        keys = norm_keys(levels, where + " audioLevels")
        attrs = 'id="%s" src="%s" data-start="%s" data-duration="%s" data-media-start="%s" data-track-index="%d"' % (
            mid, escape(a["preview"]), tnum(lo), tnum(hi - lo), tnum(media_start), self.media_n)
        has_audio = (L.get("audio", True) is not False) if box else True
        if has_audio:
            attrs += ' data-volume="%s"' % num(min(db_gain(keys[0][1]), 3.98))
            if is_anim(levels):
                lane = self.volume_lane(keys, offset, lo, hi)
                attrs += " data-automation='%s'" % json.dumps(
                    {"version": 1, "lanes": [{"target": "volume", "points": lane}]}, separators=(",", ":"))
        if box:
            if has_audio:
                attrs += ' data-has-audio="true"'
            else:
                attrs += " muted"
            return '<video class="clip M" %s playsinline style="width:%spx;height:%spx"></video>' % (
                attrs, num(box[0]), num(box[1]))
        self.audio_html.append("<audio %s></audio>" % attrs)
        return ""

    def volume_lane(self, keys, offset, lo, hi):
        """AE audio levels (dB, eased) -> absolute gain points in clip-local seconds."""
        ks = [[offset + t, v, e] for t, v, e in keys]
        times = {lo, hi}
        for i in range(len(ks) - 1):
            ta, _, ea = ks[i]
            tb = ks[i + 1][0]
            times.add(ta)
            times.add(tb)
            if ea == "hold":
                times.add(tb - 0.001)
            elif ea != "linear":
                n = max(2, min(24, int(math.ceil((tb - ta) * 15))))
                for j in range(1, n):
                    times.add(ta + (tb - ta) * j / n)
        pts = []
        for t in sorted(times):
            if lo - 1e-9 <= t <= hi + 1e-9:
                db = value_at(ks, t)
                pts.append({"t": rnd(t - lo, 4), "v": rnd(min(db_gain(db), 3.98), 4)})
        if len(pts) > 500:
            step = int(math.ceil(len(pts) / 500.0))
            pts = pts[::step] + ([pts[-1]] if (len(pts) - 1) % step else [])
        return pts

    # ---------------------------------------------------------------- document

    def build(self):
        body = self.comp_layers(self.main, 0.0, (0.0, self.dur), self.main["id"])
        fonts = "".join(
            '@font-face{font-family:"Inter";font-style:normal;font-weight:%d;font-display:block;'
            'src:url("assets/fonts/%s.otf") format("opentype")}\n' % (FONT_WEIGHTS[f], f)
            for f in sorted(FONT_WEIGHTS, key=lambda f: FONT_WEIGHTS[f]))
        W, H = int(self.main["width"]), int(self.main["height"])
        bg = self.main.get("bg") or "#000000"
        hex_rgb(bg)
        data = round_tree({
            "eases": {name: ease_params(name) for name in EASES},
            "ctl": self.ctls,
            "tw": self.tweens,
        })
        data_js = json.dumps(data, separators=(",", ":")).replace("</", "<\\/")
        return TEMPLATE.format(
            title=escape(self.spec.get("name", "composition")),
            W=W, H=H, bg=bg, fonts=fonts, dur=tnum(self.dur),
            layers=body, audio="\n".join(self.audio_html),
            data=data_js, runtime=RUNTIME_JS,
        )



TEMPLATE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <title>{title}</title>
    <!-- Generated by tools/spec_to_hf.py from spec.json. Do not edit by hand. -->
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
{fonts}      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: {bg}; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: {bg}; font-family: "Inter", sans-serif; }}
      #root .L {{ position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }}
      #root .I {{ position: absolute; }}
      #root .C {{ overflow: hidden; }}
      #root .S {{ position: absolute; left: 0; top: 0; overflow: visible; }}
      #root .T {{ position: absolute; left: 0; width: max-content; white-space: pre; font-family: "Inter", sans-serif; font-style: normal; font-kerning: normal; font-synthesis: none; }}
      #root .M {{ position: absolute; left: 0; top: 0; display: block; max-width: none; object-fit: fill; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="{W}" data-height="{H}">
{layers}{audio}
    </div>
    <script>
      (function () {{
        var D = {data};
{runtime}
      }})();
    </script>
  </body>
</html>
"""

RUNTIME_JS = r"""
        var tl = gsap.timeline({ paused: true });
        function $(id) { return document.getElementById(id); }
        // cubic-bezier(x1, 0, x2, 1): Newton steps, bisection fallback. y(t) = t^2 (3 - 2t).
        function bez(x1, x2) {
          var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
          function X(t) { return ((ax * t + bx) * t + cx) * t; }
          function dX(t) { return (3 * ax * t + 2 * bx) * t + cx; }
          return function (p) {
            if (p <= 0) return 0;
            if (p >= 1) return 1;
            var t = p, i, x, d;
            for (i = 0; i < 8; i++) {
              x = X(t) - p;
              if (Math.abs(x) < 1e-9) break;
              d = dX(t);
              if (Math.abs(d) < 1e-6) break;
              t -= x / d;
            }
            if (!(t >= 0 && t <= 1) || Math.abs(X(t) - p) > 1e-7) {
              var lo = 0, hi = 1;
              t = p;
              for (i = 0; i < 64; i++) {
                x = X(t);
                if (Math.abs(x - p) < 1e-12) break;
                if (x < p) lo = t; else hi = t;
                t = (lo + hi) / 2;
              }
            }
            return t * t * (3 - 2 * t);
          };
        }
        var E = {};
        for (var en in D.eases) E[en] = bez(D.eases[en][0], D.eases[en][1]);
        var holdCache = {};
        function ease(s) {
          if (typeof s === "string") return s === "linear" ? "none" : E[s];
          if (s[0] === "hold") {
            var thr = s[1];
            return holdCache[thr] || (holdCache[thr] = function (p) { return p >= thr ? 1 : 0; });
          }
          var f = E[s[0]], u0 = s[1], e0 = f(u0), r = 1 - e0;
          return function (p) {
            if (p >= 1) return 1;
            if (p <= 0) return 0;
            return r > 1e-12 ? (f(u0 + (1 - u0) * p) - e0) / r : 1;
          };
        }
        var KAPPA = 0.5522847498;
        function r4(v) { return Math.round(v * 10000) / 10000; }
        function ellD(w, h) {
          var a = w / 2, b = h / 2, ka = r4(a * KAPPA), kb = r4(b * KAPPA);
          a = r4(a); b = r4(b);
          return "M0 " + -b + "C" + ka + " " + -b + " " + a + " " + -kb + " " + a + " 0" +
            "C" + a + " " + kb + " " + ka + " " + b + " 0 " + b +
            "C" + -ka + " " + b + " " + -a + " " + kb + " " + -a + " 0" +
            "C" + -a + " " + -kb + " " + -ka + " " + -b + " 0 " + -b + "Z";
        }
        function els(ids) { var out = []; for (var i = 0; i < ids.length; i++) out.push($(ids[i])); return out; }
        // Trimmed fill: the trimmed open subpaths, sampled along their length, closed straight.
        function trimPoly(gs, s, e) {
          var d = "";
          for (var i = 0; i < gs.length; i++) {
            var g = gs[i], len = g.getTotalLength(), a = len * s / 100, b = len * e / 100;
            var n = Math.max(8, Math.min(400, Math.ceil((b - a) / 3)));
            for (var j = 0; j <= n; j++) {
              var p = g.getPointAtLength(a + (b - a) * j / n);
              d += (j ? "L" : "M") + r4(p.x) + " " + r4(p.y);
            }
            d += "Z";
          }
          return d;
        }
        // Controller: getter/setter functions GSAP tweens like plain properties.
        function Ctl(c) {
          var self = this, st = {}, outer = $(c.o);
          function def(name, init, apply) {
            st[name] = init;
            self[name] = function (v) {
              if (!arguments.length) return st[name];
              st[name] = v;
              apply();
            };
          }
          if (c.vis) def("vis", 1, function () { outer.style.visibility = st.vis >= 0.5 ? "inherit" : "hidden"; });
          if (c.flt !== undefined) def("bl", 0, function () {
            var f = c.flt + (st.bl > 0 ? " blur(" + st.bl / 2 + "px)" : "");
            outer.style.filter = f.trim() || "none";
          });
          if (c.msk) {
            var mi = $(c.msk.i), mW = c.msk.W, mH = c.msk.H, mr = c.msk.r;
            var applyMask = function () {
              mi.style.clipPath = "inset(" + st.m1 + "px " + (mW - st.m2) + "px " + (mH - st.m3) + "px " + st.m0 + "px round " + mr + "px)";
            };
            def("m0", 0, applyMask); def("m1", 0, applyMask); def("m2", mW, applyMask); def("m3", mH, applyMask);
          }
          var applyTrim = null;
          if (c.trim) {
            var ts = els(c.trim.s), tf = c.trim.f ? $(c.trim.f) : null;
            applyTrim = function () {
              var s = Math.max(0, Math.min(100, Math.min(st.ts, st.te)));
              var e = Math.max(0, Math.min(100, Math.max(st.ts, st.te)));
              var full = s <= 1e-4 && e >= 100 - 1e-4, empty = e - s <= 1e-4, i;
              for (i = 0; i < ts.length; i++) {
                var el = ts[i];
                if (full) { el.style.strokeDasharray = "none"; el.style.strokeDashoffset = "0"; el.style.visibility = ""; }
                else if (empty) { el.style.visibility = "hidden"; }
                else { el.style.visibility = ""; el.style.strokeDasharray = (e - s) + " 200"; el.style.strokeDashoffset = String(-s); }
              }
              if (tf) {
                if (full) { var d = ""; for (i = 0; i < ts.length; i++) d += ts[i].getAttribute("d"); tf.setAttribute("d", d); }
                else tf.setAttribute("d", empty ? "" : trimPoly(ts, s, e));
              }
            };
            def("ts", 0, applyTrim); def("te", 100, applyTrim);
          }
          if (c.geo) {
            var ge = els(c.geo.e), applyGeo;
            if (c.geo.k === "rect") {
              applyGeo = function () {
                var w = Math.abs(st.w), h = Math.abs(st.h), rr = Math.min(c.geo.r, w / 2, h / 2);
                for (var i = 0; i < ge.length; i++) {
                  var el = ge[i];
                  el.setAttribute("x", -w / 2); el.setAttribute("y", -h / 2);
                  el.setAttribute("width", w); el.setAttribute("height", h);
                  el.setAttribute("rx", rr); el.setAttribute("ry", rr);
                }
              };
            } else {
              applyGeo = function () {
                var d = ellD(st.w, st.h);
                for (var i = 0; i < ge.length; i++) ge[i].setAttribute("d", d);
                if (applyTrim) applyTrim();
              };
            }
            def("w", 0, applyGeo); def("h", 0, applyGeo);
          }
          if (c.fc) { var fce = els(c.fc); def("fc", "#000000", function () { for (var i = 0; i < fce.length; i++) fce[i].style.fill = st.fc; }); }
          if (c.fo) { var foe = els(c.fo); def("fo", 100, function () { for (var i = 0; i < foe.length; i++) foe[i].style.fillOpacity = st.fo / 100; }); }
          if (c.so) { var soe = els(c.so); def("so", 100, function () { for (var i = 0; i < soe.length; i++) soe[i].style.strokeOpacity = st.so / 100; }); }
        }
        var C = [];
        for (var ci = 0; ci < D.ctl.length; ci++) C.push(new Ctl(D.ctl[ci]));
        function vars(names, vals) { var o = {}; for (var i = 0; i < names.length; i++) o[names[i]] = vals[i]; return o; }
        for (var ti = 0; ti < D.tw.length; ti++) {
          var tw = D.tw[ti], target = tw[0] === 0 ? $(tw[1]) : C[tw[1]], names = tw[2], segs = tw[3];
          for (var si = 0; si < segs.length; si++) {
            var sg = segs[si], to = vars(names, sg[3]);
            to.duration = sg[1];
            to.ease = ease(sg[4]);
            to.immediateRender = si === 0;
            tl.fromTo(target, vars(names, sg[2]), to, sg[0]);
          }
        }
        tl.seek(0);
        window.__timelines = window.__timelines || {};
        window.__timelines["main"] = tl;
"""


def main(argv):
    if len(argv) != 3:
        sys.stderr.write("usage: python3 -I tools/spec_to_hf.py spec.json index.html\n")
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        spec = json.load(fh)
    try:
        b = Builder(spec)
        out = b.build()
    except SpecError as e:
        sys.stderr.write("spec_to_hf: error: %s\n" % e)
        return 1
    with open(argv[2], "w", encoding="utf-8") as fh:
        fh.write(out)
    for w in b.warnings:
        sys.stderr.write("spec_to_hf: warning: %s\n" % w)
    sys.stdout.write("spec_to_hf: wrote %s (%d layers, %d controllers, %d tracks, %d media, %.2f s)\n" % (
        argv[2], b.n, len(b.ctls), len(b.tweens), b.media_n, b.dur))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
