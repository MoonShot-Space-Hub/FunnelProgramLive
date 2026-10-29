# Higgsfield Prompt Package: Luxury Silk Scarf, New York (20 s, 9:16)

This is a ready-to-run production package for the five-scene storyboard in
`source/storyboard.jpg`. It covers the clean reference frames, the start-frame
prompts, the image-to-video prompts for all ten shots, the edit timings, the
music and ambience direction, and the QC pass.

> **Status:** no footage has been generated yet. The Higgsfield connector in
> this session can read the model catalogue, your credits and your generation
> history, but it cannot start generations or upload files. Every generation
> below has to be run in the Higgsfield app. Once the clips exist,
> `edit/assemble.py` cuts them into the final MP4.

---

## 0. Order of operations

1. **Reference frames are already cut.** See `reference-frames/` and the
   contact sheet `reference-frames/_contact_sheet.jpg`. They contain photography
   only, with no storyboard borders, headings, notes or "YOUR LOGO HERE" card.
   **Never upload `source/storyboard.jpg` itself to Higgsfield.**
2. **Phase A: build 9:16 start frames** with Nano Banana Pro (section 3). Do
   the three identity anchors first (F02, F06, F09), then reuse them as
   references for the other frames of the same model.
3. **Phase B: animate** each start frame (section 4). Generate 5 s per take,
   make 2–4 takes per shot, and keep the best window.
4. **QC** every take against section 6 before it goes into the edit.
5. **Phase C: edit.** Download each chosen take as `clips/<SHOT>.mp4`, update
   the in-points in `edit/shots.csv`, then run `edit/assemble.py` (section 5).

### Settings cheat sheet

| Use | Higgsfield model (catalogue id) | Settings |
|---|---|---|
| Start frames | **Nano Banana Pro** (`nano_banana_pro`) | Aspect **9:16**, resolution **2K** (4K for F04/F12 if you can), image references as listed per frame |
| Human motion: walking, turning, gestures | **Kling 3.0** (`kling3_0`) | Mode **pro** (1080p), aspect **9:16**, duration **5 s**, sound **off**, start frame (+ end frame for S5A), negative prompt = `NEG` below |
| Product-critical shots: fabric, hands, hero close-up | **Seedance 2.0** (`seedance_2_0`) | Mode **std**, resolution **1080p**, aspect **9:16**, duration **5 s**, bitrate **high**, generate audio **off**, start frame + image references |
| Optional slow-motion alternative for S2B | **Cinema Studio Video** (`cinematic_studio_video_v2`) | Start frame F04, aspect 9:16, speedramp **slowmo**, sound **off** |
| Optional rescue for soft or 720p takes | **Topaz** (`topaz_video`) | 1080p; frame interpolation only if a slow-motion take judders |

**Credits:** the workspace shows **7.4 credits** on the Ultimate plan.
Nano Banana Pro, Kling 3.0 and Seedance 2.0 are the models flagged in the
catalogue as supporting Higgsfield's **Unlim** mode, which is why this package
uses them. Before batching, check in the app that Unlim covers these models at
the resolutions above. If it doesn't, you'll need to top up: the plan is about
11 frames plus 10 shots × 2–4 takes.

**Seedance reference tags:** if your Seedance 2.0 screen asks you to tag
uploads in the prompt (`@Image1`, `@Image2`, …), number them in the order listed
under **Inputs**. The prompts call them "image 1", "image 2" and so on.

---

## 1. Bibles: paste these exactly, every time

Each prompt below contains the full text of the relevant bible, so every
generation describes the product and people with the same wording.

**SCARF:** a square silk-twill scarf: warm camel / golden-tan ground printed
with classic leopard rosettes (black broken-ring rosettes with caramel centres
plus small solid black spots, medium-small scale); every edge has a border made
of a cream band with about nine fine black pinstripes running parallel to the
hem and meeting in crisp square mitred corners, finished with a solid black
outer band at the hem; soft satin sheen, fluid lightweight drape; no logo, no
text on the scarf.

**MODEL 1 (Scenes 1, 2, 5):** a woman in her mid-20s with warm medium-tan skin,
high cheekbones, glossy nude-brown lips, long voluminous dark-brown hair with
soft caramel ends in loose waves and a centre part; narrow black rectangular
sunglasses; small gold hoop earrings. She wears a chocolate-brown tailored
oversized blazer with notch lapels, matching high-waisted wide-leg trousers, a
cream silk camisole, and carries a black structured leather top-handle bag in
her right hand. The scarf is tied at the base of her throat in a loose single
knot, its pointed ends hanging down the front over her left lapel.

