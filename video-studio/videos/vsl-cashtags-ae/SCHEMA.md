# Edit spec (`spec.json`): one source for the After Effects build and the HTML preview

`tools/build_spec.py` writes `spec.json`. Two back ends read it:

| Back end | Files | Output |
| --- | --- | --- |
| After Effects | `tools/ae_interpreter.jsx` (static ExtendScript interpreter) + `tools/assemble_jsx.py` | `ae/CASHTAGS_VSL_Build.jsx` = `var SPEC = <spec.json>;` + interpreter. Run in AE via File > Scripts > Run Script File. It builds and saves `ae/CASHTAGS_VSL.aep`. |
| HTML preview | `tools/spec_to_hf.py` | HyperFrames `index.html`, rendered to MP4 for review. |

Both back ends must produce the same picture from the same spec. **No back end may invent design**: everything visual comes from the spec.

## Units and conventions

- Time: seconds (float), already frame-aligned to 1/30 s by the generator. A keyframe or in/out time is in the time of the **comp that contains the layer**.
- Space: pixels. Comp space has its origin at top-left and y pointing down. Angles are degrees, clockwise.
- Colours: `"#RRGGBB"` strings. Opacity: 0–100. Scale: percent `[sx, sy]`.
- Fonts: PostScript names, all Inter static OTFs shipped in `ae/Fonts` and `assets/fonts`:
  `Inter-Regular` (CSS weight 400), `Inter-Medium` (500), `Inter-SemiBold` (600), `Inter-Bold` (700), `Inter-ExtraBold` (800), `Inter-Black` (900).
- Inter vertical metrics: unitsPerEm 2048, ascender 1984 (0.96875 em), descender 494 (0.2412 em), cap height 1490 (0.7275 em).

## Animatable values

Any property marked *anim* is either a static value, or:

```json
{"k": [[t0, v0, "out"], [t1, v1, "inout"], [t2, v2]]}
```

- Each entry is `[time, value, ease]`.
- `ease` names the easing of the **segment that starts at this key**. It defaults to `"out"`; the last key's ease is ignored.
- Values have the same shape as the static value (number, `[x, y]`, `"#hex"`, `[x0, y0, x1, y1]` for mask rects).
- Before the first key the property holds the first value. After the last key it holds the last value.

Eases are AE temporal ease with speed 0 at both keys, given as (outgoing influence % at the start key, incoming influence % at the end key). In CSS terms each segment is `cubic-bezier(out/100, 0, 1 - in/100, 1)`.

| ease | out % | in % | cubic-bezier |
| --- | --- | --- | --- |
| `out` (decelerate, default) | 10 | 80 | (0.10, 0, 0.20, 1) |
| `in` (accelerate) | 80 | 10 | (0.80, 0, 0.90, 1) |
| `inout` | 70 | 70 | (0.70, 0, 0.30, 1) |
| `soft` (AE Easy Ease) | 33.33 | 33.33 | (0.333, 0, 0.667, 1) |
| `linear` | — | — | linear (AE LINEAR interpolation on both sides) |
| `hold` | — | — | value jumps at the next key's time (AE HOLD outgoing) |

In AE a middle key gets its *in* ease from the previous segment and its *out* ease from the next one. Position keys always get straight spatial paths: zero spatial tangents, auto-bezier off.

## Document

```json
{
  "version": 1,
  "name": "CASHTAGS_VSL",
  "fps": 30,
  "main": "main",
  "folders": ["01 Main", "02 Moments", "03 Cards", "04 Footage", "05 Images", "06 Audio"],
  "assets": [ASSET, ...],
  "comps": [COMP, ...],
  "render": {"comp": "main", "output": "CASHTAGS_VSL_1080p30"},
  "markers": [[t, "comment"], ...]
}
```

- `comps` are listed **children first**: a comp only references comps listed before it.
- `markers` are comp markers on the main comp (AE `CompItem.markerProperty`). The HTML back end ignores them.

### ASSET

```json
{"id": "vsl", "type": "footage|image|audio", "file": "Footage/VSL.mp4", "preview": "assets/footage/VSL.mp4",
 "width": 1920, "height": 1080, "duration": 76.81, "folder": "04 Footage"}
```

- `file` is relative to the AE package root (`ae/`).
- `preview` is relative to the HyperFrames project root.
- `width` and `height` are given for footage and images.

