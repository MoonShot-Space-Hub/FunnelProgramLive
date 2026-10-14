// Avatar Video 2 - EDITABLE TIMELINE for Adobe After Effects.
//
// Run it from After Effects: File > Scripts > Run Script File... and pick this file.
// Keep it in the kit folder next to "clips", "layers", "audio", "fonts" and "footage".
// It builds the comp "Avatar Video 2 - Timeline" (1080x1920, 25 fps, 43.32 s) where every piece
// is its own layer that you can move, trim, delete or restyle:
//   - your video, with the punch-in zooms as Scale keyframes (anchored on your face)
//   - the black gradient behind the captions
//   - 9 animation clips (one per scene) and 36 caption clips, each a colour clip with a hidden
//     luma-matte partner (shy layer) that cuts out its transparency
//   - "Editable captions (text)": the same captions as real text layers in a precomp, switched
//     off; switch it on (and the caption clips off) to change wording or style
//   - the music (voice-ducked) on its own layer at -35 dB, and the 44 sound effects as separate
//     layers at their exact times and levels
//   - comp markers naming each scene
(function () {
    var DUR = 43.32, FPS = 25, FRAME = 1 / FPS;
    var MUSIC_DB = -35;
    var CAM = [[0.0, 2.48, 1.0, 1.04, "inOut"], [2.48, 6.8, 1.1, 1.12, "out"], [6.8, 9.28, 1.0, 1.03, "out"], [9.28, 11.04, 1.1, 1.12, "out"], [11.04, 19.04, 1.0, 1.04, "inOut"], [19.04, 21.36, 1.1, 1.12, "out"], [21.36, 25.04, 1.0, 1.03, "out"], [25.04, 29.2, 1.08, 1.12, "inOut"], [29.2, 36.72, 1.0, 1.05, "inOut"], [36.72, 40.0, 1.1, 1.12, "out"], [40.0, 43.32, 1.0, 1.04, "out"]];
    var ANIMS = [{"name": "Scene 1 - Money everywhere", "file": "clips/animations/01_c1_Money-everywhere", "start": 0.56, "end": 2.44}, {"name": "Scene 2 - Beliefs installed", "file": "clips/animations/02_c2_Beliefs-installed", "start": 6.76, "end": 9.2}, {"name": "Scene 3 - Rewind to childhood", "file": "clips/animations/03_c3_Rewind-to-childhood", "start": 11.0, "end": 13.12}, {"name": "Scene 4 - The old beliefs", "file": "clips/animations/04_c4_The-old-beliefs", "start": 13.12, "end": 19.04}, {"name": "Scene 5 - Strings on your decisions", "file": "clips/animations/05_c5_Strings-on-your-decisions", "start": 21.32, "end": 24.92}, {"name": "Scene 6 - Question the old beliefs", "file": "clips/animations/06_c6_Question-the-old-beliefs", "start": 29.12, "end": 31.92}, {"name": "Scene 7 - New habits, begin today", "file": "clips/animations/07_c7_New-habits-begin-today", "start": 31.92, "end": 36.52}, {"name": "Scene 8 - Free 1-hour training", "file": "clips/animations/08_c8_Free-1-hour-training", "start": 39.92, "end": 42.12}, {"name": "Scene 9 - Click the link below", "file": "clips/animations/09_cta_Click-the-link-below", "start": 42.04, "end": 43.32}];
    var CAPS = [{"name": "Caption 01 - THERE'S NO SHORTAGE", "text": "THERE'S NO SHORTAGE", "file": "clips/captions/01_THERE-S-NO-SHORTAGE", "start": 0.0, "end": 1.2, "keywords": ["SHORTAGE"]}, {"name": "Caption 02 - OF MONEY IN THIS WORLD.", "text": "OF MONEY IN THIS WORLD.", "file": "clips/captions/02_OF-MONEY-IN-THIS-WORLD", "start": 1.16, "end": 2.48, "keywords": ["MONEY"]}, {"name": "Caption 03 - BUT SOMETIMES", "text": "BUT SOMETIMES", "file": "clips/captions/03_BUT-SOMETIMES", "start": 2.44, "end": 3.44, "keywords": []}, {"name": "Caption 04 - WHAT HOLDS US BACK", "text": "WHAT HOLDS US BACK", "file": "clips/captions/04_WHAT-HOLDS-US-BACK", "start": 3.4, "end": 4.72, "keywords": ["HOLDS", "BACK"]}, {"name": "Caption 05 - ISN'T JUST WHAT'S", "text": "ISN'T JUST WHAT'S", "file": "clips/captions/05_ISN-T-JUST-WHAT-S", "start": 4.68, "end": 5.52, "keywords": []}, {"name": "Caption 06 - HAPPENING AROUND US.", "text": "HAPPENING AROUND US.", "file": "clips/captions/06_HAPPENING-AROUND-US", "start": 5.48, "end": 6.8, "keywords": []}, {"name": "Caption 07 - IT'S WHAT WE'VE LEARNED", "text": "IT'S WHAT WE'VE LEARNED", "file": "clips/captions/07_IT-S-WHAT-WE-VE-LEARNED", "start": 6.76, "end": 7.92, "keywords": ["LEARNED"]}, {"name": "Caption 08 - TO BELIEVE ABOUT MONEY.", "text": "TO BELIEVE ABOUT MONEY.", "file": "clips/captions/08_TO-BELIEVE-ABOUT-MONEY", "start": 7.88, "end": 9.28, "keywords": ["BELIEVE"]}, {"name": "Caption 09 - THAT DOESN'T MEAN", "text": "THAT DOESN'T MEAN", "file": "clips/captions/09_THAT-DOESN-T-MEAN", "start": 9.24, "end": 10.0, "keywords": ["DOESN'T"]}, {"name": "Caption 10 - IT'S YOUR FAULT.", "text": "IT'S YOUR FAULT.", "file": "clips/captions/10_IT-S-YOUR-FAULT", "start": 9.96, "end": 11.04, "keywords": []}, {"name": "Caption 11 - THINK ABOUT THE THINGS", "text": "THINK ABOUT THE THINGS", "file": "clips/captions/11_THINK-ABOUT-THE-THINGS", "start": 11.0, "end": 11.92, "keywords": []}, {"name": "Caption 12 - YOU HEARD GROWING UP.", "text": "YOU HEARD GROWING UP.", "file": "clips/captions/12_YOU-HEARD-GROWING-UP", "start": 11.88, "end": 13.2, "keywords": ["GROWING", "UP."]}, {"name": "Caption 13 - WHEN YOU HEAR SOMETHING", "text": "WHEN YOU HEAR SOMETHING", "file": "clips/captions/13_WHEN-YOU-HEAR-SOMETHING", "start": 19.0, "end": 20.16, "keywords": []}, {"name": "Caption 14 - OFTEN ENOUGH,", "text": "OFTEN ENOUGH,", "file": "clips/captions/14_OFTEN-ENOUGH", "start": 20.12, "end": 20.96, "keywords": ["OFTEN"]}, {"name": "Caption 15 - IT CAN START SHAPING", "text": "IT CAN START SHAPING", "file": "clips/captions/15_IT-CAN-START-SHAPING", "start": 20.92, "end": 22.16, "keywords": ["SHAPING"]}, {"name": "Caption 16 - YOUR DECISIONS", "text": "YOUR DECISIONS", "file": "clips/captions/16_YOUR-DECISIONS", "start": 22.12, "end": 23.04, "keywords": ["DECISIONS"]}, {"name": "Caption 17 - WITHOUT YOU EVEN", "text": "WITHOUT YOU EVEN", "file": "clips/captions/17_WITHOUT-YOU-EVEN", "start": 23.0, "end": 24.0, "keywords": []}, {"name": "Caption 18 - REALIZING IT.", "text": "REALIZING IT.", "file": "clips/captions/18_REALIZING-IT", "start": 23.96, "end": 25.04, "keywords": ["REALIZING"]}, {"name": "Caption 19 - OF COURSE,", "text": "OF COURSE,", "file": "clips/captions/19_OF-COURSE", "start": 25.0, "end": 25.68, "keywords": []}, {"name": "Caption 20 - YOUR CIRCUMSTANCES MATTER", "text": "YOUR CIRCUMSTANCES MATTER", "file": "clips/captions/20_YOUR-CIRCUMSTANCES-MATTER", "start": 25.64, "end": 27.28, "keywords": ["CIRCUMSTANCES"]}, {"name": "Caption 21 - AND YOU CAN'T", "text": "AND YOU CAN'T", "file": "clips/captions/21_AND-YOU-CAN-T", "start": 27.24, "end": 28.08, "keywords": []}, {"name": "Caption 22 - CONTROL EVERYTHING.", "text": "CONTROL EVERYTHING.", "file": "clips/captions/22_CONTROL-EVERYTHING", "start": 28.04, "end": 29.2, "keywords": ["EVERYTHING."]}, {"name": "Caption 23 - BUT YOU CAN START", "text": "BUT YOU CAN START", "file": "clips/captions/23_BUT-YOU-CAN-START", "start": 29.16, "end": 30.24, "keywords": []}, {"name": "Caption 24 - QUESTIONING", "text": "QUESTIONING", "file": "clips/captions/24_QUESTIONING", "start": 30.2, "end": 30.88, "keywords": ["QUESTIONING"]}, {"name": "Caption 25 - THOSE OLD BELIEFS.", "text": "THOSE OLD BELIEFS.", "file": "clips/captions/25_THOSE-OLD-BELIEFS", "start": 30.84, "end": 32.08, "keywords": ["OLD", "BELIEFS."]}, {"name": "Caption 26 - YOU CAN CHANGE", "text": "YOU CAN CHANGE", "file": "clips/captions/26_YOU-CAN-CHANGE", "start": 32.04, "end": 32.8, "keywords": ["CHANGE"]}, {"name": "Caption 27 - THE HABITS THEY'VE CREATED,", "text": "THE HABITS THEY'VE CREATED,", "file": "clips/captions/27_THE-HABITS-THEY-VE-CREATED", "start": 32.76, "end": 34.32, "keywords": ["HABITS"]}, {"name": "Caption 28 - AND THAT'S SOMETHING", "text": "AND THAT'S SOMETHING", "file": "clips/captions/28_AND-THAT-S-SOMETHING", "start": 34.28, "end": 35.28, "keywords": []}, {"name": "Caption 29 - YOU CAN BEGIN TODAY.", "text": "YOU CAN BEGIN TODAY.", "file": "clips/captions/29_YOU-CAN-BEGIN-TODAY", "start": 35.24, "end": 36.72, "keywords": ["BEGIN", "TODAY."]}, {"name": "Caption 30 - WANT TO UNDERSTAND", "text": "WANT TO UNDERSTAND", "file": "clips/captions/30_WANT-TO-UNDERSTAND", "start": 36.68, "end": 37.52, "keywords": []}, {"name": "Caption 31 - WHICH MONEY BELIEFS", "text": "WHICH MONEY BELIEFS", "file": "clips/captions/31_WHICH-MONEY-BELIEFS", "start": 37.48, "end": 38.64, "keywords": ["MONEY", "BELIEFS"]}, {"name": "Caption 32 - MIGHT BE HOLDING", "text": "MIGHT BE HOLDING", "file": "clips/captions/32_MIGHT-BE-HOLDING", "start": 38.6, "end": 39.36, "keywords": ["HOLDING"]}, {"name": "Caption 33 - YOU BACK?", "text": "YOU BACK?", "file": "clips/captions/33_YOU-BACK", "start": 39.32, "end": 40.0, "keywords": ["BACK?"]}, {"name": "Caption 34 - START WITH THE FREE", "text": "START WITH THE FREE", "file": "clips/captions/34_START-WITH-THE-FREE", "start": 39.96, "end": 41.12, "keywords": ["FREE"]}, {"name": "Caption 35 - ONE HOUR TRAINING.", "text": "ONE HOUR TRAINING.", "file": "clips/captions/35_ONE-HOUR-TRAINING", "start": 41.08, "end": 42.16, "keywords": ["ONE", "HOUR"]}, {"name": "Caption 36 - CLICK THE LINK BELOW.", "text": "CLICK THE LINK BELOW.", "file": "clips/captions/36_CLICK-THE-LINK-BELOW", "start": 42.12, "end": 43.32, "keywords": ["CLICK", "LINK"]}];
    var SFX = [{"label": "c1 in", "file": "whoosh.mp3", "start": 0.44, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "coin rain on money", "file": "sparkle.mp3", "start": 1.24, "dur": 1.8, "in": 0.0, "vol": 0.034}, {"label": "MONEY IS EVERYWHERE chip", "file": "pop.mp3", "start": 1.79, "dur": 0.72, "in": 0.0, "vol": 0.098}, {"label": "c1 out", "file": "whoosh-short.mp3", "start": 2.14, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c2 in", "file": "whoosh.mp3", "start": 6.64, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "progress bar", "file": "click-soft.mp3", "start": 8.06, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "padlock slams", "file": "impact-bass-1.mp3", "start": 8.72, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "c2 out", "file": "whoosh-short.mp3", "start": 8.9, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c3 in", "file": "whoosh.mp3", "start": 10.78, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "rewind", "file": "glitch-2.mp3", "start": 10.78, "dur": 0.7, "in": 0.9, "vol": 0.016}, {"label": "speech bubbles", "file": "pop.mp3", "start": 11.95, "dur": 0.72, "in": 0.0, "vol": 0.092}, {"label": "c4 in", "file": "whoosh-short.mp3", "start": 12.98, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "HARD", "file": "impact-bass-1.mp3", "start": 13.76, "dur": 2.12, "in": 0.0, "vol": 0.022}, {"label": "card 2", "file": "whoosh-short.mp3", "start": 14.72, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "SELFISH", "file": "impact-bass-1.mp3", "start": 15.76, "dur": 2.12, "in": 0.0, "vol": 0.022}, {"label": "card 3", "file": "whoosh-short.mp3", "start": 16.56, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "NEVER", "file": "impact-bass-1.mp3", "start": 17.76, "dur": 2.12, "in": 0.0, "vol": 0.028}, {"label": "NEVER glitch", "file": "glitch-2.mp3", "start": 17.56, "dur": 0.6, "in": 0.9, "vol": 0.012}, {"label": "c4 out", "file": "whoosh-short.mp3", "start": 18.72, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c5 in", "file": "whoosh.mp3", "start": 21.08, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "strings pull", "file": "whoosh-short.mp3", "start": 22.16, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "glint on realizing", "file": "sparkle.mp3", "start": 23.96, "dur": 1.8, "in": 0.0, "vol": 0.028}, {"label": "c5 out", "file": "whoosh-short.mp3", "start": 24.6, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c6 in", "file": "whoosh.mp3", "start": 28.98, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "question mark", "file": "impact-bass-1.mp3", "start": 30.16, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "cracks", "file": "click-soft.mp3", "start": 31.02, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "cards split", "file": "click-soft.mp3", "start": 31.34, "dur": 0.37, "in": 0.0, "vol": 0.092}, {"label": "c7 in", "file": "whoosh-short.mp3", "start": 31.8, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "loop snaps open", "file": "whoosh-short.mp3", "start": 32.32, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "step 1", "file": "click-soft.mp3", "start": 32.94, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "step 2", "file": "click-soft.mp3", "start": 33.14, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "NEW HABITS chip", "file": "pop.mp3", "start": 33.23, "dur": 0.72, "in": 0.0, "vol": 0.092}, {"label": "calendar flips", "file": "whoosh-short.mp3", "start": 35.52, "dur": 0.57, "in": 0.0, "vol": 0.061}, {"label": "DAY 1 stamp", "file": "impact-bass-1.mp3", "start": 36.0, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "gold burst", "file": "sparkle.mp3", "start": 36.04, "dur": 1.8, "in": 0.0, "vol": 0.034}, {"label": "c7 out", "file": "whoosh-short.mp3", "start": 36.2, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "c8 in", "file": "whoosh.mp3", "start": 39.78, "dur": 0.57, "in": 0.0, "vol": 0.073}, {"label": "FREE stamp", "file": "impact-bass-1.mp3", "start": 40.64, "dur": 2.12, "in": 0.0, "vol": 0.024}, {"label": "FREE burst", "file": "sparkle.mp3", "start": 40.68, "dur": 1.8, "in": 0.0, "vol": 0.031}, {"label": "clock sweep", "file": "click-soft.mp3", "start": 41.1, "dur": 0.37, "in": 0.0, "vol": 0.086}, {"label": "c8 out", "file": "whoosh-short.mp3", "start": 41.8, "dur": 0.57, "in": 0.0, "vol": 0.067}, {"label": "CLICK THE LINK BELOW button", "file": "pop.mp3", "start": 42.03, "dur": 0.72, "in": 0.0, "vol": 0.098}, {"label": "button tap", "file": "click-soft.mp3", "start": 42.62, "dur": 0.37, "in": 0.0, "vol": 0.104}, {"label": "chevrons", "file": "sparkle.mp3", "start": 42.86, "dur": 0.46, "in": 0.0, "vol": 0.028}];

    var root = $.fileName ? (new File($.fileName)).parent : null;
    function isKit(f) { return !!f && ((new Folder(f.fsName + "/clips")).exists || (new Folder(f.fsName + "/audio")).exists); }
    if (!isKit(root)) {
        var picked = Folder.selectDialog("Select the Avatar Video 2 timeline kit folder (the one that contains clips and audio)");
        if (!picked) { alert("No kit folder selected. Nothing was built."); return; }
        root = picked;
        if (!isKit(root) && !confirm("This folder has no clips or audio folder:\n" + root.fsName + "\nBuild the comp anyway (footage only)?")) return;
    }
    function kit(rel) { return new File(root.fsName + "/" + rel); }
    function firstExisting(list) {
        for (var i = 0; i < list.length; i++) { var f = kit(list[i]); if (f.exists) return f; }
        return null;
    }
    var missing = [], seenMissing = {};
    function noteMissing(rel) { if (!seenMissing[rel]) { seenMissing[rel] = true; missing.push(rel); } }

    // ---- footage first, so cancelling leaves the project untouched
    var footFile = firstExisting(["footage/Avatar_Video_1080p_1_1.mp4", "footage/avatar-video-2.mp4"]);
    if (!footFile) footFile = File.openDialog("Select the original video (Avatar_Video_1080p_1_1.mp4)");
    if (!footFile) { alert("No footage selected. Nothing was built."); return; }

    app.beginUndoGroup("Build Avatar Video 2 timeline");
    try {
    if (!app.project) app.newProject();
    var proj = app.project;
    var bin = proj.items.addFolder("Avatar Video 2 timeline");
    var animBin = proj.items.addFolder("Animation clips"); animBin.parentFolder = bin;
    var capBin = proj.items.addFolder("Caption clips"); capBin.parentFolder = bin;
    var sfxBin = proj.items.addFolder("Sound effects"); sfxBin.parentFolder = bin;

    var importFile = function (file, parent) {
        var item = proj.importFile(new ImportOptions(file));
        item.parentFolder = parent || bin;
        return item;
    };
    var db = function (gain) { return 20 * Math.log(gain) / Math.LN10; };

    var comp = proj.items.addComp("Avatar Video 2 - Timeline", 1080, 1920, 1, DUR, FPS);
    comp.parentFolder = bin;
    comp.bgColor = [0.07, 0.024, 0.1];

    // ---- audio first, so it ends up at the bottom of the layer stack
    // sound effects: one layer per cue, at its time and level
    var sfxItems = {};
    for (var s = SFX.length - 1; s >= 0; s--) {
        var cue = SFX[s];
        var sf = kit("audio/sfx/" + cue.file);
        if (!sf.exists) { noteMissing("audio/sfx/" + cue.file); continue; }
        if (!sfxItems[cue.file]) sfxItems[cue.file] = importFile(sf, sfxBin);
        var L2 = comp.layers.add(sfxItems[cue.file]);
        L2.name = "SFX: " + cue.label;
        L2.label = 8;
        L2.startTime = cue.start - cue["in"];
        L2.inPoint = cue.start;
        L2.outPoint = Math.min(cue.start + cue.dur, DUR, L2.startTime + sfxItems[cue.file].duration);
        L2.audio.audioLevels.setValue([db(cue.vol), db(cue.vol)]);
    }
    // music: the voice-ducked stem (as in the video), plus the plain track switched off
    var musicOrig = kit("audio/music-original.mp3");
    if (musicOrig.exists) {
        var mo = comp.layers.add(importFile(musicOrig));
        mo.name = "Music (original, no ducking) - off";
        mo.label = 4;
        mo.audio.audioLevels.setValue([MUSIC_DB, MUSIC_DB]);
        mo.audioEnabled = false;
        mo.outPoint = DUR;
    }
    var musicStem = kit("audio/music-voice-ducked.wav");
    if (musicStem.exists) {
        var mu = comp.layers.add(importFile(musicStem));
        mu.name = "Music (voice-ducked) " + MUSIC_DB + " dB";
        mu.label = 4;
        mu.audio.audioLevels.setValue([MUSIC_DB, MUSIC_DB]);
        mu.outPoint = DUR;
    } else noteMissing("audio/music-voice-ducked.wav");

    // ---- 1. A-roll with the punch-in camera (scale about her face at 500, 660)
    var foot = comp.layers.add(importFile(footFile));
    foot.name = "A-roll (punch-ins)";
    foot.label = 1;
    foot.transform.anchorPoint.setValue([500, 660]);
    foot.transform.position.setValue([500, 660]);
    var sc = foot.transform.scale;
    for (var c = 0; c < CAM.length; c++) {
        var seg = CAM[c], k0, k1;
        k0 = sc.addKey(seg[0]); sc.setValueAtKey(k0, [seg[2] * 100, seg[2] * 100, 100]);
        var tEnd = (c === CAM.length - 1) ? DUR : seg[1] - FRAME;
        k1 = sc.addKey(tEnd); sc.setValueAtKey(k1, [seg[3] * 100, seg[3] * 100, 100]);
    }
    var dims = sc.value.length;
    var ease = function (speed, infl) { var a = []; for (var d = 0; d < dims; d++) a.push(new KeyframeEase(speed, infl)); return a; };
    for (var k = 1; k <= sc.numKeys; k++) {
        var seg2 = CAM[Math.floor((k - 1) / 2)];
        if (k % 2 === 1) {
            sc.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            var outSpeed = seg2[4] === "out" ? Math.abs(seg2[3] - seg2[2]) * 100 / (seg2[1] - seg2[0]) * 1.5 : 0;
            sc.setTemporalEaseAtKey(k, ease(0, 33), ease(outSpeed, seg2[4] === "out" ? 20 : 40));
        } else {
            sc.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.HOLD);
            sc.setTemporalEaseAtKey(k, ease(0, seg2[4] === "out" ? 60 : 40), ease(0, 33));
        }
    }
    if (!foot.hasAudio) alert("The selected video has no audio track, so the voice will be missing. The comp is built anyway.");

    // ---- 2. black gradient behind the captions
    var gradFile = kit("layers/caption-gradient.png");
    if (gradFile.exists) {
        var grad = comp.layers.add(importFile(gradFile));
        grad.name = "Caption gradient";
        grad.label = 15;
        grad.transform.opacity.setValueAtTime(0, 0);
        grad.transform.opacity.setValueAtTime(0.3, 100);
        grad.outPoint = DUR;
    } else noteMissing("layers/caption-gradient.png");

    // ---- 3./4. animation and caption clips: colour clip + hidden luma matte directly above it
    var addClip = function (clip, label, parent) {
        var fill = kit(clip.file + "_fill.mp4"), matte = kit(clip.file + "_matte.mp4");
        if (!fill.exists || !matte.exists) { noteMissing(clip.file + "_fill.mp4 / _matte.mp4"); return null; }
        var F = comp.layers.add(importFile(fill, parent));
        F.name = clip.name;
        F.label = label;
        F.startTime = clip.start;
        if (F.hasAudio) F.audioEnabled = false;
        var M = comp.layers.add(importFile(matte, parent));
        M.name = clip.name + " (matte)";
        M.startTime = clip.start;
        if (M.hasAudio) M.audioEnabled = false;
        if (typeof F.setTrackMatte === "function") F.setTrackMatte(M, TrackMatteType.LUMA);   // AE 23.0+
        else F.trackMatteType = TrackMatteType.LUMA;   // AE 2022: uses the layer directly above (M)
        M.enabled = false;   // hide the matte's own pixels; the matte still applies
        M.shy = true;
        return F;
    };
    for (var a = 0; a < ANIMS.length; a++) addClip(ANIMS[a], 9, animBin);
    for (var q = 0; q < CAPS.length; q++) addClip(CAPS[q], 2, capBin);

    // ---- 5. editable text captions (precomp, switched off)
    var tc = proj.items.addComp("Editable captions (text)", 1080, 1920, 1, DUR, FPS);
    tc.parentFolder = bin;
    for (var t = CAPS.length - 1; t >= 0; t--) {
        var cap = CAPS[t];
        var T = tc.layers.addBoxText([930, 218], cap.text);
        T.name = cap.name;
        var srcProp = T.property("Source Text");
        var doc = srcProp.value;
        doc.resetCharStyle();
        doc.fontSize = 74;
        doc.applyFill = true;
        doc.fillColor = [1, 0.96, 0.918];
        doc.applyStroke = false;
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        try { doc.font = "Montserrat-Black"; } catch (fontErr) {}
        srcProp.setValue(doc);
        T.inPoint = cap.start;
        T.outPoint = cap.end;
        var r = T.sourceRectAtTime(cap.start, false);
        T.transform.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]);
        T.transform.position.setValue([540, 1139]);
        T.transform.scale.setValueAtTime(cap.start, [70, 70, 100]);
        T.transform.scale.setValueAtTime(Math.min(cap.start + 0.2, cap.end), [100, 100, 100]);
        T.transform.opacity.setValueAtTime(cap.start, 0);
        T.transform.opacity.setValueAtTime(Math.min(cap.start + 0.1, cap.end), 100);
        try {
            var sh = T.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
            sh.property("ADBE Drop Shadow-0002").setValue(160);   // opacity (0-255)
            sh.property("ADBE Drop Shadow-0004").setValue(4);     // distance
            sh.property("ADBE Drop Shadow-0005").setValue(18);    // softness
        } catch (shadowErr) {}
    }
    var tcl = comp.layers.add(tc);
    tcl.name = "Editable captions (text) - switch on to use";
    tcl.label = 2;
    tcl.enabled = false;

    // ---- 6. scene markers
    for (var m = 0; m < ANIMS.length; m++) {
        var mv = new MarkerValue(ANIMS[m].name);
        mv.duration = ANIMS[m].end - ANIMS[m].start;
        comp.markerProperty.setValueAtTime(ANIMS[m].start, mv);
    }

    comp.hideShyLayers = true;
    if (sfxBin.numItems === 0) sfxBin.remove();
    comp.openInViewer();
    } catch (err) {
        app.endUndoGroup();
        alert("The build stopped with an error" + (err.line ? " (script line " + err.line + ")" : "") + ":\n" + err.toString());
        return;
    }
    app.endUndoGroup();
    alert(missing.length
        ? "Built \"Avatar Video 2 - Timeline\", but these kit files were not found in\n" + root.fsName + "\nand their layers were skipped:\n- " + missing.join("\n- ")
        : "Built \"Avatar Video 2 - Timeline\".\nMatte layers are shy (hidden in the timeline); click the shy switch to show them.");
})();
