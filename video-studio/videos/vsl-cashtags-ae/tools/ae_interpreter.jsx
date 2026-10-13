/*
 * ae_interpreter.jsx
 *
 * Static ExtendScript (ES3) interpreter for spec.json. SCHEMA.md is the contract.
 * It expects a global SPEC object (the spec.json content) defined before this code;
 * tools/assemble_jsx.py writes "var SPEC = <spec.json>;" followed by this file.
 *
 * What it does, in order:
 *   new project -> folders -> imported assets -> comps (children first) with their layers
 *   (bottom to top, every field) -> comp markers on the main comp -> Render Queue item
 *   -> saves <SPEC.name>.aep next to the script -> writes build_log.txt -> summary alert.
 *
 * Rules kept on purpose:
 *   - ES3 only: no JSON, no Array.prototype.indexOf/forEach/map/filter, no Object.keys,
 *     no String.prototype.trim, no let/const, arrow functions or template strings.
 *   - "in" is a reserved word in ES3, so layer in points are always read as L["in"].
 *   - After every addProperty() AE may invalidate earlier property references on that
 *     layer, so every property is re-acquired from the layer object (which stays valid).
 *   - Every layer is built inside try/catch; optional parts (content, transform, shadow,
 *     blur, mask, karaoke, audio) each have their own try/catch. Failures become warnings.
 */
