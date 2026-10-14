AVATAR VIDEO 2 - AFTER EFFECTS KIT
==================================

This video was not made in After Effects. It was built in HyperFrames (HTML + GSAP animation,
rendered to MP4), so there is no original .aep file. This kit rebuilds the same edit inside
After Effects with one script, so you can open it, adjust it and render it from AE.


HOW TO OPEN IT
--------------
1. Unzip everything into one folder. Keep the folder structure (layers/, audio/, footage/).
2. Copy your original video (Avatar_Video_1080p_1_1.mp4) into the footage/ folder.
   (If you skip this, the script asks you to pick the video when it runs.)
3. In After Effects: File > Scripts > Run Script File... and choose build_avatar_video_2.jsx.
   (On first use, allow scripts in Preferences > Scripting & Expressions > "Allow Scripts to
   Write Files and Access Network" if AE asks.)
4. The comp "Avatar Video 2 - Final" opens: 1080 x 1920, 25 fps, 43.32 s.


WHAT IS IN THE COMP (bottom to top)
-----------------------------------
- A-roll (punch-ins)        your video, with the same zoom-ins as Scale keyframes (anchored on
                            your face). Edit or delete the keyframes freely.
- Caption gradient          the black gradient behind the captions (PNG with transparency).
- Animations (all scenes)   every animation, as one transparent layer. In the compact kit it is
                            a colour video + a black/white matte video joined with a Luma Track
                            Matte (the matte layer is the one named "(matte)").
- Captions                  the English captions with their pop-in animation, as one transparent
                            layer (same colour + matte setup). captions.srt has all the text and
                            timings if you want to retype them as AE text layers.
- Music + SFX mix           the music and sound effects exactly as in the delivered video
                            (music at -15 dB, voice-ducked). Your voice comes from the A-roll.
- Remix layers (switched off)  the music file at -15 dB and every sound effect at its exact time
                            and level. To rebalance the audio yourself, switch the mix layer off
                            and these on.
- Comp markers              name each animated scene (c1 ... c8, CTA) at its start time.

All animations stay clear of your face and inside Instagram's Reels safe zone
(top 14%, bottom 35% and 6% of each side kept free of text).


WHAT YOU CAN AND CANNOT EDIT IN AE
----------------------------------
- Timing, position, scale, opacity, effects and colour of every layer: yes.
- The zooms on your video, the audio levels, the gradient: yes.
- The inside of an animation (its words, shapes, colours, motion): no. Each animation is a
  rendered layer, not After Effects shape/text layers. To change one, ask for the change and
  the layer is re-rendered from the HyperFrames project (videos/avatar-video-2 in the repo).


FILES
-----
build_avatar_video_2.jsx        the script that builds the comp
layers/caption-gradient.png     gradient
layers/animations_fill.mp4      animations, colour       } joined in AE with a Luma Track Matte
layers/animations_matte.mp4     animations, matte        }
layers/captions_fill.mp4        captions, colour         }
layers/captions_matte.mp4       captions, matte          }
audio/music-and-sfx-mix.wav     final music + SFX mix
audio/music-original.mp3        the original music track (full level)
audio/sfx/                      the sound effects (Pixabay licence, see audio/sfx/CREDITS.md)
captions.srt                    caption text and timings
footage/                        put Avatar_Video_1080p_1_1.mp4 here

A full-quality version of the two transparent layers also exists as ProRes 4444 .mov files with a
real alpha channel (about 400 MB), which is too large to send in chat. If you put
animations.mov / captions.mov in layers/, the script uses them automatically instead of the
colour + matte pairs.