**MODEL 2 (Scene 3):** a woman in her mid-20s with light warm-beige skin, a soft
oval face, full brows, warm brown eyes, mauve-nude lips and natural glowing
make-up; long voluminous dark-chocolate hair with subtle caramel highlights, a
deep side part and glossy waves past her shoulders; small gold huggie earrings;
a thin gold band ring on her left ring finger; short almond nude nails. She
wears an ivory / light-beige tailored blazer over a cream top. The scarf is tied
loosely at her neck with a soft knot, both ends hanging down her chest.

**MODEL 3 (Scene 4):** a woman in her mid-20s with fair warm skin and a light
dusting of freckles, hazel-green eyes, defined brows and nude-pink lips; long
wavy brunette hair with honey-caramel balayage and a side part; small gold hoop
earrings. She wears a black tailored blazer over a dark top. The scarf is tied as
a neckerchief with the knot slightly to one side and one end draped over her
shoulder.

**NYC STREET (Scenes 1, 2, 5):** a classic Manhattan brownstone block with
sandstone and red-brick townhouses, stoops and black wrought-iron railings,
autumn trees with golden leaves, parked yellow taxis softly out of focus, warm
low sun behind the model giving a golden rim light, gentle atmospheric haze.

**CAFÉ (Scene 3):** an elegant New York café / boutique storefront with a dark
wood frame, a large glass window with gold-leaf lettering kept soft and
unreadable, warm interior glow, golden-hour street light.

**BOUTIQUE WINDOW (Scene 4):** a boutique window on a Manhattan avenue with a
dark metal frame and reflective glass showing the street, warm bokeh lights.

**STYLE:** photorealistic luxury fashion commercial, cinema camera with 50 mm
and 85 mm spherical lenses, warm autumn golden-hour light, rich
chocolate-brown, camel and cream palette, soft creamy background bokeh,
natural skin texture, subtle 35 mm film grain, elegant restrained movement.

**NEG** (Kling's negative-prompt field; for Seedance, append as the
"Avoid:" line): text, captions, subtitles, logo, watermark, border, collage,
split screen, morphing pattern, shifting leopard spots, changing print,
stretched or warped stripes, broken border, scarf changing colour or size,
scarf detaching from the neck, floating fabric, extra fingers, fused fingers,
missing fingers, deformed hands, distorted face, face changing between frames,
identity drift, flicker, jitter, warping background, sudden camera moves, fast
zoom, cartoon, CGI look, plastic skin, oversaturated colours, background faces
in focus.

---

## 2. Reference frame index

| File | Use |
|---|---|
| `P00_PRODUCT_scarf_flatlay.jpg` | Product truth for print, border and colours. Attach to **every** frame and every Seedance shot |
| `P01_S1_model1_walk_wide.jpg` | Scene 1 walk, and Model 1's full outfit |
| `P02_S1_model1_portrait.jpg` | Model 1's face (identity anchor source) |
| `P03_S1_scarf_knot_detail.jpg` | Knot and border detail (optional extra reference) |
| `P04_S2_silk_flow_macro.jpg` | Scene 2 fabric macro |
| `P05_S2_model1_breeze.jpg` | Scene 2 breeze |
| `P06_S3_model2_cafe_medium.jpg` | Model 2's identity and Scene 3 medium shot |
| `P07_S3_model2_hands_knot.jpg` | Scene 3 hands |
| `P08_S3_border_fabric_detail.jpg` | Border and pinstripe close detail |
| `P09_S4_model3_medium_cu.jpg` | Model 3's identity and Scene 4 medium close-up |
| `P10_S4_model3_reflection.jpg` | Scene 4 reflection |
| `P11_S5_model1_walk_past.jpg` | Scene 5 look-back pose |
| `P12_S5_model1_scarf_closeup.jpg` | Scene 5 hero close-up |

The storyboard panels are small (about 200–480 px), so they were enlarged 3×
for upload. They work as **references**. The 2K Nano Banana Pro frames from
Phase A are what you animate.

---

## 3. Phase A: 9:16 start frames (Nano Banana Pro, 9:16, 2K)

Save each result as `frames/F##.png`. Reject any frame where the scarf print or
border differs from P00, or where the face differs from its anchor.

