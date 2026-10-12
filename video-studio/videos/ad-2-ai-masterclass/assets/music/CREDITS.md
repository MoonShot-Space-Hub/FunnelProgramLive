# Music

`original-bed.mp3` — original composition generated for this ad by `video-studio/tools/compose_music.py`
(synthesised from scratch: no samples, loops or third-party recordings). No licence restrictions; owned by the
project. Re-generate with:

    python3 -I ../../tools/compose_music.py original-bed.wav 15.4
    ffmpeg -i original-bed.wav -c:a libmp3lame -b:a 224k original-bed.mp3

To use a YouTube Audio Library or Mixkit track instead, drop the file here and point `<audio id="music">` at it,
then re-run the voiceover carve (strength 0.5) so it ducks under the voice.
