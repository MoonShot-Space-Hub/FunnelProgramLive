#!/usr/bin/env node
// Proves the mock is strict: runs the fixture through the real interpreter (must PASS), then
// through deliberately broken variants of the interpreter and the fixture (each must FAIL with
// the expected message).
//
//   node tools/mock_ae/selftest.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMock } from './mock.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..', '..');
const INTERP = fs.readFileSync(path.join(PROJECT, 'tools', 'ae_interpreter.jsx'), 'utf8');
const FIXTURE = JSON.parse(fs.readFileSync(path.join(PROJECT, 'tools', 'fixtures', 'ae_fixture.json'), 'utf8'));
const AS = path.join(PROJECT, 'ae', 'AE_FIXTURE_Build.jsx');

const build = (interp, spec) => `var SPEC = ${JSON.stringify(spec, null, 1)};\n\n${interp}`;
const mut = (src, from, to) => {
  if (!src.includes(from)) throw new Error(`selftest mutation target not found: ${from.slice(0, 80)}`);
  return src.replace(from, to);
};
const swapBlocks = (src, a, b) => {
  const i = src.indexOf(a); const j = src.indexOf(b);
  if (i < 0 || j < 0 || i > j) throw new Error('selftest swap targets not found');
  return src.slice(0, i) + b + src.slice(i + a.length, j) + a + src.slice(j + b.length);
};
const clone = () => JSON.parse(JSON.stringify(FIXTURE));
const layer = (spec, comp, name) => spec.comps.find((c) => c.id === comp).layers.find((l) => l.name === name);

// One `if (...) { ... }` block of the interpreter, from its first line to its closing brace line.
const blockAt = (startText) => {
  const i = INTERP.indexOf(startText);
  const j = INTERP.indexOf('\n        }\n', i);
  if (i < 0 || j < 0) throw new Error(`selftest block not found: ${startText}`);
  return INTERP.slice(i, j + '\n        }\n'.length);
};
const STROKE_BLOCK = blockAt('        if (hasStroke) {');
const FILL_BLOCK = blockAt('        if (hasFill) {\n            var fl');