### F02: Model 1 identity anchor, also the S1B start frame (make first)
**Inputs:** ① `P02_S1_model1_portrait.jpg` ② `P01_S1_model1_walk_wide.jpg` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Create a single vertical 9:16 photograph of the woman in image 1, keeping her face, hair, sunglasses and earrings exactly the same; image 2 shows her full outfit. Framing: chest-up close-up, walking toward camera on a Manhattan brownstone sidewalk, chin slightly raised, confident calm expression. MODEL 1: a woman in her mid-20s with warm medium-tan skin, high cheekbones, glossy nude-brown lips, long voluminous dark-brown hair with soft caramel ends in loose waves and a centre part; narrow black rectangular sunglasses; small gold hoop earrings; chocolate-brown tailored oversized blazer with notch lapels, cream silk camisole. The scarf is tied at the base of her throat in a loose single knot, its pointed ends hanging down the front over her left lapel, and it must match image 3 exactly: a square silk-twill scarf, warm camel / golden-tan ground with classic leopard rosettes (black broken-ring rosettes with caramel centres plus small solid black spots, medium-small scale), a cream border band with about nine fine black pinstripes parallel to the hem meeting in square mitred corners, a solid black outer band at the hem, soft satin sheen. Background: brownstones, golden autumn trees and soft yellow taxi bokeh, warm low sun rim-lighting her hair. Photorealistic luxury fashion photography, 85 mm lens, shallow depth of field, natural skin texture, subtle film grain. One clean photograph: no text, no logo, no border, no collage.
```

### F01: S1A start frame (walk, medium-wide)
**Inputs:** ① `P01_S1_model1_walk_wide.jpg` ② `F02` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Recompose image 1 as a single vertical 9:16 photograph. The same woman as image 2 (identical face, hair, sunglasses, earrings) walks toward the camera mid-stride on a Manhattan brownstone sidewalk, framed head to knee, centred, camera at chest height. Outfit: chocolate-brown tailored oversized blazer, matching high-waisted wide-leg trousers, cream silk camisole, black structured leather top-handle bag in her right hand. The scarf is tied at the base of her throat in a loose single knot with its ends hanging over her left lapel, and it matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. Setting: sandstone and red-brick brownstones with stoops and black wrought-iron railings on the left, golden autumn trees overhead, softly blurred parked yellow taxis on the right; extend the street naturally above and below. Warm low golden-hour backlight, gentle haze, rich brown and camel palette, photorealistic, 50 mm lens, shallow depth of field, subtle film grain. No text, no logo, no border, no collage.
```

### F05: S2A start frame (breeze)
**Inputs:** ① `P05_S2_model1_breeze.jpg` ② `F02` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Single vertical 9:16 photograph. The same woman as image 2 (identical face, hair, sunglasses, gold hoops, chocolate-brown blazer, cream camisole) is framed from the waist up, walking along a sunlit Manhattan brownstone street, as in image 1. A gentle breeze lifts the loose end of the scarf out to her left side (frame right) in a soft wave while the knot stays snug at the base of her throat; her hair lifts slightly in the same direction. The scarf matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes meeting in square corners, a solid black hem band, and satin sheen catching the light. Warm golden-hour backlight, blurred brownstones and yellow taxi bokeh, photorealistic luxury fashion photography, 85 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F04: S2B start frame (silk macro, anchored to the model)
**Inputs:** ① `P04_S2_silk_flow_macro.jpg` ② `P08_S3_border_fabric_detail.jpg` ③ `P00_PRODUCT_scarf_flatlay.jpg` ④ `F05`

```text
Single vertical 9:16 macro photograph. The loose end of the silk scarf, still tied at the woman's neck (her chocolate-brown blazer shoulder and a few strands of dark hair visible in soft focus at the frame edge, as in image 4), lifts and curls in a soft breeze toward the camera, as in image 1. In sharp focus: the leopard field, the cream border band with about nine fine black pinstripes and the solid black hem, as in image 2; the fabric shows its fine twill weave and satin sheen highlights along the folds. The print scale, colours and stripe count are identical to image 3. Background: creamy golden-hour Manhattan street bokeh. Photorealistic product macro, 100 mm macro lens, very shallow depth of field, warm camel and chocolate palette. The fabric is clearly attached to the wearer and is not floating. No text, no logo, no border, no collage.
```

### F06: Model 2 identity anchor, also the S3A start frame
**Inputs:** ① `P06_S3_model2_cafe_medium.jpg` ② `P00_PRODUCT_scarf_flatlay.jpg`