### COMP

```json
{"id": "m03", "name": "M03 Book reveal", "folder": "02 Moments", "width": 1920, "height": 1080,
 "duration": 4.2, "bg": "#0A1F44", "layers": [LAYER, ...]}
```

- `layers` are listed **bottom to top** (painting order). In AE each `add` puts the new layer on top, so adding in list order is correct. In HTML, DOM order is painting order.
- A comp clips its content to its own `width` x `height`, as AE precomps do. In HTML that's a box with `overflow: hidden`.
- `bg` is only the AE composition background colour (`comp.bgColor`). It is **never rendered**: AE does not render a precomp's background, and in the main comp the stage is a real layer. The HTML back end must not paint it.

### LAYER (common fields)

| field | meaning |
| --- | --- |
| `name` | unique within the comp; becomes the AE layer name |
| `type` | `rect`, `ellipse`, `path`, `text`, `image`, `footage`, `audio`, `comp` |
| `in`, `out` | visible from `in` (inclusive) to `out` (exclusive), in containing-comp time. Required. |
| `start` | footage, audio and comp only: containing-comp time at which source time 0 plays (AE `startTime`). Defaults to 0 for footage and audio, and to `in` for comp layers. Source time at the in point = `in - start`. |
| `anchor` | `[x, y]` in layer space (static). Defaults are per type, below. |
| `position` | *anim* `[x, y]` in containing-comp space: where the anchor lands |
| `scale` | *anim* `[sx, sy]` %, around the anchor. Default `[100, 100]`. |
| `rotation` | *anim* degrees, around the anchor. Default 0. |
| `opacity` | *anim* 0–100. Default 100. |
| `shadow` | optional `{"color", "opacity", "direction", "distance", "softness"}`. AE: Drop Shadow effect on the layer (opacity in %, direction 180 = straight down). HTML: `filter: drop-shadow(dx dy blur rgba)` on the layer box, with `dx = distance*sin(dir)`, `dy = -distance*cos(dir)`, `blur = softness/2`. |
| `blur` | optional *anim* blurriness px. AE: Gaussian Blur effect, Repeat Edge Pixels off. HTML: `filter: blur(blurriness/2 px)`. |
| `mask` | footage and comp only: `{"rect": anim [x0, y0, x1, y1] in layer space, "radius": r}`. AE: one Add mask whose path is a rounded rectangle (4 straight edges, 4 bezier corners, kappa 0.5523; the same vertex count at every key so it interpolates). HTML: `clip-path: inset(y0 (W-x1) (H-y1) x0 round r)` on the layer's source box. |

Transform model (identical in both back ends):

```
comp_point = position + Rotate(rotation) * Scale(scale) * (layer_point - anchor)
```

Defaults when `position` / `anchor` are omitted:

| type | layer space | default anchor | default position |
| --- | --- | --- | --- |
| rect, ellipse | shape centred on the layer origin (0, 0) | [0, 0] | required |
| path | the path's own coordinates | [0, 0] | [0, 0], so path points are comp coordinates |
| text | origin = first line's baseline at the justification point (left edge / centre / right edge) | [0, 0] | required |
| image, footage | 0..width, 0..height | [w/2, h/2] | comp centre |
| comp | 0..comp width, 0..comp height | [w/2, h/2] | containing-comp centre |

### Type-specific fields

**rect**

- `size`: *anim* `[w, h]`.
- `radius`: corner roundness px (static).
- `fill`: *anim* `"#hex"` or `null`; `fillOpacity`: *anim* (default 100).
- `stroke`: `"#hex"` or `null`; `strokeWidth`: number; `strokeOpacity`: *anim* (default 100).
- AE: one shape layer, one group holding Rect, then Stroke, then Fill (so the stroke draws above the fill). Stroke is centred on the path. HTML: SVG `<rect>` centred on the origin, same stroke model.

**ellipse**

- `size`: *anim* `[w, h]`.
- `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`: as for rect.
- `lineCap`: `butt` (default), `round` or `square`.
- `trim`: optional `{"start": anim %, "end": anim %}`.
- The path starts at 12 o'clock and runs clockwise, as in AE. AE adds Trim Paths between the shape and the stroke. HTML: SVG path from the top, clockwise, `pathLength="100"`, `stroke-dasharray: (end-start) 100`, `stroke-dashoffset: -start`.

