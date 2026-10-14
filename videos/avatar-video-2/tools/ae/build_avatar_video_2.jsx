// Avatar Video 2 - rebuild the finished edit in Adobe After Effects.
//
// Run it from After Effects: File > Scripts > Run Script File... and pick this file.
// It must sit in the kit folder next to the "layers", "audio" and "footage" folders.
// It creates the comp "Avatar Video 2 - Final" (1080x1920, 25 fps, 43.32 s) with:
//   - the original video, with the same punch-in zooms (Scale keyframes, anchor on her face)
//   - the black gradient behind the captions
//   - all animations as one transparent layer (rendered from the HyperFrames project)
//   - the captions as one transparent layer (captions.srt has the text if you want to retype them)
//   - the music + sound-effects mix exactly as in the final video (music at -15 dB)
//   - a "Remix kit" of the music and every sound effect as separate layers at their times and
//     levels, switched off; turn them on (and the mix layer off) to rebalance the audio yourself
//   - comp markers naming each animated scene
(function () {
    var DUR = 43.32, FPS = 25, FRAME = 1 / FPS;
    var CAM = [[0.0, 2.48, 1.0, 1.04, "inOut"], [2.48, 6.8, 1.1, 1.12, "out"], [6.8, 9.28, 1.0, 1.03, "out"], [9.28, 11.04, 1.1, 1.12, "out"], [11.04, 19.04, 1.0, 1.04, "inOut"], [19.04, 21.36, 1.1, 1.12, "out"], [21.36, 25.04, 1.0, 1.03, "out"], [25.04, 29.2, 1.08, 1.12, "inOut"], [29.2, 36.72, 1.0, 1.05, "inOut"], [36.72, 40.0, 1.1, 1.12, "out"], [40.0, 43.32, 1.0, 1.04, "out"]];
    var SCENES = [["c1 Money everywhere", 0.56, 2.44], ["c2 Beliefs installed", 6.76, 9.2], ["c3 Rewind to childhood", 11.0, 13.1], ["c4 The old beliefs", 13.1, 19.02], ["c5 Strings on your decisions", 21.3, 24.9], ["c6 Question the old beliefs", 29.1, 31.92], ["c7 New habits, begin today", 31.92, 36.5], ["c8 Free 1-hour training", 39.9, 42.1], ["CTA Click the link below", 42.04, 43.32]];
    var SFX = [{"label": "c1 in", "file": "whoosh.mp3", "start": 0.44, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "coin rain on money", "file": "sparkle.mp3", "start": 1.24, "dur": 1.8, "in": 0.0, "vol": 0.034}, {"label": "MONEY IS EVERYWHERE chip", "file": "pop.mp3", "start": 1.79, "dur": 0.72, "in": 0.0, "vol": 0.098}, {"label": "c1 out", "file": "whoosh-short.mp3", "start": 2.14, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c2 in", "file": "whoosh.mp3", "start": 6.64, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "progress bar", "file": "click-soft.mp3", "start": 8.06, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "padlock slams", "file": "impact-bass-1.mp3", "start": 8.72, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "c2 out", "file": "whoosh-short.mp3", "start": 8.9, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c3 in", "file": "whoosh.mp3", "start": 10.78, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "rewind", "file": "glitch-2.mp3", "start": 10.78, "dur": 0.7, "in": 0.9, "vol": 0.016}, {"label": "speech bubbles", "file": "pop.mp3", "start": 11.95, "dur": 0.72, "in": 0.0, "vol": 0.092}, {"label": "c4 in", "file": "whoosh-short.mp3", "start": 12.98, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "HARD", "file": "impact-bass-1.mp3", "start": 13.76, "dur": 2.12, "in": 0.0, "vol": 0.022}, {"label": "card 2", "file": "whoosh-short.mp3", "start": 14.72, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "SELFISH", "file": "impact-bass-1.mp3", "start": 15.76, "dur": 2.12, "in": 0.0, "vol": 0.022}, {"label": "card 3", "file": "whoosh-short.mp3", "start": 16.56, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "NEVER", "file": "impact-bass-1.mp3", "start": 17.76, "dur": 2.12, "in": 0.0, "vol": 0.028}, {"label": "NEVER glitch", "file": "glitch-2.mp3", "start": 17.56, "dur": 0.6, "in": 0.9, "vol": 0.012}, {"label": "c4 out", "file": "whoosh-short.mp3", "start": 18.72, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c5 in", "file": "whoosh.mp3", "start": 21.08, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "strings pull", "file": "whoosh-short.mp3", "start": 22.16, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "glint on realizing", "file": "sparkle.mp3", "start": 23.96, "dur": 1.8, "in": 0.0, "vol": 0.028}, {"label": "c5 out", "file": "whoosh-short.mp3", "start": 24.6, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c6 in", "file": "whoosh.mp3", "start": 28.98, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "question mark", "file": "impact-bass-1.mp3", "start": 30.16, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "cracks", "file": "click-soft.mp3", "start": 31.02, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "cards split", "file": "click-soft.mp3", "start": 31.34, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "c7 in", "file": "whoosh-short.mp3", "start": 31.8, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "loop snaps open", "file": "whoosh-short.mp3", "start": 32.32, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "step 1", "file": "click-soft.mp3", "start": 32.94, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "step 2", "file": "click-soft.mp3", "start": 33.14, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "NEW HABITS chip", "file": "pop.mp3", "start": 33.23, "dur": 0.72, "in": 0.0, "vol": 0.092}, {"label": "calendar flips", "file": "whoosh-short.mp3", "start": 35.52, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "DAY 1 stamp", "file": "impact-bass-1.mp3", "start": 36.0, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "gold burst", "file": "sparkle.mp3", "start": 36.04, "dur": 1.8, "in": 0.0, "vol": 0.034}, {"label": "c7 out", "file": "whoosh-short.mp3", "start": 36.2, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c8 in", "file": "whoosh.mp3", "start": 39.78, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "FREE stamp", "file": "impact-bass-1.mp3", "start": 40.64, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "FREE burst", "file": "sparkle.mp3", "start": 40.68, "dur": 1.8, "in": 0.0, "vol": 0.031}, {"label": "clock sweep", "file": "click-soft.mp3", "start": 41.1, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "c8 out", "file": "whoosh-short.mp3", "start": 41.8, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "CLICK THE LINK BELOW button", "file": "pop.mp3", "start": 42.03, "dur": 0.72, "in": 0.0, "vol": 0.098}, {"label": "button tap", "file": "click-soft.mp3", "start": 42.62, "dur": 0.37, "in": 0.0, "vol": 0.104}, {"label": "chevrons", "file": "sparkle.mp3", "start": 42.86, "dur": 0.46, "in": 0.0, "vol": 0.028}];

    var root = (new File($.fileName)).parent;
    function kit(rel) { return new File(root.fsName + "/" + rel); }
    function firstExisting(list) {
        for (var i = 0; i < list.length; i++) { var f = kit(list[i]); if (f.exists) return f; }
        return null;
    }

    app.beginUndoGroup("Build Avatar Video 2");
    if (!app.project) app.newProject();
    var proj = app.project;
    var bin = proj.items.addFolder("Avatar Video 2 kit");
    var sfxBin = proj.items.addFolder("Sound effects");
    sfxBin.parentFolder = bin;

    function importFile(file, parent) {
        var item = proj.importFile(new ImportOptions(file));
        item.parentFolder = parent || bin;
        return item;
    }

    // ---- source footage (the kit ships it in footage/; otherwise ask for the original upload)
    var footFile = firstExisting(["footage/Avatar_Video_1080p_1_1.mp4", "footage/avatar-video-2.mp4"]);
    if (!footFile) footFile = File.openDialog("Select the original video (Avatar_Video_1080p_1_1.mp4)");
    if (!footFile) { alert("No footage selected. Nothing was built."); app.endUndoGroup(); return; }

    var comp = proj.items.addComp("Avatar Video 2 - Final", 1080, 1920, 1, DUR, FPS);
    comp.parentFolder = bin;
    comp.bgColor = [0.07, 0.024, 0.1];

    // ---- 1. A-roll with the punch-in camera (scale about her face at 500, 660)
    var foot = comp.layers.add(importFile(footFile));
    foot.name = "A-roll (punch-ins)";
    foot.transform.anchorPoint.setValue([500, 660]);
    foot.transform.position.setValue([500, 660]);
    var sc = foot.transform.scale;
    for (var c = 0; c < CAM.length; c++) {
        var seg = CAM[c], t0 = seg[0], t1 = seg[1], k0, k1;
        k0 = sc.addKey(t0); sc.setValueAtKey(k0, [seg[2] * 100, seg[2] * 100]);
        var tEnd = (c === CAM.length - 1) ? DUR : t1 - FRAME;
        k1 = sc.addKey(tEnd); sc.setValueAtKey(k1, [seg[3] * 100, seg[3] * 100]);
    }
    // sine-like eases inside each shot, hard cuts between shots
    var dims = sc.value.length;
    function ease(speed, infl) { var a = []; for (var d = 0; d < dims; d++) a.push(new KeyframeEase(speed, infl)); return a; }
    for (var k = 1; k <= sc.numKeys; k++) {
        var isStart = (k % 2 === 1);
        var seg2 = CAM[Math.floor((k - 1) / 2)];
        if (isStart) {
            sc.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            var outSpeed = seg2[4] === "out" ? Math.abs(seg2[3] - seg2[2]) * 100 / (seg2[1] - seg2[0]) * 1.5 : 0;
            sc.setTemporalEaseAtKey(k, ease(0, 33), ease(outSpeed, seg2[4] === "out" ? 20 : 40));
        } else {
            sc.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.HOLD);
            sc.setTemporalEaseAtKey(k, ease(0, seg2[4] === "out" ? 60 : 40), ease(0, 33));
        }
    }
    foot.audio.audioLevels.setValue([0, 0]);

    // ---- 2. black gradient behind the captions (fades in over the first 0.3 s)
    var gradFile = kit("layers/caption-gradient.png");
    if (gradFile.exists) {
        var grad = comp.layers.add(importFile(gradFile));
        grad.name = "Caption gradient";
        grad.transform.opacity.setValueAtTime(0, 0);
        grad.transform.opacity.setValueAtTime(0.3, 100);
        grad.outPoint = DUR;
    }

    // ---- 3. animations (transparent). ProRes 4444 .mov with alpha, or fill + luma matte MP4s.
    function addAlphaLayer(base, name) {
        var mov = kit("layers/" + base + ".mov");
        if (mov.exists) {
            var it = importFile(mov);
            try { if (it.mainSource.hasAlpha) it.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (e) {}
            var L = comp.layers.add(it);
            L.name = name;
            if (L.hasAudio) L.audioEnabled = false;
            return L;
        }
        var fill = kit("layers/" + base + "_fill.mp4"), matte = kit("layers/" + base + "_matte.mp4");
        if (fill.exists && matte.exists) {
            var F = comp.layers.add(importFile(fill));
            F.name = name;
            if (F.hasAudio) F.audioEnabled = false;
            var M = comp.layers.add(importFile(matte));   // added on top, directly above the fill
            M.name = name + " (matte)";
            if (M.hasAudio) M.audioEnabled = false;
            // the fill shows only where the matte is white
            if (typeof F.setTrackMatte === "function") { F.setTrackMatte(M, TrackMatteType.LUMA); M.enabled = false; }
            else F.trackMatteType = TrackMatteType.LUMA;
            return F;
        }
        return null;
    }
    addAlphaLayer("animations", "Animations (all scenes)");
    addAlphaLayer("captions", "Captions");

    // ---- 4. audio: the exact final music + SFX mix
    var mixFile = kit("audio/music-and-sfx-mix.wav");
    if (mixFile.exists) {
        var mix = comp.layers.add(importFile(mixFile));
        mix.name = "Music + SFX mix (as delivered)";
    }

    // ---- 5. remix kit: music and every sound effect, switched off
    var musicFile = kit("audio/music-original.mp3");
    if (musicFile.exists) {
        var mus = comp.layers.add(importFile(musicFile));
        mus.name = "Remix: music (-15 dB)";
        mus.audio.audioLevels.setValue([-15, -15]);
        mus.audioEnabled = false;
        mus.outPoint = DUR;
    }
    var sfxItems = {};
    for (var s = 0; s < SFX.length; s++) {
        var cue = SFX[s];
        var sf = kit("audio/sfx/" + cue.file);
        if (!sf.exists) continue;
        if (!sfxItems[cue.file]) sfxItems[cue.file] = importFile(sf, sfxBin);
        var L2 = comp.layers.add(sfxItems[cue.file]);
        L2.name = "Remix SFX: " + cue.label;
        L2.startTime = cue.start - cue["in"];
        L2.inPoint = cue.start;
        L2.outPoint = Math.min(cue.start + cue.dur, DUR);
        var db = 20 * Math.log(cue.vol) / Math.LN10;
        L2.audio.audioLevels.setValue([db, db]);
        L2.audioEnabled = false;
    }

    // ---- 6. markers for the animated scenes
    for (var m = 0; m < SCENES.length; m++) {
        var mv = new MarkerValue(SCENES[m][0]);
        mv.duration = SCENES[m][2] - SCENES[m][1];
        comp.markerProperty.setValueAtTime(SCENES[m][1], mv);
    }

    comp.openInViewer();
    app.endUndoGroup();
    alert("Built \"Avatar Video 2 - Final\".\nAnimations and captions are transparent layers; the remix-kit audio layers are switched off.");
})();
