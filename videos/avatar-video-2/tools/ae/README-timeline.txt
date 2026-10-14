AVATAR VIDEO 2 - EDITABLE TIMELINE (After Effects)
=================================================

One script builds the whole reel in After Effects as an editable timeline: every animation, every
caption, the music and every sound effect is its own layer you can move, trim, delete or restyle.


HOW TO OPEN IT
--------------
1. Unzip everything into one folder. Keep the folders (clips/, layers/, audio/, fonts/, footage/).
2. Copy your original video (Avatar_Video_1080p_1_1.mp4) into footage/.
   (If you skip this, the script asks you to pick the video.)
3. Optional, for the editable text captions: install the two fonts in fonts/
   (double-click each .ttf > Install), then restart After Effects. If the font is not installed,
   the script says so at the end and the editable text captions use a substitute font.
4. In After Effects: File > Scripts > Run Script File... > build_avatar_video_2_timeline.jsx
5. The comp "Avatar Video 2 - Timeline" opens: 1080 x 1920, 25 fps, 43.32 s.


THE TIMELINE (top to bottom)
----------------------------
Caption 01 ... Caption 36      each caption phrase as its own clip, with its pop-in animation
Scene 1 ... Scene 9            each animation as its own clip:
                                 1 Money everywhere          6 Question the old beliefs
                                 2 Beliefs installed         7 New habits, begin today
                                 3 Rewind to childhood       8 Free 1-hour training
                                 4 The old beliefs           9 Click the link below
                                 5 Strings on your decisions
Caption gradient               the black gradient behind the captions
A-roll (punch-ins)             your video; the zoom-ins are Scale keyframes you can change
Music (voice-ducked) -35 dB    the music, already lowered under your voice; change its level
                               with Audio Levels (twirl down > Audio > Audio Levels)
Music (original) - off         the plain music track, switched off, if you prefer to duck it yourself
SFX: ...                       44 sound effects, each at its time and level

Each animation and caption clip has a hidden partner layer named "(matte)". It cuts out the
transparency (Luma Track Matte), and it is a shy layer, so the timeline hides it. Click the
"Hide shy layers" switch at the top of the timeline to see them. When you move or trim a clip,
move or trim its matte the same way (select both).

Editable captions (text) - switch on to use
                               the same 36 captions as real text layers (Montserrat Black) in a
                               precomp. Switch on its eyeball and switch off the Caption clips if
                               you want to change wording, font, size or colour. Keyword colours
                               and the word-by-word pop are only in the Caption clips.

Comp markers name each scene at its start time.


MUSIC LEVEL
-----------
The music is at -35 dB: 20 dB lower than the earlier -15 dB version, as asked. The sound effects
are unchanged. To make the music louder or quieter, change Audio Levels on the music layer
(for example -20 dB for a soft but audible bed).


WHAT IS AND IS NOT EDITABLE
---------------------------
- Timing, trimming, order, position, scale, opacity, effects, colour, audio levels: yes.
- The inside of an animation (its words, shapes, colours, motion): no. Each animation is a
  rendered clip, not After Effects shapes. Ask for a change and the clip is re-rendered from the
  HyperFrames project (videos/avatar-video-2 in the repo).


FILES
-----
build_avatar_video_2_timeline.jsx   builds the timeline
clips/animations/                   9 scenes, each a _fill (colour) + _matte (black/white) MP4
clips/captions/                     36 captions, same fill + matte pairs
layers/caption-gradient.png         gradient
audio/music-voice-ducked.wav        the music with its ducking under the voice, at full level
                                    (the layer sets it to -35 dB)
audio/music-original.mp3            the plain music track
audio/sfx/                          sound effects (Pixabay licence, see CREDITS.md)
fonts/                              Montserrat Black and Archivo Black (SIL Open Font License)
captions.srt                        caption text and timings
footage/                            put Avatar_Video_1080p_1_1.mp4 here
