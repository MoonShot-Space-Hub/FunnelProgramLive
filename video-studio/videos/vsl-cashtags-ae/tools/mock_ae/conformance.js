// Independent oracle: after the build script ran in the mock, compare the project it built
// with the spec, field by field, following SCHEMA.md (not the interpreter's code).
import path from 'node:path';
import { PVT } from './tree.js';
import { KIT, MASK_MODE, PJ } from './dom.js';

const EASE = {
  out: { out: 10, in: 80 }, in: { out: 80, in: 10 }, inout: { out: 70, in: 70 }, soft: { out: 100 / 3, in: 100 / 3 },
};
const TYPE_FOR = { linear: KIT.LINEAR, hold: KIT.HOLD };
const isAnim = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && 'k' in v;
const near = (a, b, tol = 1e-6) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// Spec times are frame-aligned but written with a few decimals; compare on the frame grid.
const snapper = (fps) => (t) => { const f = t * fps; const r = Math.round(f); return Math.abs(f - r) < 0.03 ? r / fps : t; };
const spatial = (pvt) => pvt === PVT.TwoD_SPATIAL || pvt === PVT.ThreeD_SPATIAL;

function* walk(node) {
  yield node;
  for (const c of node.children) yield* walk(c);
}

export function roundRect(r, radius) {
  const x0 = Math.min(r[0], r[2]); const x1 = Math.max(r[0], r[2]);
  const y0 = Math.min(r[1], r[3]); const y1 = Math.max(r[1], r[3]);
  const rr = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
  const k = rr * 0.5523;
  return {
    v: [[x0 + rr, y0], [x1 - rr, y0], [x1, y0 + rr], [x1, y1 - rr], [x1 - rr, y1], [x0 + rr, y1], [x0, y1 - rr], [x0, y0 + rr]],
    i: [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]],
    o: [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]],
    closed: true,
  };
}

