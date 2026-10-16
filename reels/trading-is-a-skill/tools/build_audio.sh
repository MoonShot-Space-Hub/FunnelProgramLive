#!/usr/bin/env bash
# Voice processing -> original score ducked under it -> loudness-normalized mix.
# Usage: tools/build_audio.sh <python-with-numpy-scipy-soundfile>
set -euo pipefail
PY=${1:-python3}
cd "$(dirname "$0")/.."

# Bring any take to about -19 LUFS first so the music balance doesn't depend on it.
VO_LUFS=$(ffmpeg -hide_banner -i public/vo.wav -af ebur128 -f null - 2>&1 | awk '/^ +I:/{v=$2} END{print v}')
VO_GAIN=$(awk -v i="$VO_LUFS" 'BEGIN{printf "%.2f", -19 - i}')

# Light voice polish: trim rumble, a touch of presence, even out level, catch peaks.
ffmpeg -hide_banner -loglevel error -y -i public/vo.wav -af \
  "aformat=sample_fmts=flt,volume=${VO_GAIN}dB,highpass=f=70,equalizer=f=3200:t=q:w=1.2:g=1.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=3dB,alimiter=limit=0.9:attack=2:release=40" \
  -ar 44100 public/vo_master.wav

"$PY" -I tools/music.py .

# Voice + bed, then normalize to -14 LUFS (Reels/Shorts) with -1.5 dBTP headroom.
ffmpeg -hide_banner -loglevel error -y -i public/vo_master.wav -i public/music.wav -filter_complex \
  "[0:a]pan=stereo|c0=c0|c1=c0[v];[v][1:a]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -c:a pcm_s16le public/mix.wav
rm -f public/mix_raw.wav
