# Ad 2 – Hook 3 (Trading × Garba) — edited cut

Vertical 1080×1920 / 60 fps ad edit, built with [Remotion](https://www.remotion.dev).

- **Final video:** `out/ad2_hook3_final.mp4`
- **English subtitles (SRT):** `out/ad2_hook3_english.srt`

## What the edit adds

- **English captions** translated from the Hindi/Hinglish voice-over, with kinetic typography
  (Montserrat / Anton / Playfair Display italic), word-by-word pop-ins and keyword colouring.
- **Black gradient** that rises from the bottom whenever captions are on screen.
- **Image-only B-roll** (no video B-roll): public-domain / CC0 photos as animated cards with
  After Effects style moves — whip pans, zoom punches, 3D flips, circle wipes, Ken Burns, light sweeps,
  beat-synced pulse, camera shake, target-lock reticle, ribbon and clock badges.
- **Motion graphics:** Trading-vs-Garba split, animated uptrend/downtrend/sideways chart,
  "STEP 1" entry/exit/stop-loss/target checklist, FREE stamp with confetti, CTA button with cursor click.
- **Speaker punch-in zooms** and emoji pop-ups between B-roll shots.
- **Music** from the YouTube Audio Library, ducked under the voice, plus subtle synthesized whoosh/ding/impact SFX.
  Final mix normalised to −14 LUFS.

## Rebuilding

Large source media is not committed. Put these in place first:

| File | What |
| --- | --- |
| `public/input.mp4` | the original talking-head clip (`Ad_2__Hook_3_1.mp4`) |
| `public/audio/music.mp3` | "Greatest Of All Time" – Silent Partner (YouTube Audio Library) |

```console
npm i
# 1. captions (needs numpy + soundfile; 16 kHz mono wav of the clip's audio)
ffmpeg -i public/input.mp4 -ac 1 -ar 16000 /tmp/audio16k.wav
python scripts/build_captions.py /tmp/audio16k.wav src/data/captions.json
python scripts/build_srt.py src/data/captions.json out/ad2_hook3_english.srt
# 2. soundtrack (voice + ducked music + SFX) and music beat grid
python scripts/build_audio.py public/input.mp4 public/audio/music.mp3 src/timeline.json public src/data/beats.json
# 3. picture, then mux the soundtrack
npx remotion render AdHook3 out/ad2_hook3_silent.mp4 --muted --crf=17
ffmpeg -i out/ad2_hook3_silent.mp4 -i public/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/ad2_hook3_final.mp4
```

All edit decisions (B-roll timing, transitions, zoom punches, stickers, overlays) live in `src/timeline.json`.
Caption wording and timing live in `scripts/build_captions.py`.

## Credits & licences

**Music** — "Greatest Of All Time" by Silent Partner, YouTube Audio Library (free to use, no attribution required).

**Photos** (all CC0 / public domain — no attribution required; listed for reference):

| File | Title | Author | Source |
| --- | --- | --- | --- |
| `laptop_chart.jpg` | Stockmarket Charts | Negative Space | https://stocksnap.io/photo/stockmarket-charts-G3YOGRBLF3 |
| `garba_gujarat.jpg` | GARBA DANCE GUJARAT | Deba Prasad Roy | https://commons.wikimedia.org/w/index.php?curid=160342267 |
| `garba_playing.jpg` | Garba playing | Prachi246 | https://commons.wikimedia.org/w/index.php?curid=153149347 |
| `dandiya.jpg` | Vibrant culture | Atishaychoubey | https://commons.wikimedia.org/w/index.php?curid=145005099 |
| `drum.jpg` | 20131114-DM-LSC-0004 | USDA | https://www.flickr.com/photos/41284017@N08/10880152304 |
| `chart_red.jpg` | Stocks Graph | 50Fish | https://stocksnap.io/photo/stocks-graph-MEDIALY3UV |
| `chart_fall.jpg` | Stock Market | Altered Reality | https://stocksnap.io/photo/stock-market-BI0OXVDDLY |
| `chess_hand.jpg` | Man Playing | JESHOOTS.com | https://stocksnap.io/photo/man-playing-DWOHZLHHIP |
| `dartboard.jpg` | Dartboard with a dart in the bullseye | Mohammed Kateregga | https://wordpress.org/photos/photo/76069c4c06/ |
| `laptop_desk.jpg` | Laptop Desk | Lisa Fotios | https://stocksnap.io/photo/laptop-desk-JCXQS3IVWD |
| `chess_board.jpg` | Chess Board | Kristin Hardwick | https://stocksnap.io/photo/chess-board-NUAITIXILP |
| `meditation.jpg` | Meditation Man | Direct Media | https://stocksnap.io/photo/meditation-man-LSXBNQVCM6 |
| `phone_trading.jpg` | Apple Iphone | Wilfred Iven | https://stocksnap.io/photo/apple-iphone-TAM2OYHWFJ |
| `climb_success.jpg` | Climbing, helping, teamwork | ujgmxxuy61 | https://www.flickr.com/photos/159535053@N06/42172615510 |

**Fonts** — Montserrat, Anton, Playfair Display (SIL Open Font License, via Fontsource).