export function checkConformance(spec, state, classes, root) {
  const issues = [];
  const advisories = [];
  const add = (where, msg) => issues.push(`${where}: ${msg}`);
  const snap = snapper(spec.fps);
  const P = state.project;
  if (!P || P === state.initialProject) {
    add('project', 'nothing was built in a new project (app.newProject() not called, or the build was cancelled)');
    return { issues, advisories };
  }

  // value comparators: (aeValue, specValue) -> error string or ''
  const cmpNum = (a, b) => (near(a, b) ? '' : `${a} != ${b}`);
  const cmpVec = (a, b) => (Array.isArray(a) && near(a[0], b[0]) && near(a[1], b[1]) ? '' : `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  const cmpColor = (a, h) => { const b = hex(h); return Array.isArray(a) && b.every((x, i) => near(a[i], x)) ? '' : `${JSON.stringify(a)} != ${h}`; };
  const cmpDb = (a, d) => (Array.isArray(a) && near(a[0], d) && near(a[1], d) ? '' : `${JSON.stringify(a)} != [${d}, ${d}]`);
  const cmpShape = (a, b) => {
    const pts = (x, y) => x.length === y.length && x.every((p, i) => near(p[0], y[i][0], 1e-4) && near(p[1], y[i][1], 1e-4));
    return a && pts(a.v, b.v) && pts(a.i, b.i) && pts(a.o, b.o) && a.closed === b.closed ? '' : `shape ${JSON.stringify(a)} != ${JSON.stringify(b)}`;
  };

  const checkAnim = (node, val, cmp, label, conv = (x) => x) => {
    if (!node) { add(label, 'property missing'); return; }
    if (isAnim(val) && val.k.length >= 2) {
      const ks = val.k;
      if (node.keys.length !== ks.length) { add(label, `${node.keys.length} keys, spec has ${ks.length}`); return; }
      ks.forEach((k, i) => {
        const K = node.keys[i];
        if (!near(K.time, snap(k[0]))) add(label, `key ${i} at ${K.time} s, spec ${k[0]} s`);
        const e = cmp(K.value, conv(k[1]));
        if (e) add(label, `key ${i} value ${e}`);
      });
      for (let i = 0; i < ks.length - 1; i++) {
        const name = ks[i].length > 2 && ks[i][2] !== null ? ks[i][2] : 'out';
        const a = node.keys[i];
        const b = node.keys[i + 1];
        const type = TYPE_FOR[name] || KIT.BEZIER;
        if (a.outType !== type) add(label, `key ${i} outgoing type ${a.outType}, expected ${type} (${name})`);
        if (name !== 'hold' && b.inType !== type) add(label, `key ${i + 1} incoming type ${b.inType}, expected ${type} (${name})`);
        if (EASE[name]) {
          if (!a.easeSet || !a.outEase.every((x) => near(x.influence, EASE[name].out) && x.speed === 0)) {
            add(label, `key ${i} out-ease ${JSON.stringify(a.outEase)} != speed 0 / influence ${EASE[name].out} (${name})`);
          }
          if (!b.easeSet || !b.inEase.every((x) => near(x.influence, EASE[name].in) && x.speed === 0)) {
            add(label, `key ${i + 1} in-ease ${JSON.stringify(b.inEase)} != speed 0 / influence ${EASE[name].in} (${name})`);
          }
        }
      }
      if (spatial(node.def.pvt)) {
        node.keys.forEach((K, i) => {
          const zero = (t) => Array.isArray(t) && t.every((x) => x === 0);
          if (K.spatialAutoBezier || !zero(K.inTangent) || !zero(K.outTangent)) add(label, `key ${i} motion path is not straight (auto-bezier ${K.spatialAutoBezier}, tangents ${JSON.stringify(K.inTangent)} / ${JSON.stringify(K.outTangent)})`);
        });
      }
    } else {
      const v = isAnim(val) ? val.k[0][1] : val;
      if (node.keys.length) add(label, `has ${node.keys.length} keys, spec value is static`);
      const e = cmp(node.value, conv(v));
      if (e) add(label, e);
    }
  };
  const keyTimes = (val) => (isAnim(val) ? val.k.map((k) => k[0]) : []);

  // ---- folders and assets
  const items = P._items;
  const folderNamed = (n) => items.find((i) => i instanceof classes.FolderImpl && i._name === n);
  for (const f of spec.folders || []) {
    const F = folderNamed(f);
    if (!F) add('folders', `folder "${f}" missing`);
    else if (F._parent !== P._root) add('folders', `folder "${f}" is not at the project root`);
  }
  const assetItem = {};
  for (const a of spec.assets || []) {
    const abs = path.resolve(root, a.file);
    const it = items.find((i) => i instanceof classes.FootageImpl && i._file === abs);
    if (!it) { add(`asset ${a.id}`, `${a.file} not imported`); continue; }
    assetItem[a.id] = it;
    if (a.folder && (!it._parent || it._parent._name !== a.folder)) add(`asset ${a.id}`, `in folder "${it._parent && it._parent._name}", spec "${a.folder}"`);
  }

  // ---- comps and layers
  const compItem = {};
  for (const C of spec.comps) {
    const where = `comp ${C.id}`;
    const name = C.name || C.id;
    const found = items.filter((i) => i instanceof classes.CompImpl && i._name === name);
    if (found.length !== 1) { add(where, found.length ? `${found.length} comps named "${name}"` : 'not created'); continue; }
    const c = found[0];
    compItem[C.id] = c;
    if (c._w !== C.width || c._h !== C.height) add(where, `size ${c._w}x${c._h}, spec ${C.width}x${C.height}`);
    if (!near(c._dur, snap(C.duration))) add(where, `duration ${c._dur}, spec ${C.duration}`);
    if (!near(c._fps, spec.fps)) add(where, `frame rate ${c._fps}, spec ${spec.fps}`);
    if (!c._bgSet || cmpColor(c._bg, C.bg)) add(where, `bgColor ${JSON.stringify(c._bg)}, spec ${C.bg}`);
    if (C.folder && (!c._parent || c._parent._name !== C.folder)) add(where, `in folder "${c._parent && c._parent._name}", spec "${C.folder}"`);
    const n = C.layers.length;
    if (c._layers.length !== n) add(where, `${c._layers.length} layers, spec has ${n}`);
    C.layers.forEach((L, j) => checkLayer(L, c._layers[n - 1 - j], C, c, j));
  }

  function checkLayer(L, A, C, comp, j) {
    const where = `comp ${C.id} layer ${j} "${L.name}"`;
    if (!A) { add(where, 'missing'); return; }
    if (A._name !== L.name) { add(where, `AE layer at this position is "${A._name}" (order or name)`); return; }
    const kind = { rect: 'shape', ellipse: 'shape', path: 'shape', text: 'text' }[L.type] || 'av';
    if (A._kind !== kind) { add(where, `AE layer kind ${A._kind}, expected ${kind}`); return; }
    if (['image', 'footage', 'audio'].includes(L.type) && A._source !== assetItem[L.asset]) add(where, `source is not asset "${L.asset}"`);
    if (L.type === 'comp' && A._source !== compItem[L.comp]) add(where, `source is not comp "${L.comp}"`);

    // timing
    const expStart = snap(['footage', 'audio'].includes(L.type) ? (L.start ?? 0) : L.type === 'comp' ? (L.start ?? L.in) : 0);
    if (!near(A._start, expStart)) add(where, `startTime ${A._start}, expected ${expStart}`);
    if (!near(A._in, snap(L.in))) add(where, `inPoint ${A._in}, spec in ${L.in}`);
    // A frame-rounded out may overshoot the media end by less than half a frame; the layer then
    // ends with its source (same frames covered). More than that is a spec error.
    let expOut = snap(L.out);
    if (A._timed) {
      const srcEnd = A._start + A._srcDur;
      if (expOut > srcEnd + 1e-6 && expOut <= srcEnd + 0.5 / spec.fps + 1e-9) expOut = srcEnd;
    }
    if (!near(A._out, expOut)) add(where, `outPoint ${A._out}, spec out ${L.out}`);
    for (const f of ['position', 'scale', 'rotation', 'opacity', 'blur']) {
      for (const t of keyTimes(L[f])) if (t < -1e-6 || t > comp._dur + 1e-6) advisories.push(`${where}: ${f} key at ${t} s is outside the comp (0..${comp._dur})`);
    }

    const R = A._root;
    if (L.type !== 'audio') {
      const T = R.child('ADBE Transform Group');
      let anchor = L.anchor;
      if (anchor === undefined) {
        anchor = ['image', 'footage'].includes(L.type) ? [A._source._info.width / 2, A._source._info.height / 2]
          : L.type === 'comp' ? [A._source._w / 2, A._source._h / 2] : [0, 0];
      }
      checkAnim(T.child('ADBE Anchor Point'), anchor, cmpVec, `${where} anchor`);
      let pos = L.position;
      if (pos === undefined) pos = L.type === 'path' ? [0, 0] : [comp._w / 2, comp._h / 2];
      checkAnim(T.child('ADBE Position'), pos, cmpVec, `${where} position`);
      checkAnim(T.child('ADBE Scale'), L.scale ?? [100, 100], cmpVec, `${where} scale`);
      checkAnim(T.child('ADBE Rotate Z'), L.rotation ?? 0, cmpNum, `${where} rotation`);
      checkAnim(T.child('ADBE Opacity'), L.opacity ?? 100, cmpNum, `${where} opacity`);
      if (['image', 'comp', 'footage'].includes(L.type)) {
        const scales = isAnim(L.scale) ? L.scale.k.map((k) => k[1]) : L.scale ? [L.scale] : [];
        if (scales.some((s) => s[0] > 100.01 || s[1] > 100.01)) advisories.push(`${where}: ${L.type} layer scaled above 100% (raster upscale; may look soft)`);
      }

      // effects: Drop Shadow, then Gaussian Blur
      const fx = R.child('ADBE Effect Parade').children;
      const expFx = [];
      if (L.shadow) expFx.push('ADBE Drop Shadow');
      if (L.blur !== undefined && L.blur !== null) expFx.push('ADBE Gaussian Blur 2');
      if (fx.map((e) => e.mn).join('|') !== expFx.join('|')) add(where, `effects [${fx.map((e) => e.mn)}], expected [${expFx}]`);
      const sh = fx.find((e) => e.mn === 'ADBE Drop Shadow');
      if (L.shadow && sh) {
        const S = L.shadow;
        checkAnim(sh.child('ADBE Drop Shadow-0001'), S.color, cmpColor, `${where} shadow color`);
        checkAnim(sh.child('ADBE Drop Shadow-0002'), S.opacity * 2.55, cmpNum, `${where} shadow opacity (0-255)`);
        checkAnim(sh.child('ADBE Drop Shadow-0003'), S.direction, cmpNum, `${where} shadow direction`);
        checkAnim(sh.child('ADBE Drop Shadow-0004'), S.distance, cmpNum, `${where} shadow distance`);
        checkAnim(sh.child('ADBE Drop Shadow-0005'), S.softness, cmpNum, `${where} shadow softness`);
      }
      const bl = fx.find((e) => e.mn === 'ADBE Gaussian Blur 2');
      if (bl) {
        checkAnim(bl.child('ADBE Gaussian Blur 2-0001'), L.blur, cmpNum, `${where} blur`);
        if (bl.child('ADBE Gaussian Blur 2-0003').value !== 0) add(where, 'Gaussian Blur Repeat Edge Pixels is on');
      }

      // mask
      const masks = R.child('ADBE Mask Parade').children;
      if (L.mask) {
        if (masks.length !== 1) add(where, `${masks.length} masks, expected 1`);
        else {
          const M = masks[0];
          if (M.maskMode !== MASK_MODE.ADD) add(where, `mask mode ${M.maskMode}, expected ADD`);
          if (M.inverted) add(where, 'mask is inverted');
          const radius = L.mask.radius ?? 0;
          checkAnim(M.child('ADBE Mask Shape'), L.mask.rect, cmpShape, `${where} mask`, (r) => roundRect(r, radius));
        }
      } else if (masks.length) add(where, `${masks.length} unexpected masks`);
    }

    if (L.type === 'rect' || L.type === 'ellipse' || L.type === 'path') checkShape(L, R, where);
    if (L.type === 'text') checkText(L, R, where);
    if (L.type === 'footage' || L.type === 'audio') {
      const want = L.audio !== false;
      if (A._hasAudio && A._audioEnabled !== want) add(where, `audioEnabled ${A._audioEnabled}, expected ${want}`);
      if (A._hasAudio) checkAnim(R.child('ADBE Audio Group').child('ADBE Audio Levels'), L.audioLevels ?? 0, cmpDb, `${where} audio levels`);
    }
  }

  function checkShape(L, R, where) {
    const groups = R.child('ADBE Root Vectors Group').children;
    if (groups.length !== 1 || groups[0].mn !== 'ADBE Vector Group') { add(where, `contents [${groups.map((g) => g.mn)}], expected one group`); return; }
    const items = groups[0].child('ADBE Vectors Group').children;
    const shapeMn = { rect: 'ADBE Vector Shape - Rect', ellipse: 'ADBE Vector Shape - Ellipse', path: 'ADBE Vector Shape - Group' }[L.type];
    const exp = L.type === 'path' ? L.paths.map(() => shapeMn) : [shapeMn];
    if (L.trim && L.type !== 'rect') exp.push('ADBE Vector Filter - Trim');
    if (L.stroke) exp.push('ADBE Vector Graphic - Stroke');
    if (L.fill) exp.push('ADBE Vector Graphic - Fill');
    if (items.map((i) => i.mn).join('|') !== exp.join('|')) { add(where, `group items [${items.map((i) => i.mn)}], expected [${exp}] (shape, trim, stroke, fill)`); return; }
    const get = (mn) => items.find((i) => i.mn === mn);
    if (L.type === 'rect') {
      const r = get(shapeMn);
      checkAnim(r.child('ADBE Vector Rect Size'), L.size, cmpVec, `${where} size`);
      checkAnim(r.child('ADBE Vector Rect Roundness'), L.radius ?? 0, cmpNum, `${where} radius`);
      checkAnim(r.child('ADBE Vector Rect Position'), [0, 0], cmpVec, `${where} rect position`);
    } else if (L.type === 'ellipse') {
      checkAnim(get(shapeMn).child('ADBE Vector Ellipse Size'), L.size, cmpVec, `${where} size`);
      if (get(shapeMn).child('ADBE Vector Shape Direction').value !== 1) add(where, 'ellipse direction changed (AE ellipses start at 12 o\'clock, clockwise)');
    } else {
      L.paths.forEach((p, k) => {
        const z = p.v.map(() => [0, 0]);
        const want = { v: p.v, i: p.i || z, o: p.o || z, closed: p.closed === true };
        checkAnim(items[k].child('ADBE Vector Shape'), want, cmpShape, `${where} path ${k}`);
      });
    }
    if (L.trim && L.type !== 'rect') {
      const t = get('ADBE Vector Filter - Trim');
      checkAnim(t.child('ADBE Vector Trim Start'), L.trim.start ?? 0, cmpNum, `${where} trim start`);
      checkAnim(t.child('ADBE Vector Trim End'), L.trim.end ?? 100, cmpNum, `${where} trim end`);
      if (t.child('ADBE Vector Trim Type').value !== 1) add(where, 'trim is not "Simultaneously"');
    }
    if (L.stroke) {
      const s = get('ADBE Vector Graphic - Stroke');
      checkAnim(s.child('ADBE Vector Stroke Color'), L.stroke, cmpColor, `${where} stroke color`);
      checkAnim(s.child('ADBE Vector Stroke Width'), L.strokeWidth ?? 1, cmpNum, `${where} stroke width`);
      checkAnim(s.child('ADBE Vector Stroke Opacity'), L.strokeOpacity ?? 100, cmpNum, `${where} stroke opacity`);
      const cap = { butt: 1, round: 2, square: 3 }[L.type === 'rect' ? 'butt' : (L.lineCap || 'butt')];
      const join = L.type === 'path' ? { miter: 1, round: 2, bevel: 3 }[L.lineJoin || 'round'] : 1;
      if (s.child('ADBE Vector Stroke Line Cap').value !== cap) add(where, `line cap ${s.child('ADBE Vector Stroke Line Cap').value}, expected ${cap}`);
      if (s.child('ADBE Vector Stroke Line Join').value !== join) add(where, `line join ${s.child('ADBE Vector Stroke Line Join').value}, expected ${join}`);
    }
    if (L.fill) {
      const f = get('ADBE Vector Graphic - Fill');
      checkAnim(f.child('ADBE Vector Fill Color'), L.fill, cmpColor, `${where} fill`);
      checkAnim(f.child('ADBE Vector Fill Opacity'), L.fillOpacity ?? 100, cmpNum, `${where} fill opacity`);
    }
  }

  function checkText(L, R, where) {
    const tp = R.child('ADBE Text Properties');
    const d = tp.child('ADBE Text Document').value;
    const want = {
      text: L.text.replace(/\n/g, '\r'), font: L.font, fontSize: L.size, applyFill: true, applyStroke: false,
      tracking: L.tracking ?? 0, autoLeading: false, leading: L.leading ?? Math.round(L.size * 1.2),
      justification: { left: PJ.LEFT_JUSTIFY, center: PJ.CENTER_JUSTIFY, right: PJ.RIGHT_JUSTIFY }[L.justify || 'left'],
    };
    for (const [k, v] of Object.entries(want)) if (d[k] !== v && !(typeof v === 'number' && near(d[k], v))) add(where, `text ${k} ${JSON.stringify(d[k])}, expected ${JSON.stringify(v)}`);
    if (cmpColor(d.fillColor, L.color)) add(where, `text colour ${JSON.stringify(d.fillColor)}, expected ${L.color}`);
    const anims = tp.child('ADBE Text Animators').children;
    if (!L.karaoke) { if (anims.length) add(where, `${anims.length} unexpected text animators`); return; }
    if (anims.length !== 1) { add(where, `${anims.length} text animators, expected 1 (karaoke)`); return; }
    const props = anims[0].child('ADBE Text Animator Properties').children;
    if (props.length !== 1 || props[0].mn !== 'ADBE Text Fill Color') add(where, `karaoke animator properties [${props.map((p) => p.mn)}], expected [ADBE Text Fill Color]`);
    else checkAnim(props[0], L.karaoke.dim, cmpColor, `${where} karaoke dim`);
    const sels = anims[0].child('ADBE Text Selectors').children;
    if (sels.length !== 1 || sels[0].mn !== 'ADBE Text Selector') { add(where, 'karaoke needs exactly one Range Selector'); return; }
    const sel = sels[0];
    const adv = sel.child('ADBE Text Range Advanced');
    for (const [mn, v] of [['ADBE Text Range Units', 2], ['ADBE Text Range Type2', 3], ['ADBE Text Range Shape', 1]]) {
      if (adv.child(mn).value !== v) add(where, `karaoke ${mn} = ${adv.child(mn).value}, expected ${v}`);
    }
    const words = L.text.split(' ').length;
    checkAnim(sel.child('ADBE Text Index End'), words, cmpNum, `${where} karaoke end`);
    const keys = [[0, 0, 'hold']];
    L.karaoke.times.forEach((t0, i) => {
      const t = snap(t0);
      if (t <= keys[keys.length - 1][0] + 1e-6) keys[keys.length - 1][1] = i + 1;
      else keys.push([t, i + 1, 'hold']);
    });
    checkAnim(sel.child('ADBE Text Index Start'), keys.length > 1 ? { k: keys } : keys[0][1], cmpNum, `${where} karaoke start`);
  }

  // ---- markers, render queue, save, log
  const main = compItem[spec.main];
  if (!main) add('main', `main comp "${spec.main}" not found`);
  else {
    const mk = main._marker.keys;
    // AE keeps marker keys sorted by time; the spec may list them in any order.
    const want = (spec.markers || []).slice().sort((a, b) => a[0] - b[0]);
    if (mk.length !== want.length) add('markers', `${mk.length} markers, spec has ${want.length}`);
    else want.forEach((m, i) => {
      if (!near(mk[i].time, snap(m[0])) || mk[i].value.comment !== String(m[1])) add('markers', `marker ${i} ${mk[i].time} "${mk[i].value.comment}", spec ${m[0]} "${m[1]}"`);
    });
  }
  const renderComp = compItem[(spec.render && spec.render.comp) || spec.main];
  if (P._rq.length !== 1) add('render queue', `${P._rq.length} items, expected 1`);
  else {
    const rq = P._rq[0];
    if (rq._comp !== renderComp) add('render queue', `renders "${rq._comp._name}", expected the render comp`);
    const om = rq._oms[0];
    if (!om._template.startsWith('H.264')) add('render queue', `output module "${om._template}", expected an H.264 template`);
    const out = path.join(root, `${spec.render.output}.mp4`);
    if (om._file !== out) add('render queue', `output file ${om._file}, expected ${out}`);
  }
  const aep = path.join(root, `${String(spec.name || 'CASHTAGS_VSL').replace(/[^A-Za-z0-9 _.-]/g, '_')}.aep`);
  if (!state.saved.includes(aep)) add('save', `project not saved to ${aep} (saved: ${state.saved.join(', ') || 'nothing'})`);
  if (!state.writes.has(path.join(root, 'build_log.txt'))) add('build log', 'build_log.txt not written');

  // ---- every keyed property everywhere: ease arrays were validated on set; check none were left at defaults
  for (const c of Object.values(compItem)) {
    for (const A of c._layers) {
      for (const node of walk(A._root)) {
        if (node.keys.length > 1 && node.keys.some((k) => !k.typeSet)) add(`comp "${c._name}" layer "${A._name}"`, `${node.mn} has keys without an interpolation type set`);
      }
    }
  }
  return { issues, advisories };
}

export { walk };
