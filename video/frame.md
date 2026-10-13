# frame.md — Avatar Video 1 (MoonShot coaching reel)

Design truth for every scene. Concept: **"Mirror of the future"** — the coach asks the viewer to
picture their future self. Every cutaway is a glimpse into that future: deep-indigo night, violet
light, and amber for the moment of truth. Motion feels like a polished After Effects edit: layered
depth, fast confident entrances with overshoot, motion blur on speed, light sweeps on landings.

## Canvas

- 1080 × 1920 portrait, 25 fps. Scene roots use `width:100%; height:100%` (never hardcoded px).
- **Stage (all scene content): x 60–1020, y 120–1120.** Anchor the hero high (y ≈ 300–650).
- **Caption band y 1150–1480 is reserved** — the orchestrator draws captions there on top of
  every scene. Never place text, cards, icons or heroes in it.
- **y 1480–1920**: only the scene's background ground/glow/grid continues (platform UI covers it).

## Palette

| Token        | Hex       | Use                                                     |
| ------------ | --------- | ------------------------------------------------------- |
| `canvas`     | `#0B0820` | base ground (deep indigo-black)                         |
| `panel`      | `#151036` | cards, phone screens                                    |
| `raised`     | `#221A52` | raised surfaces, ground glow core                       |
| `violet`     | `#8C2FC2` | brand primary: glows, rings, borders                    |
| `violet-hi`  | `#B26BE8` | thin strokes, outlines, grid lines (at 10–25% opacity)  |
| `amber`      | `#FEB022` | hero accent: the moment of truth, positive, focal words |
| `amber-soft` | `#FFD27A` | amber highlights, glow cores                            |
| `cream`      | `#FDF2E0` | primary text on dark                                    |
| `mute`       | `#9A96B2` | secondary text, metadata                                |
| `red`        | `#FF4D5E` | crash / harsh voice / negative only                     |
| `magenta`    | `#A94271` | secondary accent (sparingly)                            |

One accent per moment: amber is the focal colour; red appears only for the negative beats.

## Type (all bundled with HyperFrames — no `@font-face` needed, no other fonts)

| Voice     | Family          | Weights       | Use                                                            |
| --------- | --------------- | ------------- | -------------------------------------------------------------- |
| Statement | `Archivo Black` | 400 only      | hero words, years, stats, stamps — 120–260px, tracking −0.03em |
| UI        | `Montserrat`    | 700, 900      | labels, pills, buttons — 30–48px, labels uppercase +0.14em     |
| Data      | `JetBrains Mono`| 400, 700      | dates, metadata chips, percentages — 28–40px                   |

- Never put a font-weight other than 400 on Archivo Black.
- No currency glyphs (₹, $) as text: balances are digits, bullets or "?" only.
- No emoji (no emoji font on the render machine).

## Ground (every cutaway, a full-duration `class="clip"` layer at the lowest track)

- Fill `#0B0820` + radial gradient centred (540, 620): `#221A52` → `#0B0820` at 70%.
- One violet glow blob (`#8C2FC2`, ~900px, blur 120px, opacity 0.35) drifting slowly; one small amber
  glow (`#FEB022`, ~420px, opacity 0.16) near the hero.
- Perspective grid or hairline grid in `violet-hi` at 10–14% opacity, slow drift.
- Static SVG grain (feTurbulence) overlay at 6–8% opacity.
- No full-frame linear gradients (they band in H.264).

## Components

- **Card**: `linear-gradient(160deg, rgba(34,26,82,.94), rgba(21,16,54,.94))`, border 3px solid
  `rgba(178,107,232,.38)`, radius 36px, 1px inner top highlight `rgba(255,255,255,.08)`,
  shadow `0 40px 90px rgba(0,0,0,.5)`.
- **Pill label**: Montserrat 700, 30–34px uppercase, letter-spacing .14em, padding 14px 28px,
  radius 999px, 2px border; amber pill = amber border + amber text on `rgba(254,176,34,.10)`.
- **Phone**: ~470×940, radius 64px, `#0E0A26` body, 10px bezel `#1B1440`, glossy diagonal sheen,
  screen `#151036`. Must sit entirely inside the stage (y ≤ 1120).
- **Glow text**: amber words carry `text-shadow: 0 0 40px rgba(254,176,34,.45)`.

## Motion language (After Effects feel, seek-safe GSAP)

- Entrances 0.35–0.7s, combined transforms (scale + y/x + rotation + blur), eases `expo.out`,
  `power4.out`, `back.out(1.6)`; vary eases and directions within a scene.
- Motion blur on any fast move: `filter: blur()` peaks mid-move, resolves on landing.
- Light sweep: one diagonal sheen crosses a card or hero word right after it lands.
- Depth: background layers drift slower than foreground; the whole stage does a slow camera push
  (scale 1.00 → 1.04) across the scene.
- Ambient motion on every decorative (breathe, drift, rotate) — finite, deterministic.
- Hero visible by t ≤ 0.5s. Reveal content on the voiceover cues across the whole scene.
- **No exit animations**: the host's transition (zoom-blur) takes each cutaway in and out.
- GSAP is loaded once by the host `index.html`; scenes use the global `gsap` and never load it.