```text
Recompose image 1 as a single vertical 9:16 photograph of the same woman, keeping her face, hair, make-up, earrings and ivory blazer exactly the same. MODEL 2: a woman in her mid-20s with light warm-beige skin, a soft oval face, full brows, warm brown eyes, mauve-nude lips, long voluminous dark-chocolate hair with subtle caramel highlights, a deep side part and glossy waves past her shoulders, small gold huggie earrings, a thin gold band on her left ring finger, an ivory / light-beige tailored blazer over a cream top. She stands outside an elegant New York café window, framed from the waist up, her left hand resting lightly on the scarf at her collarbone, gazing softly off-camera. The scarf is tied loosely with a soft knot, both ends hanging down her chest, and matches image 2 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. Café: dark wood frame, gold-leaf window lettering kept soft-focus and unreadable, warm interior glow. Golden-hour light, photorealistic, 85 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F07: S3B start frame (hands at the knot)
**Inputs:** ① `P07_S3_model2_hands_knot.jpg` ② `F06` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Single vertical 9:16 close-up of the same woman as image 2 (same skin tone, hair, nails and gold ring), framed from her lips to mid-chest, as in image 1. Both hands gently hold the scarf's knot at her throat, fingers relaxed and natural: exactly five fingers on each hand, natural knuckles, short almond nude nails, a thin gold band on her left ring finger, fingertips pressing softly into the silk so it creases under them. Ivory blazer lapels at the bottom of the frame, dark hair falling at the sides. The scarf matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band, and satin sheen. Warm window light, photorealistic beauty close-up, 100 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F09: Model 3 identity anchor, also the S4A start frame
**Inputs:** ① `P09_S4_model3_medium_cu.jpg` ② `P00_PRODUCT_scarf_flatlay.jpg`

```text
Recompose image 1 as a single vertical 9:16 photograph of the same woman, keeping her face, freckles, hair, earrings and black blazer exactly the same. MODEL 3: a woman in her mid-20s with fair warm skin and a light dusting of freckles, hazel-green eyes, defined brows, nude-pink lips, long wavy brunette hair with honey-caramel balayage and a side part, small gold hoop earrings, a black tailored blazer over a dark top. She stands chest-up beside a boutique window on a Manhattan avenue, body angled three-quarters, glancing toward the reflective glass at frame left. The scarf is tied as a neckerchief with the knot slightly to one side and one end over her shoulder, and matches image 2 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. Warm street bokeh, golden-hour light, photorealistic, 85 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F10: S4B start frame (reflection)
**Inputs:** ① `P10_S4_model3_reflection.jpg` ② `F09` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Single vertical 9:16 over-the-shoulder photograph, as in image 1. Foreground, in soft focus at frame right: the back of the woman's head, her honey-balayage hair and her black blazer shoulder with the scarf end over it. In sharp focus: her reflection in the boutique window glass — the same woman as image 2, same face, freckles, earrings and black blazer — touching the scarf at her neck with one hand. The reflection is a physically correct mirror image: hair part, knot position and earrings mirrored consistently with the foreground. The scarf matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. A dark metal window frame and Manhattan avenue reflected behind her as warm bokeh. Photorealistic, 50 mm lens. No text, no logo, no border, no collage.
```

### F11A: S5A start frame (approaching the camera)
**Inputs:** ① `P01_S1_model1_walk_wide.jpg` ② `F02` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Single vertical 9:16 photograph. The same woman as image 2 (identical face, sunglasses, hair, chocolate-brown suit, cream camisole, black bag) walks along the Manhattan brownstone sidewalk in a three-quarter front view, moving from frame right toward frame left, about to pass close beside the camera; framed head to hip. The loose end of the scarf begins to lift behind her shoulder in the breeze; the knot stays at her throat. The scarf matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. Golden autumn trees, stoops and iron railings, soft yellow taxi bokeh, warm low backlight. Photorealistic, 50 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F11B: S5A end frame (the look-back)
**Inputs:** ① `P11_S5_model1_walk_past.jpg` ② `F02` ③ `P00_PRODUCT_scarf_flatlay.jpg`

```text
Recompose image 1 as a single vertical 9:16 photograph. The same woman as image 2 (identical face, sunglasses, hair, chocolate-brown suit) has just walked past the camera and is seen from a three-quarter back view, turning her head back toward the lens over her shoulder with a subtle confident look. The loose end of the scarf trails behind her shoulder in a soft arc in the breeze. The scarf matches image 3 exactly: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes, a solid black hem band. Same brownstone street and light as image 2, with a café awning blurred in the background. Photorealistic, 50 mm lens, shallow depth of field. No text, no logo, no border, no collage.
```

### F12: S5B start frame (hero close-up with clean space for the end card)
**Inputs:** ① `P12_S5_model1_scarf_closeup.jpg` ② `F02` ③ `P00_PRODUCT_scarf_flatlay.jpg` ④ `P03_S1_scarf_knot_detail.jpg`

```text
Single vertical 9:16 close-up of the same woman as image 2, framed from her lips down to mid-chest, head turned slightly to frame left, gold hoop earring visible. The scarf knot sits in the upper-middle of the frame (between about 20% and 55% of the frame height) and shows the exact print in crisp detail, matching image 3: warm camel / golden-tan silk twill with classic black-and-caramel leopard rosettes, a cream border with about nine fine black pinstripes meeting in square corners, a solid black hem band, and satin sheen with a fine twill texture (knot detail as image 4). The lower 40% of the frame is calm and uncluttered: her chocolate-brown blazer lapel in soft shadow, leaving clean space for a logo and tagline. Warm golden side light, photorealistic luxury beauty close-up, 100 mm lens, shallow depth of field, subtle film grain. No text, no logo, no border, no collage.
```

---

## 4. Phase B: shot prompts (image-to-video)

Each shot runs at **9:16**, generates **5 s**, has sound **off**, and gets 2–4
takes. **Keep** is the window to use, measured from the start of the clip. It
starts at 0.5 s to skip the frozen opening frames many models produce. Shift it
in `edit/shots.csv` (`in_sec`) if a better moment falls elsewhere.

### Scene 1 (0–4 s): The New York fashion entrance

#### S1A: walk, medium-wide toward closer (00:00–02:12, 60 frames)
**Model:** Kling 3.0 pro · **Start frame:** F01 · **Negative:** NEG · **Keep:** 0.50–3.00 s

```text
The woman walks confidently toward the camera along the sunlit Manhattan brownstone sidewalk at a natural, unhurried pace: heel-toe footsteps, relaxed arm swing, the black leather bag in her right hand swinging gently with each step, shoulders level, chin slightly raised. Her long dark-brown hair and the loose end of the leopard silk scarf lift slightly in a light breeze; the knot stays fixed at the base of her throat and the leopard print and pinstriped border stay perfectly stable on the fabric. Camera: smooth Steadicam tracking shot moving backwards ahead of her, slowly pushing in from a head-to-knee medium-wide toward a waist-up framing over the shot. The brownstones, iron railings, golden autumn trees and blurred yellow taxis drift past with natural parallax. Warm low golden-hour backlight with rim light on her hair, rich chocolate-brown and camel palette, shallow depth of field, photorealistic luxury fashion commercial, subtle film grain.
```

#### S1B: walking portrait close-up (02:12–04:00, 36 frames)
**Model:** Kling 3.0 pro · **Start frame:** F02 · **Negative:** NEG · **Keep:** 0.50–2.00 s

```text
Close-up walking portrait of the same woman, framed chest-up: she keeps walking toward the camera with a subtle, natural head bob from her stride, a calm confident expression behind her black sunglasses, lips relaxed, one slow natural blink. Strands of hair move in the breeze; the scarf knot stays put against her chocolate-brown blazer and the loose end flutters gently, with the cream pinstriped border and black hem catching the light. Camera tracks backwards at her walking speed with a very slight push-in, perfectly smooth. Golden sunlight rims her hair, soft brownstone and autumn-tree bokeh behind. Photorealistic, natural skin texture, 85 mm lens look, subtle film grain.
```
*Edit note:* cut S1A → S1B on a footfall (match on action).

### Scene 2 (4–8 s): The silk in motion

#### S2A: breeze lifts the scarf (04:00–06:04, 52 frames)
**Model:** Seedance 2.0 std 1080p · **Inputs:** start frame F05; image references ① `P00_PRODUCT_scarf_flatlay.jpg` ② F02 · **Keep:** 0.50–2.67 s

```text
The same woman (identity as the reference portrait) keeps walking along the golden-hour brownstone street. A gentle gust lifts the loose end of the leopard silk scarf: it rises and ripples out to her left side (frame right) with soft, weighty silk motion, slow rolling waves travelling along the fabric, the cream pinstriped border and black hem turning in the light, then it begins to fall back. The knot stays securely tied at the base of her throat. Her hair lifts in the same wind direction. Subtle slow-motion feel, about 60% speed. Camera: smooth lateral tracking shot at waist height matching her pace. The scarf matches the product reference exactly — warm camel ground, black-and-caramel leopard rosettes, a cream band of about nine fine black pinstripes, a solid black hem — and the print stays locked to the fabric as it moves. Warm backlight, rich brown and camel tones, shallow depth of field, photorealistic.
Avoid: [paste NEG]
```

#### S2B: silk macro, slow motion (06:04–08:00, 44 frames)
**Model:** Seedance 2.0 std 1080p · **Inputs:** start frame F04; image references ① `P00_PRODUCT_scarf_flatlay.jpg` ② `P08_S3_border_fabric_detail.jpg` · **Keep:** 0.50–2.33 s
**Alternative:** Cinema Studio Video with speedramp **slowmo** and start frame F04, using the same prompt without the "Avoid" line.

```text
Macro detail in slow motion: the loose end of the silk scarf, still attached at her shoulder, ripples and curls in a soft breeze. Warm light glides across the satin twill, revealing the sheen, the fine weave, the leopard rosettes and the cream band of fine black pinstripes with its black hem. Gentle, physically believable movement: the fabric has weight, lifts and falls in slow waves and never floats free. In the final second the fabric sweeps across the lens toward frame left. Camera: slow macro tracking move along the border, very shallow depth of field, creamy golden street bokeh behind. The leopard spots and stripes stay fixed to the fabric and never shift, multiply or smear; colours match the product reference exactly.
Avoid: [paste NEG]
```
*Edit note:* the fabric sweep at the end of S2B wipes the cut into Scene 3.

### Scene 3 (8–12 s): The fashion moment

#### S3A: café medium shot (08:00–10:06, 54 frames)
**Model:** Kling 3.0 pro · **Start frame:** F06 · **Negative:** NEG · **Keep:** 0.50–2.75 s

```text
The woman in the ivory blazer stands outside the elegant café window in warm late-afternoon light. She lifts her left hand and gently touches the leopard silk scarf at her collarbone, slowly smoothing the silk between her fingertips and thumb while glancing down at it with a soft, appreciative expression, then looks up and slightly off-camera with the hint of a smile and lets her hand fall away. The scarf settles naturally against her blazer; her glossy dark hair moves subtly; one natural blink. Hands stay anatomically correct with five fingers, the thin gold ring on her left ring finger. Camera: medium shot, tripod-steady, with a very slow push-in. The window's gold lettering stays soft and unreadable; warm interior glow behind her. Photorealistic, natural skin texture, shallow depth of field, rich cream, camel and brown palette.
```

#### S3B: hands adjust the knot (10:06–12:00, 42 frames)
**Model:** Seedance 2.0 std 1080p · **Inputs:** start frame F07; image references ① F06 ② `P00_PRODUCT_scarf_flatlay.jpg` · **Keep:** 0.50–2.25 s
**Fallback:** Kling 3.0 pro with start frame F07 and NEG.

```text
Close-up on her neck and hands: with relaxed, graceful fingers she loosens the knot slightly, re-adjusts the silk so the cream pinstriped border sits neatly, gives the knot a light tug to secure it, then lowers her hands out of frame and the fabric settles softly with a small final ripple. Anatomically correct hands — exactly five fingers on each hand, natural knuckles, short almond nude nails, a thin gold band on her left ring finger — with real contact: the silk creases and folds under her fingertips and moves only where she touches it. Camera: locked-off close-up with a very slight drift. The scarf matches the product reference exactly and the print never shifts. Warm window light, shallow depth of field, photorealistic beauty close-up.
Avoid: [paste NEG]
```

### Scene 4 (12–16 s): The art of styling

#### S4A: adjusting the drape and turning (12:00–14:06, 54 frames)
**Model:** Kling 3.0 pro · **Start frame:** F09 · **Negative:** NEG · **Keep:** 0.50–2.75 s

```text
Beside a boutique window on a Manhattan avenue, the freckled woman in the black blazer glances at her reflection in the glass (frame left), then with both hands adjusts the drape of the leopard silk scarf, sliding the knot slightly to the side and laying one end over her shoulder, and turns her head and shoulders a few degrees toward camera with a composed, confident expression. Her honey-balayage waves fall naturally with the turn. Hands stay anatomically correct; the scarf print and pinstriped border stay perfectly stable while the fabric moves. Camera: medium close-up at eye level with a smooth, slow arc of a few degrees around her. Warm bokeh street lights, golden-hour tones, shallow depth of field, photorealistic.
```

#### S4B: reflection shot (14:06–16:00, 42 frames)
**Model:** Kling 3.0 pro · **Start frame:** F10 · **Negative:** NEG plus "mismatched reflection, reflection out of sync, second person" · **Keep:** 0.50–2.25 s

```text
Over-the-shoulder reflection shot: her hair and black blazer shoulder in soft focus in the foreground, and her reflection in the boutique window glass in sharp focus. In the reflection she smooths the leopard silk scarf at her neck with one hand and gives a small satisfied look. The reflection moves exactly in sync with her as a true mirror image: same face, same freckles, same scarf, same hand. The action is minimal and slow. Camera: nearly static, with a gentle rack of focus from her shoulder to the reflection. Warm street bokeh in the glass, golden-hour tones, photorealistic.
```
*If the reflection drifts out of sync:* regenerate F10 framed on the reflection
only (no foreground figure), which leaves fewer things to keep in sync, and keep
the cut short.

### Scene 5 (16–20 s): The final luxury shot

#### S5A: walk past and turn (16:00–18:00, 48 frames)
**Model:** Kling 3.0 pro · **Start frame:** F11A · **End frame:** F11B · **Negative:** NEG · **Keep:** 0.50–2.50 s

```text
The woman in the chocolate-brown suit and sunglasses walks past the camera along the brownstone sidewalk from frame right to frame left; as she passes she turns her head and shoulders back toward the lens with a subtle, confident look. The loose end of the leopard silk scarf trails behind her shoulder in a soft arc, flowing with her movement and the breeze, then settles; the knot stays at her throat. Natural stride, bag in hand, hair swinging with the turn. Camera: smooth tracking pan following her at eye level, gentle slow-motion feel. Golden autumn trees, stoops and iron railings, soft taxi bokeh, warm low backlight, photorealistic luxury fashion commercial.
```

#### S5B: hero close-up and end card (18:00–20:00, 48 frames)
**Model:** Seedance 2.0 std 1080p · **Inputs:** start frame F12; image references ① `P00_PRODUCT_scarf_flatlay.jpg` ② F02 · **Keep:** 0.40–2.40 s

```text
Hero close-up of the leopard silk scarf tied at her neck. Almost still: she breathes gently and turns her chin a few degrees toward the light; a faint breeze lifts the very tip of the scarf end and lets it settle. Warm golden light slowly glides across the silk, revealing the exact leopard print, the camel and black colours, the cream band of fine black pinstripes, the black hem and the satin twill texture. Camera: very slow, smooth push-in of about 5%. The lower part of the frame stays calm and uncluttered, with her chocolate-brown blazer lapel in soft shadow. The print stays perfectly stable and identical to the product reference.
Avoid: [paste NEG]
```
*Edit:* the logo and tagline are composited in the edit (`edit/endcard.png`) from 18.25 s, never generated.

---

## 5. Phase C: edit

### Timeline (24 fps, 480 frames; timecode SS:FF)

| Shot | Timeline | Frames | Content | Cut in on |
|---|---|---|---|---|
| S1A | 00:00–02:12 | 60 | Model 1 walk, push-in | music downbeat |
| S1B | 02:12–04:00 | 36 | Model 1 walking portrait | footfall (match on action) |
| S2A | 04:00–06:04 | 52 | breeze lifts the scarf | downbeat, bar 3 |
| S2B | 06:04–08:00 | 44 | silk macro, slow motion | scarf movement direction |
| S3A | 08:00–10:06 | 54 | Model 2 at the café | fabric sweep wipe, downbeat bar 5 |
| S3B | 10:06–12:00 | 42 | hands adjust the knot | her hand rising to the knot |
| S4A | 12:00–14:06 | 54 | Model 3 adjusts the drape | downbeat, bar 7 |
| S4B | 14:06–16:00 | 42 | reflection | her glance toward the glass |
| S5A | 16:00–18:00 | 48 | Model 1 walks past and turns | downbeat, bar 9 |
| S5B | 18:00–20:00 | 48 | hero close-up + end card | scarf trail settling |

All transitions are **clean cuts on movement**. If one feels abrupt, set that
row's `transition` to `dissolve:4` (4 frames). Total length stays 20 s.

### Run the edit

```bash
cd campaigns/silk-scarf-nyc
python3 edit/make_endcard.py                       # add --logo brand/logo.png when a logo is supplied
python3 edit/assemble.py --check                   # confirms every clip exists and is long enough
python3 edit/assemble.py --music audio/music.wav --ambience audio/nyc_street.wav
```

Output: `export/silk_scarf_nyc_20s_1080x1920.mp4` (H.264 High, 1080×1920,
24 fps, yuv420p / BT.709, AAC 320 kb/s 48 kHz, −14 LUFS, faststart).

### Colour

`assemble.py` applies one shared warm look after the cut: warm shadow and
mid balance, +4% contrast, −6% saturation, a soft vignette and fine grain to
knit the AI clips together. Match individual shots **before** that, in the
`grade` column of `shots.csv`, with ffmpeg filters, for example:

- too cool: `colortemperature=temperature=5800:mix=0.5`
- too warm: `colortemperature=temperature=7000:mix=0.4`
- too bright: `eq=brightness=-0.03`
- too saturated: `eq=saturation=0.9`

Judge skin tone and the camel ground of the scarf against `P00` across all
three models.

### End card

- Tagline: **TIMELESS LUXURY / IN EVERY DETAIL**, in Cormorant Garamond
  SemiBold, cream, wide letter-spacing, over a soft espresso scrim. It fades in
  over 0.75 s from 18.25 s. To add a trailing period, run
  `--tagline "TIMELESS LUXURY|IN EVERY DETAIL."`.
- Logo: `--logo path/to/logo.png` (transparent PNG) is centred in a 460×150
  slot above the rule. With no logo, the slot stays empty. "YOUR LOGO HERE"
  never appears.
- Everything sits above y = 1500 px, clear of the Reels / TikTok caption and
  button zones.

### Audio

**Music brief:** instrumental and understated, either a felt-piano or Rhodes
motif over a soft string pad, muted upright or sub bass and brushed minimal
percussion, or minimal downtempo. No vocals, no risers, no drops. Pick a track
at **120 BPM** (or a 60 BPM half-time feel), so each 4 s scene is exactly two
bars and every scene change lands on a downbeat. Use `--music-offset` to start
from the track's best 20 s. The script fades in over 0.3 s and out over the
last 1.4 s. Search terms for a licensed library (Artlist, Epidemic Sound,
Musicbed): *luxury fashion minimal piano*, *elegant downtempo*, *Parisian chic
lounge*.

**NYC ambience bed** (one mixed file, looped by the script at −14 dB under the
music): light distant Manhattan traffic, faint heel footsteps on pavement, a
soft breeze and leaf rustle, and a gentle café murmur around 8–12 s. No horns,
no sirens, no intelligible speech.

No voiceover and no on-screen captions. The storyboard notes are production
instructions only.

---

## 6. QC checklist (every take, then the full cut)

**Product**
- [ ] Leopard print scale, rosette shape and camel / black / caramel colours match `P00`.
- [ ] Border: cream band with fine black pinstripes, plus a black hem. Stripes
      stay straight, parallel and evenly spaced, and keep their width as the
      fabric moves.
- [ ] Spots don't swim, multiply or crawl across the fabric. Scrub frame by frame
      on S2A, S2B and S5B.
- [ ] The knot stays tied, the scarf stays attached, and fabric weight looks
      real (no floating, no rubbery bounce).

**People**
- [ ] Model 1 is the same woman in S1A, S1B, S2A, S5A and S5B: face, sunglasses,
      gold hoops, chocolate suit, cream camisole, black bag.
- [ ] Model 2 matches `P06`: ivory blazer, gold ring on her left ring finger.
      Model 3 matches `P09`: freckles, balayage, black blazer.
- [ ] Hands: five fingers each, no fusing, and real contact with the fabric (S3A, S3B, S4A, S4B).
- [ ] The reflection in S4B mirrors her face, scarf and gesture in sync.
- [ ] Faces don't drift during turns. Blinks and expressions look natural.

**Picture**
- [ ] No text, logos or watermarks generated in frame. Café lettering stays unreadable.
- [ ] No flicker, background warping or sudden camera jumps.
- [ ] Warm golden-hour light that's consistent across shots after grading.

**Delivery**
- [ ] `ffprobe` shows 1080×1920, 24 fps, exactly 20.000 s, H.264 + AAC.
- [ ] Tagline is sharp and stable. Logo is present only if supplied.
- [ ] Music ends cleanly, ambience stays subtle, no voice.

### Fixes for common failures

| Problem | Fix |
|---|---|
| Print morphs while the scarf moves | Use Seedance 2.0 with `P00` as an image reference, reduce the motion ("gentle", "slight"), or shorten the keep window to the stable frames |
| Face drifts between shots | Regenerate the start frame with the identity anchor (F02 / F06 / F09) attached, and keep head turns under about 20° |
| Bad hands | Regenerate F07 until the hands are clean before animating, keep the hand action slow, and try Kling 3.0 as the fallback |
| Frozen first frames | Raise `in_sec` in `shots.csv` |
| Slow motion judders | Use the Cinema Studio slowmo take, or run Topaz frame interpolation on the take |
| Soft or 720p output | Topaz upscale to 1080p before the edit |
