# frame.md — Avatar Video 2: "Rewrite your money story"

Design truth for every scene. Concept: **"Rewrite your money story"** — every cutaway is a page
from the viewer's inner money story: the beliefs installed in childhood, the strings they pull, and
the moment you question them and write a new habit. Deep plum night, magenta light that echoes the
coach's saree, gold for money and for the moment of truth, red only for limiting beliefs. Motion
feels like a polished After Effects edit: layered depth, confident entrances with overshoot,
motion blur on speed, light sweeps on landings, everything breathing.

## Canvas and layout (v2: face-safe overlays, Instagram Reels safe zones)

The user's rules: **an animation may never cover the coach's face**, and every graphic follows
**Instagram's Reels safe-zone guidance** (Meta: keep the top 14%, bottom 35% and 6% of each side
free of text, logos and key elements, because the Reels UI covers them).

- 1080 × 1920 portrait, 25 fps. Scene roots use `width:100%; height:100%`.
- **Every scene is a TRANSPARENT overlay** over the speaker footage: no full-bleed ground, no
  full-frame vignette. The footage stays visible everywhere outside the cards.
- **Instagram safe area:** all text, cards, icons and key elements inside **x 65–1015, y 270–1248**.
- **FACE ZONE, never covered** — not by cards, glows, particles, strings, motion trails or entrances
  passing through: **x 360–670, y 500–870** (her face spans x≈395–635, y≈570–825 across the clip;
  the zone includes hair and the host's punch-ins up to 1.12×).
- **Overlay zones** (put content only here):
  - TOP band: x 65–1015, y 270–490 (the hero line / headline visual)
  - LEFT rail: x 65–345, y 500–1020
  - RIGHT rail: x 685–1015, y 500–1020
  - LOWER band: x 65–1015, y 880–1020 (below her chin)
- **Caption band y 1030–1248 is host-owned** (captions), except during c4-old-beliefs, which
  replaces the captions and may use it.
- **Legibility over footage:** every text sits on a card (frame.md card at ≥0.85 opacity) or a
  soft dark scrim confined to its zone. Glows stay inside the zones.
- Entrances come from the canvas edges or grow in place inside a zone; nothing travels across the
  face zone. The host fades each overlay in and out (0.22 s); scenes still need no exit animation.

## Palette

| Token        | Hex       | Use                                                       |
| ------------ | --------- | --------------------------------------------------------- |
| `canvas`     | `#12061A` | base ground (deep plum-black)                             |
| `panel`      | `#1E0D2B` | cards, bubbles                                            |
| `raised`     | `#2E1240` | raised surfaces, ground glow core                         |
| `magenta`    | `#E0218A` | brand primary (the saree): glows, rings, borders          |
| `magenta-hi` | `#FF5FB0` | thin strokes, outlines, grid lines (10–25% opacity)       |
| `gold`       | `#FFC24A` | hero accent: money, the moment of truth, focal words      |
| `gold-soft`  | `#FFE1A0` | gold highlights, glow cores, coin rims                    |
| `cream`      | `#FFF5EA` | primary text on dark                                      |
| `mute`       | `#A99BB5` | secondary text, metadata                                  |
| `red`        | `#FF4D5E` | limiting beliefs / negative only                          |
| `teal`       | `#1FB5C9` | cool accent (the chair), max one element per scene        |

One accent per moment: gold is the focal colour; red appears only on the limiting-belief beats.

## Type (bundled with HyperFrames — no `@font-face`, no other fonts)

| Voice     | Family           | Weights  | Use                                                         |
| --------- | ---------------- | -------- | ----------------------------------------------------------- |
| Statement | `Archivo Black`  | 400 only | hero words, numbers, stamps — 120–240px, tracking −0.03em  |
| UI        | `Montserrat`     | 700, 900 | labels, chips, buttons — 30–48px, labels uppercase +0.14em  |
| Data      | `JetBrains Mono` | 400, 700 | progress readouts, counters, metadata chips — 28–40px       |

No currency glyphs (no ₹ $ €) — money is coins, notes and gold light. No emoji. No arrow/triangle
glyphs from fonts: draw icons as inline SVG.

## Ground (v1 full-screen cutaways only; v2 overlays have NO ground — use card fills instead)

- Fill `#12061A` + radial gradient centred (540, 620): `#2E1240` → `#12061A` at 72%.
- One magenta glow blob (`#E0218A`, ~900px, blurred, opacity ~0.30) drifting slowly; one gold glow
  (`#FFC24A`, ~420px, opacity ~0.16) near the hero.
- Floating gold dust: 20–36 small soft dots (seeded positions) drifting up slowly, some twinkling
  (opacity from a time-based sine — deterministic).
- Hairline grid or concentric rings in `magenta-hi` at 8–12% opacity, slow drift or rotation.
- Static SVG grain at 6% opacity. No full-frame linear gradients (they band in H.264).

## Motifs (inline SVG, stylised, clean, premium)

- **Coin**: gold disc (radial gradient `#FFE1A0` → `#FFC24A` → `#B8801C`), raised rim ring, an
  embossed star or lotus in the centre (no currency glyph), a white specular glint.
- **Note**: rounded rectangle in soft green-gold with a guilloche/oval pattern, no text or glyphs.
- **Head profile**: a clean side-view silhouette outline in magenta-hi, filled panel colour.
- **Speech bubble**: panel card with a tail, cream text inside, quote marks drawn as shapes.
- **Chain / padlock**, **puppet strings** (thin gold-cream lines with a glint travelling along them),
  **magnifying glass**, **habit loop** (circular arrow), **staircase / rising arrow**, **calendar page**.

## Components

- **Card**: `linear-gradient(160deg, rgba(46,18,64,.95), rgba(30,13,43,.95))`, 3px border
  `rgba(255,95,176,.40)`, radius 34px, 1px inner top highlight `rgba(255,255,255,.08)`,
  shadow `0 40px 90px rgba(0,0,0,.55)`.
- **Chip / pill**: Montserrat 700 30–34px uppercase, +0.14em, radius 999px, 2px border;
  gold chip = gold border + gold text on `rgba(255,194,74,.10)`; red chip likewise in red.
- **Glow text**: gold words carry `text-shadow: 0 0 40px rgba(255,194,74,.5)`.

## Motion language (seek-safe GSAP)

- Entrances 0.35–0.7s, combined transforms (scale + x/y + rotation + blur), eases `expo.out`,
  `power4.out`, `back.out(1.7)`; vary eases and directions within a scene.
- Motion blur on any fast move (`filter: blur()` peaks mid-move, resolves on landing).
- Light sweep: one diagonal sheen crosses a card or hero word right after it lands.
- Depth: background layers drift slower than foreground; slow camera push 1.00 → 1.04 per scene.
- Ambient motion on every decorative (breathe, drift, rotate, twinkle) — finite, deterministic.
- Hero visible by t ≤ 0.5s; reveal content on the voiceover cues across the whole scene.
- No exit animations (the host transitions each cutaway in and out).
- GSAP is loaded once by the host `index.html`; scenes use the global `gsap` and never load it.
