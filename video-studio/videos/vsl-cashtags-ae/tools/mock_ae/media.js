// Media and font facts the mock needs from real files: footage size / duration / audio
// (ffprobe, with a PNG header fallback) and PostScript names of the fonts in <root>/Fonts.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cache = new Map();

function pngInfo(file) {
  const b = fs.readFileSync(file);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 26 || !sig.every((v, i) => b[i] === v) || b.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), hasAlpha: b[25] === 4 || b[25] === 6 };
}

// Returns {width, height, duration, frameRate, hasVideo, hasAudio, isStill}.
export function probeMedia(file) {
  if (cache.has(file)) return cache.get(file);
  const ext = path.extname(file).toLowerCase();
  const still = ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.psd', '.bmp', '.gif'].includes(ext);
  // Audio files may carry cover art as a "video" stream; After Effects imports them as audio only.
  const audioOnly = ['.mp3', '.wav', '.aif', '.aiff', '.m4a', '.aac'].includes(ext);
  let info = null;
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries',
      'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', file], { encoding: 'utf8' });
    const j = JSON.parse(out);
    const v = audioOnly ? undefined : (j.streams || []).find((s) => s.codec_type === 'video');
    const a = (j.streams || []).find((s) => s.codec_type === 'audio');
    let fr = 0;
    if (v && v.r_frame_rate && v.r_frame_rate.includes('/')) {
      const [n, d] = v.r_frame_rate.split('/').map(Number);
      fr = d ? n / d : 0;
    }
    info = {
      width: v ? v.width : 0, height: v ? v.height : 0,
      duration: still ? 0 : Number((j.format || {}).duration || 0),
      frameRate: still ? 0 : fr, hasVideo: !!v, hasAudio: !!a, isStill: still,
    };
  } catch (e) {
    if (ext === '.png') {
      const p = pngInfo(file);
      if (p) info = { width: p.width, height: p.height, duration: 0, frameRate: 0, hasVideo: true, hasAudio: false, isStill: true };
    }
    if (!info) throw new Error(`cannot probe ${file} (is ffprobe installed?): ${e.message}`);
  }
  cache.set(file, info);
  return info;
}

// PostScript names (name table, nameID 6) of every .otf / .ttf in dir.
export function fontPostScriptNames(dir) {
  const names = new Set();
  if (!fs.existsSync(dir)) return names;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(otf|ttf)$/i.test(f)) continue;
    const b = fs.readFileSync(path.join(dir, f));
    const numTables = b.readUInt16BE(4);
    for (let t = 0; t < numTables; t++) {
      const rec = 12 + t * 16;
      if (b.toString('ascii', rec, rec + 4) !== 'name') continue;
      const off = b.readUInt32BE(rec + 8);
      const count = b.readUInt16BE(off + 2);
      const strOff = off + b.readUInt16BE(off + 4);
      for (let i = 0; i < count; i++) {
        const r = off + 6 + i * 12;
        const platform = b.readUInt16BE(r);
        const nameId = b.readUInt16BE(r + 6);
        const len = b.readUInt16BE(r + 8);
        const so = strOff + b.readUInt16BE(r + 10);
        if (nameId !== 6) continue;
        let s;
        if (platform === 3 || platform === 0) {
          const chars = [];
          for (let k = 0; k < len; k += 2) chars.push(b.readUInt16BE(so + k));
          s = String.fromCharCode(...chars);
        } else {
          s = b.toString('latin1', so, so + len);
        }
        if (s) names.add(s);
      }
    }
  }
  return names;
}