**path**

- `paths`: list of `{"v": [[x, y], ...], "i": [[dx, dy], ...], "o": [[dx, dy], ...], "closed": bool}`.
  - `i` / `o` are bezier in / out tangents relative to each vertex, as in AE `Shape.inTangents` / `outTangents`. Omitted means all zero (straight segments).
  - SVG equivalent of segment k → k+1: `C (v_k + o_k) (v_{k+1} + i_{k+1}) v_{k+1}`.
- `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`, `lineCap` (`butt` default), `lineJoin` (`miter`, `round` default, `bevel`).
- `trim`: optional, applies to every path in the layer simultaneously.
- AE: one shape layer, one group holding all path shapes, then Trim (if any), then Stroke, then Fill.

**text**

| field | meaning |
| --- | --- |
| `text` | string; `\n` separates lines (AE uses `\r`) |
| `font` | PostScript name |
| `size` | px |
| `color` | static `"#hex"` |
| `tracking` | AE tracking in 1/1000 em (CSS `letter-spacing: tracking/1000 em`); default 0 |
| `justify` | `left`, `center` or `right` |
| `leading` | baseline-to-baseline px (AE `autoLeading=false`, `leading`; CSS `line-height`); default `round(size * 1.2)` |
| `karaoke` | optional `{"dim": "#hex", "times": [t_word0, t_word1, ...]}`, defined below |

`karaoke`: the text is split on single spaces into words, and `times` has one entry per word (containing-comp time). Word *i* is drawn in `dim` until `times[i]`, then in `color`.
- AE: Text Animator with Fill Color = `dim`. Range Selector Advanced: Units = Index, Based On = Words, Shape = Square. End = word count (static). Start keyframes are HOLD: 0 at time 0, `i+1` at `times[i]`.
- HTML: one span per word, with a `color` set at `times[i]`.

**image** — `asset` (asset id).

**footage**

- `asset`, `start`.
- `audio`: true / false (false = mute the layer).
- `audioLevels`: dB, static or *anim*.
- `mask`: optional, as above.
- HTML: `<video>` with `data-start` = absolute root time of `in`, `data-duration` = `out - in`, `data-media-start` = `in - start`, `data-has-audio`, and `data-volume` = 10^(dB/20) (first key if animated).

**audio** — `asset`, `start`, `audioLevels`, as for footage. HTML: `<audio>`.

**comp** — `comp` (comp id), `start`, `mask` (optional).

## Back-end requirements

**AE interpreter (`tools/ae_interpreter.jsx`)**

- ExtendScript ES3 only: no `let`/`const`, arrow functions, template strings, `Array.prototype.map/forEach/indexOf`, or `JSON`.
- Wrapped in an IIFE inside `app.beginUndoGroup` / `app.endUndoGroup`.
- Package root is `File($.fileName).parent`. Missing footage gets one `File.openDialog` prompt; any other missing asset is skipped with a warning.
- Builds a new project (`app.newProject()`; abort cleanly if the user cancels the save prompt). Creates folders, imports assets, and creates comps in spec order. Adds layers bottom→top and sets every field.
- Each layer is built inside `try/catch`. A failure adds a warning and the build continues. Optional features (shadow, blur, karaoke, mask) each get their own `try/catch`.
- Adds markers, adds the main comp to the Render Queue (try the H.264 output-module template, fall back to the default), saves `CASHTAGS_VSL.aep` next to the script, writes `build_log.txt`, and alerts a summary.
- Must pass `tools/mock_ae/run.js` (a Node mock of the AE DOM that validates matchNames, the property tree, value shapes, ease-array lengths and the timing order `startTime` → `inPoint` → `outPoint`).

**HTML back end (`tools/spec_to_hf.py`)**

- Static DOM for every layer, and one paused GSAP timeline registered as `window.__timelines["main"]` on root `data-composition-id="main"`.
- Absolute times are computed by walking comp-layer offsets.
- Each layer is hidden outside `[in, out)` (absolute), via `tl.set` on `visibility`.
- Custom cubic-bezier ease functions match the table above.
- `@font-face` for each Inter OTF under `assets/fonts`, and local GSAP at `assets/vendor/gsap.min.js`.
- Deterministic: no `Math.random` or `Date`.
- `npx --yes hyperframes@0.8.149 lint` must pass with 0 errors.
