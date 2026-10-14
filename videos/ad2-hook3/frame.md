# frame.md — Ad 2 (Hook 3): "Trading is just like garba"

Design truth for every scene. Concept: **"Change your steps with the song"** — a Navratri night
where the market is the music: when the rhythm changes, the steps change. Warm festive light on
deep maroon night, marigold and gold for the moment of truth. Motion feels like a polished After
Effects edit: layered depth, spinning mandala rings, light bokeh, confident entrances with
overshoot, motion blur on speed, light sweeps on landings.

## Canvas

- 1080 × 1920 portrait, 30 fps. Scene roots use `width:100%; height:100%`.
- **Stage (all scene content): x 60–1020, y 120–1120.** Anchor the hero high (y ≈ 300–700).
- **Caption band y 1150–1480 is reserved** for the host's captions. Nothing important there.
- **y 1480–1920**: background ground/glow/pattern only (platform UI covers it).

## Palette

| Token      | Hex       | Use                                                   |
| ---------- | --------- | ----------------------------------------------------- |
| `canvas`   | `#1A0509` | base ground (deep maroon-black night)                 |
| `maroon`   | `#4A0A14` | panels, ground glow core                              |
| `crimson`  | `#C8102E` | festive primary: rings, borders, glows                |
| `marigold` | `#FF9F1C` | hero accent: focal words, highlights                  |
| `gold`     | `#FFC93C` | light, mirror-work sparkles, glow cores               |
| `cream`    | `#FFF4E0` | primary text on dark                                  |
| `magenta`  | `#E5007D` | secondary festive accent (sparingly)                  |
| `teal`     | `#12B3A8` | peacock accent (sparingly, max one element per scene) |
| `up`       | `#2BD27A` | uptrend only                                          |
| `down`     | `#FF3B4E` | downtrend / loss only                                 |

## Type (bundled with HyperFrames — no `@font-face`, no other fonts)

| Voice     | Family           | Weights  | Use                                                     |
| --------- | ---------------- | -------- | ------------------------------------------------------- |
| Statement | `Archivo Black`  | 400 only | hero words, numbers, stamps — 120–240px, tracking −0.03em |
| UI        | `Montserrat`     | 700, 900 | labels, chips, buttons — 30–48px, labels uppercase +0.14em |
| Data      | `JetBrains Mono` | 400, 700 | small metadata chips — 28–36px                          |

No currency glyphs, no emoji, no non-Latin script (no Devanagari font on the render machine).

## Ground (every cutaway: a full-duration `class="clip"` layer at the lowest track)

- Fill `#1A0509` + radial gradient centred (540, 620): `#4A0A14` → `#1A0509` at 72%.
- String-light bokeh: 20–40 soft gold/marigold dots (seeded positions) drifting slowly, some
  twinkling (opacity from a time-based sine, deterministic).
- One crimson glow blob (opacity ~0.35) and one gold glow near the hero (~0.18).
- A large faint mandala / rangoli ring (SVG, crimson/gold at 10–16% opacity) rotating slowly.
- Static SVG grain at 6% opacity. No full-frame linear gradients.

## Motifs (draw them as SVG; keep them stylised, festive, clean)

- **Garbo**: a round clay pot with rows of small holes glowing gold from a flame inside.
- **Dancers**: graceful silhouettes in flared chaniya choli, arms raised with dandiya sticks,
  in a circle; animate a sway / step cycle (keyframed poses, deterministic).
- **Dandiya sticks**: two crossed decorated sticks; a click spark where they meet.
- **Mirror-work dots** (small gold circles with a white glint) as scatter accents.
- **Footprint steps** for "steps"; **music notes / waveform** for songs and rhythm.

## Components

- **Card**: `linear-gradient(160deg, rgba(74,10,20,.95), rgba(26,5,9,.95))`, 3px border
  `rgba(255,159,28,.45)`, radius 34px, shadow `0 40px 90px rgba(0,0,0,.55)`, a thin gold
  inner line, optional bandhani dot pattern at 8% in a corner.
- **Chip / pill**: Montserrat 700 30–34px uppercase, +0.14em, radius 999px, 2px marigold border.
- **Glow text**: marigold words carry `text-shadow: 0 0 40px rgba(255,159,28,.5)`.

## Motion language (seek-safe GSAP)

- Entrances 0.35–0.7s, combined transforms, eases `expo.out`, `power4.out`, `back.out(1.7)`.
- Motion blur on fast moves; a light sweep after each hero lands.
- Every decorative moves (rotate, drift, twinkle). Slow camera push 1.00 → 1.04 per scene.
- Hero visible by t ≤ 0.5s; reveal content on the voiceover cues across the whole scene.
- No exit animations (the host transitions each cutaway in and out).
- GSAP (and Three.js) are loaded once by the host `index.html`; scenes never load GSAP.