(function () {
    var EPS = 1e-6;
    var KAPPA = 0.5523;

    var warnings = [];
    var logLines = [];
    var notes = [];
    var stats = {comps: 0, layers: 0, failedLayers: 0, keys: 0, effects: 0, masks: 0, markers: 0, assets: 0};
    var renderInfo = {comp: "", template: "", file: ""};

    var root = null;          // Folder: the package root (folder of this script)
    var proj = null;          // the new Project
    var fps = 30;
    var folders = {};         // folder name -> FolderItem
    var assetItems = {};      // asset id -> FootageItem
    var assetSpecs = {};      // asset id -> spec asset
    var compItems = {};       // comp id -> CompItem
    var fontState = {};       // font name -> true once checked / warned

    var DOC_FIELDS = ["version", "name", "fps", "main", "folders", "assets", "comps", "render", "markers"];
    var ASSET_FIELDS = ["id", "type", "file", "preview", "width", "height", "duration", "folder"];
    var COMP_FIELDS = ["id", "name", "folder", "width", "height", "duration", "bg", "layers"];
    var COMMON_FIELDS = ["name", "type", "in", "out", "anchor", "position", "scale", "rotation", "opacity", "shadow", "blur"];
    var TYPE_FIELDS = {
        "rect": ["size", "radius", "fill", "fillOpacity", "stroke", "strokeWidth", "strokeOpacity"],
        "ellipse": ["size", "fill", "fillOpacity", "stroke", "strokeWidth", "strokeOpacity", "lineCap", "trim"],
        "path": ["paths", "fill", "fillOpacity", "stroke", "strokeWidth", "strokeOpacity", "lineCap", "lineJoin", "trim"],
        "text": ["text", "font", "size", "color", "tracking", "justify", "leading", "karaoke"],
        "image": ["asset"],
        "footage": ["asset", "start", "audio", "audioLevels", "mask"],
        "audio": ["asset", "start", "audioLevels"],
        "comp": ["comp", "start", "mask"]
    };
    var VISUAL_ONLY_FIELDS = ["anchor", "position", "scale", "rotation", "opacity", "shadow", "blur"];

    // Eases (SCHEMA.md): outgoing influence at the segment's start key, incoming influence at its end key.
    var EASES = {
        "out": {kind: "bezier", outInf: 10, inInf: 80},
        "in": {kind: "bezier", outInf: 80, inInf: 10},
        "inout": {kind: "bezier", outInf: 70, inInf: 70},
        "soft": {kind: "bezier", outInf: 100 / 3, inInf: 100 / 3},
        "linear": {kind: "linear"},
        "hold": {kind: "hold"}
    };
    var H264_TEMPLATES = [
        "H.264 - Match Render Settings - 15 Mbps",
        "H.264 - Match Render Settings - 40 Mbps",
        "H.264 - Match Render Settings - 5 Mbps",
        "H.264"
    ];

    // ------------------------------------------------------------------ small helpers

    function errText(e) {
        if (e === null || e === undefined) { return "unknown error"; }
        var s = (e.message !== undefined) ? String(e.message) : String(e);
        if (e.line !== undefined && e.line !== null) { s += " (script line " + e.line + ")"; }
        return s;
    }

    function warn(msg) {
        warnings.push(msg);
        logLines.push("WARNING: " + msg);
        try { $.writeln("WARNING: " + msg); } catch (e) {}
    }

    function info(msg) {
        logLines.push(msg);
    }

    function optional(label, fn) {
        try {
            fn();
        } catch (e) {
            warn(label + " failed: " + errText(e));
        }
    }

    function isArray(v) {
        return Object.prototype.toString.call(v) === "[object Array]";
    }

    function isNum(v) {
        return typeof v === "number" && isFinite(v);
    }

    function isStr(v) {
        return typeof v === "string";
    }

    function has(o, k) {
        return o !== null && o !== undefined && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
    }

    function inList(list, v) {
        if (list === null || list === undefined) { return false; }
        for (var i = 0; i < list.length; i++) {
            if (list[i] === v) { return true; }
        }
        return false;
    }

    function isAnim(v) {
        return v !== null && typeof v === "object" && !isArray(v) && has(v, "k");
    }

    function checkKeys(obj, allowed, where) {
        if (obj === null || typeof obj !== "object") { return; }
        for (var k in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, k)) { continue; }
            if (!inList(allowed, k)) { warn(where + ": unknown field '" + k + "' ignored"); }
        }
    }

    function req(obj, key, where) {
        if (!has(obj, key) || obj[key] === null || obj[key] === undefined) {
            throw new Error(where + ": missing required field '" + key + "'");
        }
        return obj[key];
    }

    function extOf(fileName) {
        var s = String(fileName);
        for (var i = s.length - 1; i > 0; i--) {
            var c = s.charAt(i);
            if (c === ".") { return s.substring(i); }
            if (c === "/" || c === "\\") { return ""; }
        }
        return "";
    }

    function safeFileName(s) {
        var out = String(s).replace(/[^A-Za-z0-9 _.\-]/g, "_");
        return out === "" ? "CASHTAGS_VSL" : out;
    }

    function joinPath(folder, rel) {
        return folder.fsName + "/" + rel;
    }

    // Spec times are frame-aligned but written with a few decimals (14.3667 for frame 431 at 30 fps).
    // In AE an in point or HOLD key at 14.3667 lands after frame 431 (14.36667 s) and shows one
    // frame late, so times within 0.03 frame of the grid are snapped onto it. Values further off
    // (a real sub-frame media offset in "start") are kept as they are.
    function snapT(t) {
        var f = t * fps;
        var r = Math.round(f);
        return (Math.abs(f - r) < 0.03) ? r / fps : t;
    }

    // ------------------------------------------------------------------ value converters
    // Each converts a spec value to the value After Effects expects, or throws.

    function cNum(v) {
        if (!isNum(v)) { throw new Error("expected a number, got " + String(v)); }
        return v;
    }

    function cNonNeg(v) {
        cNum(v);
        if (v < 0) { throw new Error("expected a value >= 0, got " + v); }
        return v;
    }

    function cPositive(v) {
        cNum(v);
        if (!(v > 0)) { throw new Error("expected a value > 0, got " + v); }
        return v;
    }

    function cPercent(v) {
        cNum(v);
        if (v < 0 || v > 100) { throw new Error("expected a percentage 0-100, got " + v); }
        return v;
    }

    function cVec2(v) {
        if (!isArray(v) || v.length !== 2 || !isNum(v[0]) || !isNum(v[1])) {
            throw new Error("expected [x, y], got " + String(v));
        }
        return [v[0], v[1]];
    }

    function cSize(v) {
        var s = cVec2(v);
        if (s[0] < 0 || s[1] < 0) { throw new Error("size must not be negative: " + String(v)); }
        return s;
    }

    function hexToRGB(hex) {
        if (!isStr(hex) || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            throw new Error("expected a colour \"#RRGGBB\", got " + String(hex));
        }
        return [
            parseInt(hex.substring(1, 3), 16) / 255,
            parseInt(hex.substring(3, 5), 16) / 255,
            parseInt(hex.substring(5, 7), 16) / 255
        ];
    }

    function cColor(v) {
        return hexToRGB(v);
    }

    function cDb(v) {
        cNum(v);
        if (v < -192 || v > 24) { throw new Error("audio level must be -192..24 dB, got " + v); }
        return [v, v];
    }

    function roundRectShape(r, radius) {
        if (!isArray(r) || r.length !== 4 || !isNum(r[0]) || !isNum(r[1]) || !isNum(r[2]) || !isNum(r[3])) {
            throw new Error("mask rect must be [x0, y0, x1, y1], got " + String(r));
        }
        var x0 = Math.min(r[0], r[2]);
        var x1 = Math.max(r[0], r[2]);
        var y0 = Math.min(r[1], r[3]);
        var y1 = Math.max(r[1], r[3]);
        var rr = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
        var k = rr * KAPPA;
        var s = new Shape();
        // Clockwise from the left end of the top edge: 4 straight edges, 4 bezier corners.
        s.vertices = [[x0 + rr, y0], [x1 - rr, y0], [x1, y0 + rr], [x1, y1 - rr],
                      [x1 - rr, y1], [x0 + rr, y1], [x0, y1 - rr], [x0, y0 + rr]];
        s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
        s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
        s.closed = true;
        return s;
    }

    function pathShape(p, where) {
        if (p === null || typeof p !== "object" || isArray(p)) { throw new Error(where + ": path must be an object"); }
        checkKeys(p, ["v", "i", "o", "closed"], where);
        var v = p.v;
        if (!isArray(v) || v.length < 2) { throw new Error(where + ": a path needs at least 2 vertices"); }
        var n = v.length;
        var hasI = has(p, "i") && p.i !== null;
        var hasO = has(p, "o") && p.o !== null;
        if (hasI && (!isArray(p.i) || p.i.length !== n)) { throw new Error(where + ": 'i' needs one tangent per vertex"); }
        if (hasO && (!isArray(p.o) || p.o.length !== n)) { throw new Error(where + ": 'o' needs one tangent per vertex"); }
        var verts = [];
        var ins = [];
        var outs = [];
        for (var i = 0; i < n; i++) {
            verts.push(cVec2(v[i]));
            ins.push(hasI ? cVec2(p.i[i]) : [0, 0]);
            outs.push(hasO ? cVec2(p.o[i]) : [0, 0]);
        }
        if (has(p, "closed") && p.closed !== true && p.closed !== false) { warn(where + ": 'closed' must be true or false; using false"); }
        var s = new Shape();
        s.vertices = verts;
        s.inTangents = ins;
        s.outTangents = outs;
        s.closed = (p.closed === true);
        return s;
    }

    // ------------------------------------------------------------------ keyframes

    function easeFor(name, where) {
        if (name === undefined || name === null) { return EASES["out"]; }
        if (!isStr(name) || !has(EASES, name)) {
            warn(where + ": unknown ease '" + String(name) + "', using 'out'");
            return EASES["out"];
        }
        return EASES[name];
    }

    function interpType(ease) {
        if (ease.kind === "hold") { return KeyframeInterpolationType.HOLD; }
        if (ease.kind === "linear") { return KeyframeInterpolationType.LINEAR; }
        return KeyframeInterpolationType.BEZIER;
    }

    // setTemporalEaseAtKey wants one KeyframeEase per dimension for TwoD / ThreeD properties
    // (Scale is ThreeD even on 2D layers) and exactly one for everything else, spatial included.
    function easeDims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) { return 2; }
        if (t === PropertyValueType.ThreeD) { return 3; }
        return 1;
    }

    // Spatial tangents have the property's own dimension: Position / Anchor Point are
    // ThreeD_SPATIAL even on 2D layers (3 numbers), shape Rect Position is TwoD_SPATIAL (2).
    function spatialDims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD_SPATIAL) { return 2; }
        if (t === PropertyValueType.ThreeD_SPATIAL) { return 3; }
        return 0;
    }

    function easeList(n, influence) {
        var a = [];
        for (var i = 0; i < n; i++) { a.push(new KeyframeEase(0, influence)); }
        return a;
    }

    // Sets a static value, or keyframes for an animatable spec value {"k": [[t, v, ease], ...]}.
    // conv converts one spec value to the AE value. Returns the number of keys created.
    function applyAnim(prop, v, conv, where) {
        if (!isAnim(v)) {
            prop.setValue(conv(v));
            return 0;
        }
        var src = v.k;
        if (!isArray(src) || src.length === 0) {
            throw new Error(where + ": keyframe list is empty");
        }
        var keys = [];
        var i;
        for (i = 0; i < src.length; i++) {
            var e = src[i];
            if (!isArray(e) || e.length < 2 || !isNum(e[0])) {
                warn(where + ": key " + i + " is not [time, value, ease]; skipped");
                continue;
            }
            if (keys.length > 0 && snapT(e[0]) <= keys[keys.length - 1].t + EPS) {
                warn(where + ": key " + i + " at " + e[0] + " s is not after the previous key; skipped");
                continue;
            }
            keys.push({t: snapT(e[0]), v: conv(e[1]), ease: (e.length > 2 ? e[2] : null), src: i});
        }
        if (keys.length === 0) { throw new Error(where + ": no usable keys"); }
        if (keys.length === 1) {
            // One key = a constant (the value holds before and after it).
            prop.setValue(keys[0].v);
            return 0;
        }
        var n = keys.length;
        var idx = [];
        for (i = 0; i < n; i++) {
            var k = prop.addKey(keys[i].t);
            prop.setValueAtKey(k, keys[i].v);
            idx.push(k);
        }
        // Keys were added in increasing time order, so each index above is final.
        var segs = [];
        for (i = 0; i < n - 1; i++) { segs.push(easeFor(keys[i].ease, where + " key " + keys[i].src)); }
        var dims = easeDims(prop);
        for (i = 0; i < n; i++) {
            // A middle key takes its in-ease from the previous segment and its out-ease from the next.
            var inSeg = (i > 0) ? segs[i - 1] : segs[0];
            var outSeg = (i < n - 1) ? segs[i] : segs[n - 2];
            var inT = interpType(inSeg);
            var outT = interpType(outSeg);
            prop.setInterpolationTypeAtKey(idx[i], inT, outT);
            if (inSeg.kind === "bezier" || outSeg.kind === "bezier") {
                var inInf = (inSeg.kind === "bezier") ? inSeg.inInf : 100 / 6;
                var outInf = (outSeg.kind === "bezier") ? outSeg.outInf : 100 / 6;
                prop.setTemporalEaseAtKey(idx[i], easeList(dims, inInf), easeList(dims, outInf));
                if (inSeg.kind !== "bezier" || outSeg.kind !== "bezier") {
                    // Setting an ease can turn a LINEAR / HOLD side into BEZIER; put the type back.
                    prop.setInterpolationTypeAtKey(idx[i], inT, outT);
                }
            }
        }
        var sd = spatialDims(prop);
        if (sd > 0) {
            var zero = [];
            for (i = 0; i < sd; i++) { zero.push(0); }
            for (i = 0; i < n; i++) {
                try { prop.setSpatialAutoBezierAtKey(idx[i], false); } catch (e1) {}
                try { prop.setSpatialContinuousAtKey(idx[i], false); } catch (e2) {}
                try {
                    prop.setSpatialTangentsAtKey(idx[i], zero, zero);
                } catch (e3) {
                    warn(where + ": could not straighten the motion path at key " + (i + 1) + ": " + errText(e3));
                }
            }
        }
        stats.keys += n;
        return n;
    }

    // ------------------------------------------------------------------ document checks

    function validateDocument() {
        checkKeys(SPEC, DOC_FIELDS, "spec");
        if (SPEC.version !== 1) {
            warn("spec version is " + String(SPEC.version) + "; this interpreter reads version 1");
        }
        if (!isNum(SPEC.fps) || SPEC.fps < 1 || SPEC.fps > 99) {
            return "spec.fps must be a number between 1 and 99";
        }
        fps = SPEC.fps;
        if (!isArray(SPEC.comps) || SPEC.comps.length === 0) {
            return "spec.comps must be a non-empty list";
        }
        if (has(SPEC, "assets") && !isArray(SPEC.assets)) {
            return "spec.assets must be a list";
        }
        return "";
    }

    // ------------------------------------------------------------------ folders and assets

    function createFolders() {
        var list = has(SPEC, "folders") ? SPEC.folders : [];
        if (!isArray(list)) {
            warn("spec.folders must be a list; no folders created up front");
            return;
        }
        for (var i = 0; i < list.length; i++) {
            var nm = list[i];
            if (!isStr(nm) || nm === "") { warn("spec.folders[" + i + "] is not a folder name"); continue; }
            if (has(folders, nm)) { warn("folder '" + nm + "' is listed twice"); continue; }
            folders[nm] = proj.items.addFolder(nm);
        }
    }

    function setFolder(item, name, where) {
        if (name === undefined || name === null || name === "") { return; }
        if (!isStr(name)) { warn(where + ": folder must be a string"); return; }
        if (!has(folders, name)) {
            warn(where + ": folder '" + name + "' is not in spec.folders; created it");
            folders[name] = proj.items.addFolder(name);
        }
        item.parentFolder = folders[name];
    }

    function importAsset(A, where) {
        var rel = req(A, "file", where);
        var f = new File(joinPath(root, rel));
        if (!f.exists) {
            if (A.type === "footage") {
                var picked = File.openDialog("Locate " + rel + " (not found next to the build script)");
                if (picked === null || picked === undefined) {
                    warn(where + ": footage not found at " + f.fsName + " and no replacement was chosen; layers that use it are skipped");
                    return null;
                }
                warn(where + ": footage not found at " + f.fsName + "; using " + picked.fsName);
                f = picked;
            } else {
                warn(where + ": file not found at " + f.fsName + "; skipped (layers that use it are skipped)");
                return null;
            }
        }
        var io = new ImportOptions(f);
        if (io.canImportAs(ImportAsType.FOOTAGE)) { io.importAs = ImportAsType.FOOTAGE; }
        var item = app.project.importFile(io);
        setFolder(item, A.folder, where);
        if ((A.type === "footage" || A.type === "image") && has(A, "width") && has(A, "height")) {
            if (item.width !== A.width || item.height !== A.height) {
                warn(where + ": imported size " + item.width + "x" + item.height + " differs from the spec's " + A.width + "x" + A.height);
            }
        }
        if ((A.type === "footage" || A.type === "audio") && isNum(A.duration) && Math.abs(item.duration - A.duration) > 0.1) {
            warn(where + ": imported duration " + item.duration + " s differs from the spec's " + A.duration + " s");
        }
        if (A.type === "audio" && !item.hasAudio) { warn(where + ": the file has no audio"); }
        if ((A.type === "footage" || A.type === "image") && !item.hasVideo) { warn(where + ": the file has no picture"); }
        return item;
    }

    function importAssets() {
        var list = has(SPEC, "assets") ? SPEC.assets : [];
        for (var i = 0; i < list.length; i++) {
            var A = list[i];
            var where = "asset " + i;
            try {
                if (A === null || typeof A !== "object" || isArray(A)) { throw new Error("not an object"); }
                if (!isStr(A.id) || A.id === "") { throw new Error("missing id"); }
                where = "asset '" + A.id + "'";
                checkKeys(A, ASSET_FIELDS, where);
                if (has(assetSpecs, A.id)) { throw new Error("duplicate asset id"); }
                if (A.type !== "footage" && A.type !== "image" && A.type !== "audio") {
                    throw new Error("unknown asset type '" + String(A.type) + "'");
                }
                assetSpecs[A.id] = A;
                var item = importAsset(A, where);
                if (item !== null) {
                    assetItems[A.id] = item;
                    stats.assets++;
                    info("Imported " + where + ": " + item.name);
                }
            } catch (e) {
                warn(where + ": import failed: " + errText(e));
            }
        }
    }

    function assetFor(L, type, where) {
        var id = req(L, "asset", where);
        if (!has(assetItems, id)) {
            throw new Error("asset '" + String(id) + "' is not available (missing, failed to import, or not declared)");
        }
        if (assetSpecs[id].type !== type) {
            warn(where + ": asset '" + id + "' is declared as " + assetSpecs[id].type + " but used by a " + type + " layer");
        }
        return assetItems[id];
    }

    function compFor(L, where) {
        var id = req(L, "comp", where);
        if (!has(compItems, id)) {
            throw new Error("comp '" + String(id) + "' is not built before this comp (comps must be listed children first)");
        }
        return compItems[id];
    }

    // ------------------------------------------------------------------ layer timing

    function setTiming(layer, L, type, comp, srcDur, where) {
        var tin = snapT(L["in"]);
        var tout = snapT(L["out"]);
        var half = 0.5 / fps;
        if (type === "footage" || type === "audio" || type === "comp") {
            var st = has(L, "start") ? snapT(cNum(L.start)) : (type === "comp" ? tin : 0);
            // startTime first: it moves the layer, so in/out must be set after it.
            layer.startTime = st;
            if (tin < st - EPS) {
                warn(where + ": in (" + tin + ") is before the source starts (" + st + "); clamped");
                tin = st;
            }
            var end = st + srcDur;
            if (tout > end + EPS) {
                // Up to half a frame over is frame rounding: end with the source (same frames).
                if (tout > end + half) {
                    warn(where + ": out (" + L["out"] + ") is after the source ends (" + end + "); clamped");
                }
                tout = end;
            }
            if (!(tout - tin > EPS)) { throw new Error("no source media between in and out"); }
            layer.inPoint = tin;
            layer.outPoint = tout;
        } else {
            // Shape, text and image layers start at the comp start. Only reset startTime if a
            // preference ("Create Layers at Composition Start Time" off) placed them elsewhere.
            if (Math.abs(layer.startTime) > EPS) { layer.startTime = 0; }
            layer.inPoint = tin;
            layer.outPoint = tout;
        }
    }

    // ------------------------------------------------------------------ transform

    function tf(layer) {
        return layer.property("ADBE Transform Group");
    }

    function defaultAnchor(layer, type) {
        if (type === "image" || type === "footage" || type === "comp") {
            return [layer.source.width / 2, layer.source.height / 2];
        }
        return [0, 0];
    }

    function defaultPosition(type, comp) {
        if (type === "path") { return [0, 0]; }
        if (type === "image" || type === "footage" || type === "comp") { return [comp.width / 2, comp.height / 2]; }
        return null;
    }

    function setTransform(layer, L, type, comp, where) {
        var anchor = has(L, "anchor") ? L.anchor : defaultAnchor(layer, type);
        if (isAnim(anchor)) {
            warn(where + ": anchor must be static; using its first key");
            anchor = anchor.k[0][1];
        }
        tf(layer).property("ADBE Anchor Point").setValue(cVec2(anchor));
        var pos = has(L, "position") ? L.position : defaultPosition(type, comp);
        if (pos === null) {
            warn(where + ": position is required for " + type + " layers; using the comp centre");
            pos = [comp.width / 2, comp.height / 2];
        }
        applyAnim(tf(layer).property("ADBE Position"), pos, cVec2, where + ".position");
        if (has(L, "scale")) { applyAnim(tf(layer).property("ADBE Scale"), L.scale, cVec2, where + ".scale"); }
        if (has(L, "rotation")) { applyAnim(tf(layer).property("ADBE Rotate Z"), L.rotation, cNum, where + ".rotation"); }
        if (has(L, "opacity")) { applyAnim(tf(layer).property("ADBE Opacity"), L.opacity, cPercent, where + ".opacity"); }
    }

    // ------------------------------------------------------------------ shape layers

    function vectorsOf(layer) {
        return layer.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    }

    function lineCapValue(v, where) {
        if (v === undefined || v === null || v === "butt") { return 1; }
        if (v === "round") { return 2; }
        if (v === "square") { return 3; }
        warn(where + ": unknown lineCap '" + String(v) + "', using butt");
        return 1;
    }

    function lineJoinValue(v, where) {
        if (v === undefined || v === null || v === "round") { return 2; }
        if (v === "miter") { return 1; }
        if (v === "bevel") { return 3; }
        warn(where + ": unknown lineJoin '" + String(v) + "', using round");
        return 2;
    }

    // One group holding the shape(s), then Trim Paths, then Stroke, then Fill. Items lower in the
    // group render first, so the Stroke (index above the Fill) draws over the Fill.
    function buildShapeContents(layer, L, type, where) {
        var grp = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        grp.name = L.name;
        var item;
        if (type === "rect") {
            item = vectorsOf(layer).addProperty("ADBE Vector Shape - Rect");
            applyAnim(item.property("ADBE Vector Rect Size"), req(L, "size", where), cSize, where + ".size");
            if (has(L, "radius")) {
                applyAnim(item.property("ADBE Vector Rect Roundness"), L.radius, cNonNeg, where + ".radius");
            }
        } else if (type === "ellipse") {
            item = vectorsOf(layer).addProperty("ADBE Vector Shape - Ellipse");
            applyAnim(item.property("ADBE Vector Ellipse Size"), req(L, "size", where), cSize, where + ".size");
        } else {
            var paths = req(L, "paths", where);
            if (!isArray(paths) || paths.length === 0) { throw new Error(where + ": paths must be a non-empty list"); }
            for (var i = 0; i < paths.length; i++) {
                var shp = pathShape(paths[i], where + ".paths[" + i + "]");
                item = vectorsOf(layer).addProperty("ADBE Vector Shape - Group");
                item.property("ADBE Vector Shape").setValue(shp);
            }
        }
        var hasFill = has(L, "fill") && L.fill !== null;
        var hasStroke = has(L, "stroke") && L.stroke !== null;
        if (has(L, "trim") && L.trim !== null) {
            var T = L.trim;
            checkKeys(T, ["start", "end"], where + ".trim");
            var tr = vectorsOf(layer).addProperty("ADBE Vector Filter - Trim");
            tr.property("ADBE Vector Trim Type").setValue(1);   // Simultaneously: one trim over every path
            applyAnim(tr.property("ADBE Vector Trim Start"), has(T, "start") ? T.start : 0, cPercent, where + ".trim.start");
            applyAnim(tr.property("ADBE Vector Trim End"), has(T, "end") ? T.end : 100, cPercent, where + ".trim.end");
            if (hasFill) { warn(where + ": Trim Paths also trims the fill in After Effects (the HTML preview only trims the stroke)"); }
        }
        if (hasStroke) {
            var st = vectorsOf(layer).addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(hexToRGB(L.stroke));
            var sw = 1;
            if (has(L, "strokeWidth")) { sw = cNonNeg(L.strokeWidth); } else { warn(where + ": stroke without strokeWidth; using 1"); }
            st.property("ADBE Vector Stroke Width").setValue(sw);
            if (has(L, "strokeOpacity")) {
                applyAnim(st.property("ADBE Vector Stroke Opacity"), L.strokeOpacity, cPercent, where + ".strokeOpacity");
            }
            if (type !== "rect") { st.property("ADBE Vector Stroke Line Cap").setValue(lineCapValue(L.lineCap, where)); }
            if (type === "path") { st.property("ADBE Vector Stroke Line Join").setValue(lineJoinValue(L.lineJoin, where)); }
        }
        if (hasFill) {
            var fl = vectorsOf(layer).addProperty("ADBE Vector Graphic - Fill");
            applyAnim(fl.property("ADBE Vector Fill Color"), L.fill, cColor, where + ".fill");
            if (has(L, "fillOpacity")) {
                applyAnim(fl.property("ADBE Vector Fill Opacity"), L.fillOpacity, cPercent, where + ".fillOpacity");
            }
        }
    }

    // ------------------------------------------------------------------ text layers

    function textForAE(s, where) {
        if (!isStr(s)) { throw new Error(where + ": text must be a string"); }
        return s.split("\r\n").join("\r").split("\n").join("\r");
    }

    function justificationValue(j, where) {
        if (j === undefined || j === null || j === "left") { return ParagraphJustification.LEFT_JUSTIFY; }
        if (j === "center") { return ParagraphJustification.CENTER_JUSTIFY; }
        if (j === "right") { return ParagraphJustification.RIGHT_JUSTIFY; }
        warn(where + ": unknown justify '" + String(j) + "', using left");
        return ParagraphJustification.LEFT_JUSTIFY;
    }

    function fontProblem(font, reason) {
        if (fontState[font] === "warned") { return; }
        fontState[font] = "warned";
        warn("Font '" + font + "' " + reason + ". Install the Inter OTFs from the Fonts folder, restart After Effects and run the build again.");
    }

    function checkFontInstalled(font) {
        if (has(fontState, font)) { return; }
        fontState[font] = "checked";
        try {
            // app.fonts exists in After Effects 24.0 and later.
            if (app.fonts && app.fonts.getFontsByPostScriptName) {
                var found = app.fonts.getFontsByPostScriptName(font);
                if (!found || found.length === 0) { fontProblem(font, "is not installed"); }
            }
        } catch (e) {}
    }

    function textDocProp(layer) {
        return layer.property("ADBE Text Properties").property("ADBE Text Document");
    }

    function styleText(layer, L, where) {
        var font = req(L, "font", where);
        if (!isStr(font) || font === "") { throw new Error(where + ": font must be a PostScript name"); }
        var size = cPositive(req(L, "size", where));
        var color = hexToRGB(req(L, "color", where));
        var tracking = has(L, "tracking") ? cNum(L.tracking) : 0;
        var leading = has(L, "leading") ? cPositive(L.leading) : Math.round(size * 1.2);
        checkFontInstalled(font);
        // A TextDocument is a value: edit a copy, then write it back with setValue.
        var td = textDocProp(layer).value;
        try { td.resetCharStyle(); } catch (e0) {}
        try { td.resetParagraphStyle(); } catch (e1) {}
        td.font = font;
        td.fontSize = size;
        td.applyFill = true;
        td.fillColor = color;
        td.applyStroke = false;
        td.tracking = tracking;
        td.justification = justificationValue(L.justify, where);
        var leadingOk = true;
        try {
            td.autoLeading = false;
            td.leading = leading;
        } catch (e2) {
            leadingOk = false;
        }
        textDocProp(layer).setValue(td);
        if (!leadingOk) { warn(where + ": this After Effects version cannot set a fixed leading from a script; auto leading is used"); }
        var back = textDocProp(layer).value;
        if (back.font !== font) { fontProblem(font, "was replaced by '" + back.font + "'"); }
    }

    function countWordsAE(s) {
        var parts = String(s).split(/[ \t\r\n]+/);
        var n = 0;
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] !== "") { n++; }
        }
        return n;
    }

    function animatorsOf(layer) {
        return layer.property("ADBE Text Properties").property("ADBE Text Animators");
    }

    // Words are dim until their time: an animator sets Fill Color = dim on a Range Selector
    // (Index units, based on Words, Square shape) from Start to End = word count; Start steps
    // up with HOLD keys so each spoken word drops out of the selection and shows its own colour.
    function addKaraoke(layer, L, where) {
        var K = L.karaoke;
        if (K === null || typeof K !== "object" || isArray(K)) { throw new Error("karaoke must be an object"); }
        checkKeys(K, ["dim", "times"], where + ".karaoke");
        var dim = hexToRGB(req(K, "dim", where + ".karaoke"));
        var times = req(K, "times", where + ".karaoke");
        if (!isArray(times)) { throw new Error("karaoke.times must be a list"); }
        var words = String(L.text).split(" ");
        var aeWords = countWordsAE(L.text);
        if (times.length !== words.length) {
            warn(where + ": karaoke has " + times.length + " times for " + words.length + " words");
        }
        if (aeWords !== words.length) {
            warn(where + ": After Effects counts " + aeWords + " words (line breaks or repeated spaces) but the spec splits " + words.length + "; the highlight would drift");
        }
        var keys = [[0, 0, "hold"]];
        for (var i = 0; i < times.length; i++) {
            var t = snapT(cNum(times[i]));
            var last = keys[keys.length - 1];
            if (t < last[0] - EPS) {
                warn(where + ": karaoke time " + i + " (" + t + ") is earlier than the previous one; using the previous time");
                last[1] = i + 1;
            } else if (t <= last[0] + EPS) {
                last[1] = i + 1;
            } else {
                keys.push([t, i + 1, "hold"]);
            }
        }
        var an = animatorsOf(layer).addProperty("ADBE Text Animator");
        var aIdx = an.propertyIndex;
        an.name = "Karaoke";
        var fillC = animatorsOf(layer).property(aIdx).property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
        fillC.setValue(dim);
        var sel = animatorsOf(layer).property(aIdx).property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var adv = sel.property("ADBE Text Range Advanced");
        // Units and Based On first: the Index Start / End properties only apply in Index units.
        adv.property("ADBE Text Range Units").setValue(2);    // Index
        adv.property("ADBE Text Range Type2").setValue(3);    // Words
        adv.property("ADBE Text Range Shape").setValue(1);    // Square
        sel.property("ADBE Text Index End").setValue(words.length);
        applyAnim(sel.property("ADBE Text Index Start"), (keys.length > 1) ? {k: keys} : keys[0][1], cNum, where + ".karaoke");
    }

    // ------------------------------------------------------------------ effects, masks, audio

    function setRanged(prop, v, where) {
        var x = v;
        if (prop.hasMax && x > prop.maxValue) {
            warn(where + ": " + x + " is above the After Effects maximum " + prop.maxValue + "; clamped");
            x = prop.maxValue;
        }
        if (prop.hasMin && x < prop.minValue) {
            warn(where + ": " + x + " is below the After Effects minimum " + prop.minValue + "; clamped");
            x = prop.minValue;
        }
        prop.setValue(x);
    }

    function addShadow(layer, S, where) {
        if (S === null || typeof S !== "object" || isArray(S)) { throw new Error("shadow must be an object"); }
        checkKeys(S, ["color", "opacity", "direction", "distance", "softness"], where + ".shadow");
        var color = hexToRGB(req(S, "color", where + ".shadow"));
        var opacity = cPercent(req(S, "opacity", where + ".shadow"));
        var direction = cNum(req(S, "direction", where + ".shadow"));
        var distance = cNonNeg(req(S, "distance", where + ".shadow"));
        var softness = cNonNeg(req(S, "softness", where + ".shadow"));
        var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
        fx.property("ADBE Drop Shadow-0001").setValue(color);
        // Drop Shadow stores opacity as 0-255 internally (the UI shows %): scale by the real range.
        var op = fx.property("ADBE Drop Shadow-0002");
        var opv = opacity;
        if (op.hasMax && op.maxValue > 100 + EPS) { opv = opacity * op.maxValue / 100; }
        op.setValue(opv);
        fx.property("ADBE Drop Shadow-0003").setValue(direction);
        setRanged(fx.property("ADBE Drop Shadow-0004"), distance, where + ".shadow.distance");
        setRanged(fx.property("ADBE Drop Shadow-0005"), softness, where + ".shadow.softness");
        stats.effects++;
    }

    function addBlur(layer, B, where) {
        var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        fx.property("ADBE Gaussian Blur 2-0003").setValue(0);   // Repeat Edge Pixels off
        applyAnim(fx.property("ADBE Gaussian Blur 2-0001"), B, cNonNeg, where + ".blur");
        stats.effects++;
    }

    function addMask(layer, M, where) {
        if (M === null || typeof M !== "object" || isArray(M)) { throw new Error("mask must be an object"); }
        checkKeys(M, ["rect", "radius"], where + ".mask");
        var radius = has(M, "radius") ? cNonNeg(M.radius) : 0;
        var rect = req(M, "rect", where + ".mask");
        var mk = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        mk.maskMode = MaskMode.ADD;
        applyAnim(mk.property("ADBE Mask Shape"), rect, function (r) { return roundRectShape(r, radius); }, where + ".mask.rect");
        stats.masks++;
    }

    function setAudio(layer, L, where) {
        if (has(L, "audio") && L.audio !== true && L.audio !== false) {
            warn(where + ": audio must be true or false; left on");
        }
        if (L.audio === false && layer.hasAudio) {
            layer.audioEnabled = false;
        }
        if (has(L, "audioLevels")) {
            if (!layer.hasAudio) {
                warn(where + ": audioLevels ignored: the source has no audio");
                return;
            }
            applyAnim(layer.property("ADBE Audio Group").property("ADBE Audio Levels"), L.audioLevels, cDb, where + ".audioLevels");
        }
    }

    // ------------------------------------------------------------------ layers

    function buildLayer(comp, C, L, j, names) {
        var where = "comp '" + C.id + "' layer " + j;
        if (L === null || typeof L !== "object" || isArray(L)) { throw new Error(where + ": not an object"); }
        if (isStr(L.name)) { where += " '" + L.name + "'"; }
        var type = L.type;
        if (!isStr(type) || !has(TYPE_FIELDS, type)) { throw new Error(where + ": unknown layer type '" + String(type) + "'"); }
        checkKeys(L, COMMON_FIELDS.concat(TYPE_FIELDS[type]), where);
        if (!isStr(L.name) || L.name === "") { throw new Error(where + ": missing name"); }
        if (has(names, L.name)) { warn(where + ": duplicate layer name in this comp"); }
        names[L.name] = true;
        var tin = L["in"];
        var tout = L["out"];
        if (!isNum(tin) || !isNum(tout)) { throw new Error(where + ": in and out must be numbers"); }
        if (!(tout - tin > EPS)) { throw new Error(where + ": out (" + tout + ") must be after in (" + tin + ")"); }

        var layer = null;
        var srcDur = 0;
        if (type === "rect" || type === "ellipse" || type === "path") {
            layer = comp.layers.addShape();
        } else if (type === "text") {
            layer = comp.layers.addText(textForAE(req(L, "text", where), where));
        } else if (type === "image") {
            layer = comp.layers.add(assetFor(L, "image", where), comp.duration);
        } else if (type === "footage" || type === "audio") {
            var av = assetFor(L, type, where);
            layer = comp.layers.add(av);
            srcDur = av.duration;
        } else {
            var src = compFor(L, where);
            layer = comp.layers.add(src);
            srcDur = src.duration;
        }
        layer.name = L.name;
        setTiming(layer, L, type, comp, srcDur, where);

        if (type === "rect" || type === "ellipse" || type === "path") {
            optional(where + ": shape contents", function () { buildShapeContents(layer, L, type, where); });
        } else if (type === "text") {
            optional(where + ": text style", function () { styleText(layer, L, where); });
            if (has(L, "karaoke") && L.karaoke !== null) {
                optional(where + ": karaoke", function () { addKaraoke(layer, L, where); });
            }
        }

        if (type === "audio") {
            for (var i = 0; i < VISUAL_ONLY_FIELDS.length; i++) {
                if (has(L, VISUAL_ONLY_FIELDS[i])) { warn(where + ": '" + VISUAL_ONLY_FIELDS[i] + "' ignored on an audio layer"); }
            }
        } else {
            optional(where + ": transform", function () { setTransform(layer, L, type, comp, where); });
            // Effect order: Drop Shadow, then Gaussian Blur (the blur also softens the shadow).
            if (has(L, "shadow") && L.shadow !== null) {
                optional(where + ": shadow", function () { addShadow(layer, L.shadow, where); });
            }
            if (has(L, "blur") && L.blur !== null) {
                optional(where + ": blur", function () { addBlur(layer, L.blur, where); });
            }
            if (has(L, "mask") && L.mask !== null) {
                optional(where + ": mask", function () { addMask(layer, L.mask, where); });
            }
        }
        if (type === "footage" || type === "audio") {
            optional(where + ": audio", function () { setAudio(layer, L, where); });
        }
    }

    // ------------------------------------------------------------------ comps

    function createComp(C, idx) {
        if (C === null || typeof C !== "object" || isArray(C)) { throw new Error("comp " + idx + " is not an object"); }
        if (!isStr(C.id) || C.id === "") { throw new Error("comp " + idx + " has no id"); }
        var where = "comp '" + C.id + "'";
        checkKeys(C, COMP_FIELDS, where);
        if (has(compItems, C.id)) { throw new Error(where + ": duplicate comp id"); }
        var w = Math.round(cPositive(req(C, "width", where)));
        var h = Math.round(cPositive(req(C, "height", where)));
        var d = snapT(cPositive(req(C, "duration", where)));
        var name = (isStr(C.name) && C.name !== "") ? C.name : C.id;
        var comp = proj.items.addComp(name, w, h, 1, d, fps);
        compItems[C.id] = comp;
        stats.comps++;
        optional(where + ": background colour", function () { comp.bgColor = hexToRGB(req(C, "bg", where)); });
        optional(where + ": folder", function () { setFolder(comp, C.folder, where); });
        var layers = has(C, "layers") ? C.layers : [];
        if (!isArray(layers)) {
            warn(where + ": layers must be a list");
            layers = [];
        }
        var names = {};
        // Layers are listed bottom to top; each add puts the new layer on top.
        for (var j = 0; j < layers.length; j++) {
            try {
                buildLayer(comp, C, layers[j], j, names);
                stats.layers++;
            } catch (e) {
                stats.failedLayers++;
                warn("comp '" + C.id + "' layer " + j + " failed: " + errText(e));
            }
        }
        info("Comp '" + name + "' (" + C.id + ") " + w + "x" + h + ", " + d + " s: " + comp.numLayers + " of " + layers.length + " layers built");
    }

    function createComps() {
        for (var i = 0; i < SPEC.comps.length; i++) {
            try {
                createComp(SPEC.comps[i], i);
            } catch (e) {
                warn("comp " + i + " not created: " + errText(e));
            }
        }
    }

    // ------------------------------------------------------------------ markers, render queue

    function addMarkers(main) {
        if (!has(SPEC, "markers") || SPEC.markers === null) { return; }
        var list = SPEC.markers;
        if (!isArray(list)) { warn("spec.markers must be a list"); return; }
        for (var i = 0; i < list.length; i++) {
            var m = list[i];
            if (!isArray(m) || m.length < 2 || !isNum(m[0])) { warn("marker " + i + " is not [time, comment]"); continue; }
            if (m[0] < -EPS || m[0] > main.duration + EPS) { warn("marker " + i + " at " + m[0] + " s is outside the main comp"); }
            try {
                main.markerProperty.setValueAtTime(snapT(m[0]), new MarkerValue(String(m[1])));
                stats.markers++;
            } catch (e) {
                warn("marker " + i + " failed: " + errText(e));
            }
        }
    }

    function addRenderQueue() {
        var R = has(SPEC, "render") ? SPEC.render : null;
        if (R !== null && typeof R === "object") { checkKeys(R, ["comp", "output"], "spec.render"); } else { R = {}; }
        var compId = isStr(R.comp) ? R.comp : SPEC.main;
        if (!has(compItems, compId)) { warn("render comp '" + String(compId) + "' was not built; nothing added to the Render Queue"); return; }
        var rqi = app.project.renderQueue.items.add(compItems[compId]);
        renderInfo.comp = compItems[compId].name;
        var om = rqi.outputModule(1);
        var available = null;
        try { available = om.templates; } catch (e0) { available = null; }
        var applied = "";
        for (var i = 0; i < H264_TEMPLATES.length && applied === ""; i++) {
            if (available !== null && available !== undefined && !inList(available, H264_TEMPLATES[i])) { continue; }
            try {
                om.applyTemplate(H264_TEMPLATES[i]);
                applied = H264_TEMPLATES[i];
            } catch (e1) {}
        }
        renderInfo.template = (applied !== "") ? applied : "default output module";
        if (applied === "") {
            notes.push("No H.264 output-module template was found (After Effects 2023 or later has one); the Render Queue item keeps the default output module.");
        }
        if (isStr(R.output) && R.output !== "") {
            var ext = "";
            if (applied !== "") {
                ext = ".mp4";
            } else {
                try { if (om.file) { ext = extOf(om.file.name); } } catch (e2) { ext = ""; }
            }
            if (ext !== "") {
                om.file = new File(joinPath(root, R.output + ext));
                renderInfo.file = om.file.fsName;
            } else {
                notes.push("The render output keeps After Effects' default file name.");
            }
        }
    }

    // ------------------------------------------------------------------ build, save, log

    function buildProject(title) {
        info(title + " build log");
        info("Built: " + new Date().toString());
        info("After Effects: " + String(app.version));
        info("Package root: " + root.fsName);
        info("Spec: " + SPEC.comps.length + " comps, " + (has(SPEC, "assets") ? SPEC.assets.length : 0) + " assets, " + fps + " fps");
        createFolders();
        importAssets();
        createComps();
        var main = has(compItems, SPEC.main) ? compItems[SPEC.main] : null;
        if (main === null) {
            warn("main comp '" + String(SPEC.main) + "' was not built; markers skipped");
        } else {
            addMarkers(main);
        }
        optional("Render Queue", function () { addRenderQueue(); });
        if (main !== null) {
            try { main.openInViewer(); } catch (e) {}
        }
    }

    function saveProject(title) {
        var f = new File(joinPath(root, safeFileName(title) + ".aep"));
        try {
            app.project.save(f);
            return f.fsName;
        } catch (e) {
            warn("Could not save the project to " + f.fsName + ": " + errText(e));
            return "";
        }
    }

    function writeLog() {
        var path = joinPath(root, "build_log.txt");
        // "Allow Scripts to Write Files and Access Network": the section is "Main Pref Section v2" in
        // current versions and "Main Pref Section" in older ones. Only a pref that exists is trusted.
        var sections = ["Main Pref Section v2", "Main Pref Section"];
        for (var s = 0; s < sections.length; s++) {
            try {
                if (app.preferences.havePref(sections[s], "Pref_SCRIPTING_FILE_NETWORK_SECURITY")) {
                    if (app.preferences.getPrefAsLong(sections[s], "Pref_SCRIPTING_FILE_NETWORK_SECURITY") !== 1) {
                        return "not written (turn on Preferences > Scripting & Expressions > Allow Scripts to Write Files and Access Network)";
                    }
                    break;
                }
            } catch (e0) {}
        }
        try {
            var f = new File(path);
            f.encoding = "UTF-8";
            if (!f.open("w")) { return "not written (could not open " + path + ")"; }
            f.write(logLines.join("\n") + "\n");
            f.close();
            return path;
        } catch (e1) {
            return "not written (" + errText(e1) + ")";
        }
    }

    function run() {
        if (typeof SPEC === "undefined" || SPEC === null || typeof SPEC !== "object" || isArray(SPEC)) {
            alert("Build stopped: SPEC is not defined.\nRun the assembled build script (ae/CASHTAGS_VSL_Build.jsx), not tools/ae_interpreter.jsx.");
            return;
        }
        var title = (isStr(SPEC.name) && SPEC.name !== "") ? SPEC.name : "CASHTAGS_VSL";
        root = File($.fileName).parent;
        var problem = validateDocument();
        if (problem !== "") {
            alert(title + " build stopped: " + problem + ".\nNothing was changed.");
            return;
        }
        if (!app.newProject()) {
            alert(title + " build cancelled: no new project was created (the save prompt was cancelled).\nNothing was changed.");
            return;
        }
        proj = app.project;
        app.beginUndoGroup("Build " + title);
        try {
            buildProject(title);
        } catch (e) {
            warn("Build stopped early: " + errText(e));
        }
        app.endUndoGroup();

        var saved = saveProject(title);
        info("Comps: " + stats.comps + ", layers: " + stats.layers + " (" + stats.failedLayers + " failed), keyframes: " + stats.keys +
             ", effects: " + stats.effects + ", masks: " + stats.masks + ", markers: " + stats.markers + ", assets: " + stats.assets);
        info("Render Queue: " + (renderInfo.comp !== "" ? renderInfo.comp + " -> " + (renderInfo.file !== "" ? renderInfo.file : "(default file)") + " [" + renderInfo.template + "]" : "(none)"));
        info("Saved: " + (saved !== "" ? saved : "(not saved)"));
        for (var n = 0; n < notes.length; n++) { info("NOTE: " + notes[n]); }
        info("Warnings: " + warnings.length);
        var logResult = writeLog();

        var msg = title + " build finished.\n\n" +
            "Comps: " + stats.comps + "   Layers: " + stats.layers + (stats.failedLayers > 0 ? " (" + stats.failedLayers + " failed)" : "") +
            "   Keyframes: " + stats.keys + "\nEffects: " + stats.effects + "   Masks: " + stats.masks + "   Markers: " + stats.markers + "\n\n" +
            "Saved: " + (saved !== "" ? saved : "NOT SAVED") + "\n" +
            "Render Queue: " + (renderInfo.comp !== "" ? renderInfo.comp + " [" + renderInfo.template + "]" : "nothing added") + "\n" +
            "Log: " + logResult + "\n\n" +
            "Warnings: " + warnings.length;
        var shown = Math.min(warnings.length, 8);
        for (var w = 0; w < shown; w++) { msg += "\n- " + warnings[w]; }
        if (warnings.length > shown) { msg += "\n- ... see build_log.txt"; }
        for (var q = 0; q < notes.length; q++) { msg += "\n\nNote: " + notes[q]; }
        alert(msg);
    }

    run();
})();