const CASES = [
  { name: 'baseline fixture', pass: true },
  { name: 'cancel at app.newProject()', pass: true, opts: { cancelNewProject: true } },
  // ---- ease arrays and keyframes
  { name: 'Scale eased with 1 KeyframeEase', expect: /needs 3 KeyframeEase objects, got 1/,
    interp: (s) => mut(s, 'if (t === PropertyValueType.ThreeD) { return 3; }', 'if (t === PropertyValueType.ThreeD) { return 1; }') },
  { name: 'TwoD (Rect Size, Audio Levels) eased with 1', expect: /needs 2 KeyframeEase objects, got 1/,
    interp: (s) => mut(s, 'if (t === PropertyValueType.TwoD) { return 2; }', 'if (t === PropertyValueType.TwoD) { return 1; }') },
  { name: 'spatial ease given per dimension', expect: /\(ThreeD_SPATIAL\): inTemporalEase needs 1 KeyframeEase object, got 3/,
    interp: (s) => mut(s, 'if (t === PropertyValueType.ThreeD) { return 3; }', 'if (t === PropertyValueType.ThreeD || t === PropertyValueType.ThreeD_SPATIAL) { return 3; }') },
  { name: 'influence 0', expect: /influence must be 0\.1\.\.100, got 0/,
    interp: (s) => mut(s, '"out": {kind: "bezier", outInf: 10, inInf: 80}', '"out": {kind: "bezier", outInf: 0, inInf: 80}') },
  { name: 'ease table swapped (in <-> out)', expect: /out-ease .* influence 80 \(in\)/,
    interp: (s) => mut(s, '"in": {kind: "bezier", outInf: 80, inInf: 10}', '"in": {kind: "bezier", outInf: 10, inInf: 80}') },
  { name: 'linear segments made bezier', expect: /type 6613, expected 6612 \(linear\)/,
    interp: (s) => mut(s, 'if (ease.kind === "linear") { return KeyframeInterpolationType.LINEAR; }', 'if (ease.kind === "linear") { return KeyframeInterpolationType.BEZIER; }') },
  { name: 'motion path left auto-bezier', expect: /motion path is not straight/,
    interp: (s) => mut(s, 'prop.setSpatialTangentsAtKey(idx[i], zero, zero);', 'zero = zero;') },
  { name: 'Position tangents with 2 numbers', expect: /\(ThreeD_SPATIAL\): inTangent must be 3 numbers/,
    interp: (s) => mut(s, 'if (t === PropertyValueType.ThreeD_SPATIAL) { return 3; }', 'if (t === PropertyValueType.ThreeD_SPATIAL) { return 2; }') },
  { name: 'setValue on a keyframed property', expect: /which has keyframes/,
    interp: (s) => mut(s, '        if (has(L, "scale")) { applyAnim(tf(layer).property("ADBE Scale")',
      '        if (isAnim(pos)) { tf(layer).property("ADBE Position").setValue([0, 0]); }\n        if (has(L, "scale")) { applyAnim(tf(layer).property("ADBE Scale")') },
  // ---- property tree
  { name: 'unknown matchName', expect: /unknown matchName "ADBE Vector Rect Sizes"/,
    interp: (s) => mut(s, 'item.property("ADBE Vector Rect Size")', 'item.property("ADBE Vector Rect Sizes")') },
  { name: 'wrong parent', expect: /"ADBE Opacity" is not a child of "Layer".*wrong parent/,
    interp: (s) => mut(s, 'applyAnim(tf(layer).property("ADBE Opacity")', 'applyAnim(layer.property("ADBE Opacity")') },
  { name: 'stale reference after addProperty', expect: /Object is invalid: "ADBE Vector Group"/,
    interp: (s) => mut(s, '        if (hasFill) {\n            var fl = vectorsOf(layer)', '        if (hasFill) {\n            grp.name = "late";\n            var fl = vectorsOf(layer)') },
  { name: 'fill added before stroke', expect: /group items .*Fill,ADBE Vector Graphic - Stroke\], expected/,
    interp: (s) => swapBlocks(s, STROKE_BLOCK, FILL_BLOCK) },
  { name: 'colour out of 0..1', expect: /must be \[r, g, b\] in 0\.\.1/,
    interp: (s) => mut(s, 'parseInt(hex.substring(1, 3), 16) / 255,', 'parseInt(hex.substring(1, 3), 16) / 25,') },
  { name: 'drop shadow opacity not scaled to 0..255', expect: /shadow opacity \(0-255\)/,
    interp: (s) => mut(s, 'opv = opacity * op.maxValue / 100;', 'opv = opacity;') },
  { name: 'Audio Levels as a single number', expect: /expected \[x, y\] \(2 numbers\)/,
    interp: (s) => mut(s, 'return [v, v];\n    }\n\n    function roundRectShape', 'return v;\n    }\n\n    function roundRectShape') },
  { name: 'mask shape with unequal tangents', expect: /Shape needs equal-length arrays/,
    interp: (s) => mut(s, 's.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];', 's.outTangents = [[0, 0], [k, 0]];') },
  // ---- timing
  { name: 'times not snapped to the frame grid', expect: /not on the 30 fps frame grid/,
    interp: (s) => mut(s, 'return (Math.abs(f - r) < 0.03) ? r / fps : t;', 'return t;') },
  { name: 'inPoint before startTime', expect: /inPoint set before startTime/,
    interp: (s) => mut(mut(s, '            layer.startTime = st;\n', ''),
      '            layer.inPoint = tin;\n            layer.outPoint = tout;\n        } else {',
      '            layer.inPoint = tin;\n            layer.outPoint = tout;\n            layer.startTime = st;\n        } else {') },
  { name: 'footage out after the source ends', expect: /out \(8\) is after the source ends/,
    spec: (j) => { layer(j, 'main', 'VSL A-roll').start = -70; } },
  { name: 'layer out after the comp ends', expect: /after the end of the comp/,
    spec: (j) => { layer(j, 'main', 'Music bed').out = 9; } },
  // ---- text
  { name: 'TextDocument never applied', expect: /modified but never applied with setValue/,
    interp: (s) => mut(s, '        textDocProp(layer).setValue(td);\n', '') },
  { name: 'leading before autoLeading=false', expect: /leading set while autoLeading is not false/,
    interp: (s) => mut(s, 'td.autoLeading = false;\n            td.leading = leading;', 'td.leading = leading;\n            td.autoLeading = false;') },
  { name: 'fillColor before applyFill', expect: /fillColor set while applyFill is not true/,
    interp: (s) => mut(mut(s, '        td.applyFill = true;\n        td.fillColor = color;', '        td.fillColor = color;\n        td.applyFill = true;'),
      'try { td.resetCharStyle(); } catch (e0) {}', 'try { td.resetCharStyle(); } catch (e0) {} td.applyFill = false;') },
  { name: 'line breaks left as \\n', expect: /After Effects line breaks are "\\r"/,
    interp: (s) => mut(s, 'return s.split("\\r\\n").join("\\r").split("\\n").join("\\r");', 'return s;') },
  { name: 'karaoke index before Units / Based On', expect: /set "ADBE Text Range Units" to 2 first/,
    interp: (s) => mut(s, '        var adv = sel.property("ADBE Text Range Advanced");', '        sel.property("ADBE Text Index End").setValue(words.length);\n        var adv = sel.property("ADBE Text Range Advanced");') },
  { name: 'font not installed', expect: /Font 'Inter-Thin' is not installed/,
    spec: (j) => { layer(j, 'moment', 'Tag').font = 'Inter-Thin'; } },
  // ---- spec problems the interpreter must report
  { name: 'unknown spec field', expect: /unknown field 'glow' ignored/,
    spec: (j) => { layer(j, 'card', 'Card bg').glow = 3; } },
  { name: 'missing footage (dialog, then skip)', expect: /footage not found .* no replacement was chosen/,
    spec: (j) => { j.assets[0].file = 'Footage/NOPE.mp4'; } },
  // ---- ExtendScript language level and structure
  { name: 'Array.prototype.forEach', expect: /\.forEach\(\) is ES5\+/,
    interp: (s) => mut(s, '    run();\n})();', '    [1, 2].forEach(function () {});\n    run();\n})();') },
  { name: 'L.in (reserved word)', expect: /reserved word "in" used as a property name/,
    interp: (s) => mut(s, 'var tin = L["in"];', 'var tin = L.in;') },
  { name: 'no undo group', expect: /outside app\.beginUndoGroup/,
    interp: (s) => mut(mut(s, '        app.beginUndoGroup("Build " + title);\n', ''), '        app.endUndoGroup();\n', '') },
];

let failures = 0;
for (const c of CASES) {
  const interp = c.interp ? c.interp(INTERP) : INTERP;
  const spec = clone();
  if (c.spec) c.spec(spec);
  const r = runMock({ scriptPath: AS, source: build(interp, spec), asPath: AS, ...(c.opts || {}) });
  const text = [...r.warnings, ...r.state.errors.map((e) => e.msg), ...r.problems, ...r.conformance.issues].join('\n');
  let good;
  let why = '';
  if (c.pass) {
    good = r.ok;
    if (!good) why = text.split('\n').slice(0, 3).join(' | ');
  } else {
    good = !r.ok && c.expect.test(text);
    if (r.ok) why = 'mock PASSED a broken build';
    else if (!good) why = `failed, but not with ${c.expect}: ${text.split('\n').slice(0, 3).join(' | ')}`;
  }
  if (!good) failures++;
  process.stdout.write(`${good ? 'ok  ' : 'FAIL'}  ${c.pass ? 'pass' : 'fail'}  ${c.name}${why ? `\n        ${why}` : ''}\n`);
}
process.stdout.write(`\n${CASES.length - failures}/${CASES.length} self-test cases behaved as expected\n`);
process.exitCode = failures ? 1 : 0;
