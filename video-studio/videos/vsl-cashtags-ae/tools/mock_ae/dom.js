// A strict mock of the After Effects scripting DOM (ExtendScript), for running the
// assembled build script under Node. Everything the script can touch is validated the
// way After Effects would (or stricter); every misuse is recorded in state.errors even if
// the script catches the exception, so a run with try/catch everywhere still fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PVT, PVT_NAME, PT, ADDABLE, ALL_MATCHNAMES, layerRootDef } from './tree.js';
import { probeMedia, fontPostScriptNames } from './media.js';

export const KIT = Object.freeze({ LINEAR: 6612, BEZIER: 6613, HOLD: 6614 });
export const KIT_NAME = { 6612: 'LINEAR', 6613: 'BEZIER', 6614: 'HOLD' };
export const MASK_MODE = Object.freeze({ NONE: 6812, ADD: 6813, SUBTRACT: 6814, INTERSECT: 6815, LIGHTEN: 6816, DARKEN: 6817, DIFFERENCE: 6818 });
export const PJ = Object.freeze({
  LEFT_JUSTIFY: 7413, RIGHT_JUSTIFY: 7414, CENTER_JUSTIFY: 7415, FULL_JUSTIFY_LASTLINE_LEFT: 7416,
  FULL_JUSTIFY_LASTLINE_RIGHT: 7417, FULL_JUSTIFY_LASTLINE_CENTER: 7418, FULL_JUSTIFY_LASTLINE_FULL: 7419,
});
export const IAT = Object.freeze({ COMP_CROPPED_LAYERS: 3812, FOOTAGE: 3813, COMP: 3814, PROJECT: 3815 });
export const OM_TEMPLATES = [
  'H.264 - Match Render Settings - 15 Mbps', 'H.264 - Match Render Settings - 40 Mbps',
  'H.264 - Match Render Settings - 5 Mbps', 'High Quality', 'High Quality with Alpha', 'Lossless',
  'Lossless with Alpha', 'Alpha Only', 'AIFF 48kHz', 'Photoshop', 'TIFF Sequence with Alpha',
];

const DEFAULT_EASE_INFLUENCE = 100 / 6;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const list = (v) => (Array.isArray(v) ? Array.prototype.slice.call(v) : null);
// Frames of `t` off the comp's frame grid (AE evaluates a comp only at frame times, so an in
// point or HOLD key a hair after a frame shows one frame late).
const gridError = (t, fps) => Math.abs(t * fps - Math.round(t * fps));
const easeDims = (pvt) => (pvt === PVT.TwoD ? 2 : pvt === PVT.ThreeD ? 3 : 1);
const spatialDims = (pvt) => (pvt === PVT.TwoD_SPATIAL ? 2 : pvt === PVT.ThreeD_SPATIAL ? 3 : 0);

export function fmt(v) {
  try {
    if (v === undefined) return 'undefined';
    if (typeof v === 'string') return JSON.stringify(v);
    if (Array.isArray(v)) return JSON.stringify(Array.prototype.slice.call(v));
    if (v && typeof v === 'object') return `[object ${v.constructor && v.constructor.name ? v.constructor.name : 'Object'}]`;
    return String(v);
  } catch (e) { return String(v); }
}

export function createState(opts = {}) {
  return {
    opts,
    errors: [],          // {msg, line}
    advisories: [],
    alerts: [],
    stdout: [],
    writes: new Map(),   // abs path -> text
    dialogs: [],
    saved: [],           // abs paths
    undo: { depth: 0, begun: 0, ended: 0 },
    project: null,
    initialProject: null,
    newProjectCalls: 0,
    textDocs: [],
    root: null,          // package root (abs)
    scriptFile: null,
    installedFonts: new Set(),
    VMArray: Array,
    impl: new WeakMap(),  // proxy -> implementation
    viewer: null,
  };
}

export function createAE(state) {
  // ------------------------------------------------------------------ error plumbing
  const scriptLine = () => {
    const st = new Error().stack || '';
    const name = state.scriptFile ? path.basename(state.scriptFile) : null;
    if (!name) return null;
    for (const ln of st.split('\n')) {
      const i = ln.indexOf(name + ':');
      if (i >= 0) {
        const m = /:(\d+):\d+\)?\s*$/.exec(ln);
        if (m) return Number(m[1]);
      }
    }
    return null;
  };
  const record = (msg) => { state.errors.push({ msg, line: scriptLine() }); };
  const fail = (msg) => {
    record(msg);
    throw new Error('[mock AE] ' + msg);
  };
  const softThrow = (msg) => { throw new Error(msg); };
  const vmArr = (a) => {
    const out = new state.VMArray();
    for (const x of a) out.push(Array.isArray(x) ? vmArr(x) : x);
    return out;
  };
  const unwrap = (x) => (x && typeof x === 'object' && state.impl.has(x) ? state.impl.get(x) : x);
  const requireUndo = (what) => {
    if (state.undo.depth <= 0) fail(`${what} outside app.beginUndoGroup / app.endUndoGroup`);
  };
  const strictProxy = (impl, label, settable) => {
    const p = new Proxy(impl, {
      // Getters and methods run with `this` = the implementation, so identity checks work.
      get(t, k) {
        const v = Reflect.get(t, k, t);
        return typeof v === 'function' && k !== 'constructor' ? v.bind(t) : v;
      },
      set(t, k, v) {
        if (typeof k === 'string' && k[0] === '_') { t[k] = v; return true; }
        if (!settable.has(k)) fail(`cannot set ${label(t)}.${String(k)} (read-only, or not an attribute of this object)`);
        return Reflect.set(t, k, v, t);
      },
    });
    state.impl.set(p, impl);
    impl._proxy = p;
    return p;
  };

  // ------------------------------------------------------------------ value objects
  class ShapeImpl {
    constructor() { this._v = []; this._i = []; this._o = []; this._closed = true; }
    _pairs(v, what) {
      const a = list(v);
      if (!a) fail(`Shape.${what} must be an Array of [x, y], got ${fmt(v)}`);
      return a.map((p, k) => {
        const q = list(p);
        if (!q || q.length !== 2 || !isNum(q[0]) || !isNum(q[1])) fail(`Shape.${what}[${k}] must be [x, y] numbers, got ${fmt(p)}`);
        return q;
      });
    }
    get vertices() { return vmArr(this._v); }
    set vertices(v) { this._v = this._pairs(v, 'vertices'); }
    get inTangents() { return vmArr(this._i); }
    set inTangents(v) { this._i = this._pairs(v, 'inTangents'); }
    get outTangents() { return vmArr(this._o); }
    set outTangents(v) { this._o = this._pairs(v, 'outTangents'); }
    get closed() { return this._closed; }
    set closed(v) { if (typeof v !== 'boolean') fail(`Shape.closed must be a boolean, got ${fmt(v)}`); this._closed = v; }
  }
  const SHAPE_SETTABLE = new Set(['vertices', 'inTangents', 'outTangents', 'closed']);
  const makeShape = (data) => {
    const s = new ShapeImpl();
    if (data) { s._v = data.v.map((p) => p.slice()); s._i = data.i.map((p) => p.slice()); s._o = data.o.map((p) => p.slice()); s._closed = data.closed; }
    return strictProxy(s, () => 'Shape', SHAPE_SETTABLE);
  };
  function Shape() { return makeShape(null); }
  Shape.prototype = ShapeImpl.prototype;

  class KeyframeEase {
    constructor(speed, influence) {
      if (!isNum(speed)) fail(`new KeyframeEase(speed, influence): speed must be a number, got ${fmt(speed)}`);
      if (!isNum(influence) || influence < 0.1 || influence > 100) fail(`new KeyframeEase: influence must be 0.1..100, got ${fmt(influence)}`);
      this.speed = speed;
      this.influence = influence;
    }
  }

  class MarkerValue {
    constructor(comment, chapter, url, frameTarget, cuePointName, params) {
      if (typeof comment !== 'string') fail(`new MarkerValue(comment): comment must be a string, got ${fmt(comment)}`);
      this.comment = comment;
      this.chapter = chapter === undefined ? '' : String(chapter);
      this.url = url === undefined ? '' : String(url);
      this.frameTarget = frameTarget === undefined ? '' : String(frameTarget);
      this.cuePointName = cuePointName === undefined ? '' : String(cuePointName);
      this.duration = 0;
      this.label = 0;
      this.protectedRegion = false;
      this.eventCuePoint = false;
    }
    setParameters() {}
    getParameters() { return {}; }
  }

  // TextDocument: a value object. Field rules follow the AE scripting guide; a copy only
  // reaches the layer through Property.setValue(textDocument).
  const TD_DEFAULT_CHAR = { font: 'ArialMT', fontSize: 36, applyFill: true, fillColor: [1, 1, 1], applyStroke: false,
    strokeColor: [0, 0, 0], strokeWidth: 1, strokeOverFill: false, tracking: 0, autoLeading: true, leading: 43.2,
    baselineShift: 0, horizontalScale: 100, verticalScale: 100, tsume: 0, fauxBold: false, fauxItalic: false,
    allCaps: false, smallCaps: false, superscript: false, subscript: false };
  const TD_DEFAULT_PARA = { justification: PJ.LEFT_JUSTIFY };
  const color3 = (v, what) => {
    const a = list(v);
    if (!a || a.length !== 3 || !a.every((x) => isNum(x) && x >= 0 && x <= 1)) fail(`${what} must be [r, g, b] in 0..1, got ${fmt(v)}`);
    return a;
  };
  const bool = (v, what) => { if (typeof v !== 'boolean') fail(`${what} must be a boolean, got ${fmt(v)}`); return v; };
  const numIn = (v, lo, hi, what) => { if (!isNum(v) || v < lo || v > hi) fail(`${what} must be a number in ${lo}..${hi}, got ${fmt(v)}`); return v; };
  const TD_SETTERS = {
    text: (t, v) => { if (typeof v !== 'string') fail(`TextDocument.text must be a string, got ${fmt(v)}`); return v; },
    font: (t, v) => { if (typeof v !== 'string' || v === '') fail(`TextDocument.font must be a PostScript name, got ${fmt(v)}`); return v; },
    fontSize: (t, v) => numIn(v, 0.1, 1296, 'TextDocument.fontSize'),
    applyFill: (t, v) => bool(v, 'TextDocument.applyFill'),
    applyStroke: (t, v) => bool(v, 'TextDocument.applyStroke'),
    fillColor: (t, v) => { if (t._f.applyFill !== true) fail('TextDocument.fillColor set while applyFill is not true (set applyFill = true first)'); return color3(v, 'TextDocument.fillColor'); },
    strokeColor: (t, v) => { if (t._f.applyStroke !== true) fail('TextDocument.strokeColor set while applyStroke is not true'); return color3(v, 'TextDocument.strokeColor'); },
    strokeWidth: (t, v) => numIn(v, 0, 1000, 'TextDocument.strokeWidth'),
    strokeOverFill: (t, v) => bool(v, 'TextDocument.strokeOverFill'),
    tracking: (t, v) => numIn(v, -1000, 10000, 'TextDocument.tracking'),
    justification: (t, v) => { if (!Object.values(PJ).includes(v)) fail(`TextDocument.justification must be a ParagraphJustification value, got ${fmt(v)}`); return v; },
    autoLeading: (t, v) => bool(v, 'TextDocument.autoLeading'),
    leading: (t, v) => { if (t._f.autoLeading !== false) fail('TextDocument.leading set while autoLeading is not false (set autoLeading = false first, or the value is ignored)'); return numIn(v, 0, 5000, 'TextDocument.leading'); },
    baselineShift: (t, v) => numIn(v, -5000, 5000, 'TextDocument.baselineShift'),
    horizontalScale: (t, v) => numIn(v, 1, 10000, 'TextDocument.horizontalScale'),
    verticalScale: (t, v) => numIn(v, 1, 10000, 'TextDocument.verticalScale'),
    tsume: (t, v) => numIn(v, 0, 100, 'TextDocument.tsume'),
    fauxBold: (t, v) => bool(v, 'TextDocument.fauxBold'),
    fauxItalic: (t, v) => bool(v, 'TextDocument.fauxItalic'),
    allCaps: (t, v) => bool(v, 'TextDocument.allCaps'),
    smallCaps: (t, v) => bool(v, 'TextDocument.smallCaps'),
    superscript: (t, v) => bool(v, 'TextDocument.superscript'),
    subscript: (t, v) => bool(v, 'TextDocument.subscript'),
  };
  const TD_READONLY = new Set(['fontFamily', 'fontStyle', 'fontLocation', 'boxText', 'pointText', 'boxTextSize', 'boxTextPos', 'baselineLocs']);
  class TextDocImpl {
    constructor(fields) {
      this._f = { text: '', ...TD_DEFAULT_CHAR, ...TD_DEFAULT_PARA, ...(fields || {}) };
      this._dirty = false;
      this._origin = 'new';
    }
    resetCharStyle() { Object.assign(this._f, TD_DEFAULT_CHAR); this._dirty = true; }
    resetParagraphStyle() { Object.assign(this._f, TD_DEFAULT_PARA); this._dirty = true; }
    toString() { return '[object TextDocument]'; }
  }
  const makeTextDoc = (fields, origin) => {
    const impl = new TextDocImpl(fields);
    impl._origin = origin;
    const p = new Proxy(impl, {
      get(t, k, r) {
        if (typeof k === 'string' && (k in TD_SETTERS || TD_READONLY.has(k))) {
          if (k === 'fontFamily') return String(t._f.font).split('-')[0];
          if (k === 'fontStyle') return String(t._f.font).split('-')[1] || 'Regular';
          if (k === 'pointText') return true;
          if (k === 'boxText') return false;
          const v = t._f[k];
          return Array.isArray(v) ? vmArr(v) : v;
        }
        return Reflect.get(t, k, r);
      },
      set(t, k, v) {
        if (typeof k === 'string' && k[0] === '_') { t[k] = v; return true; }
        if (TD_READONLY.has(k)) fail(`TextDocument.${String(k)} is read-only`);
        if (!(k in TD_SETTERS)) fail(`TextDocument has no attribute "${String(k)}"`);
        t._f[k] = TD_SETTERS[k](t, v);
        t._dirty = true;
        return true;
      },
    });
    state.impl.set(p, impl);
    state.textDocs.push(impl);
    return p;
  };
  function TextDocument(text) {
    if (text !== undefined && typeof text !== 'string') fail(`new TextDocument(text): text must be a string, got ${fmt(text)}`);
    const p = makeTextDoc({ text: text || '' }, 'new TextDocument');
    state.impl.get(p)._dirty = true;   // a fresh document must reach a layer through setValue
    return p;
  }
  TextDocument.prototype = TextDocImpl.prototype;

  // ------------------------------------------------------------------ property tree
  let nodeSerial = 0;
  class Node {
    constructor(layer, parent, mn, def, displayName) {
      this.layer = layer;
      this.parent = parent;
      this.mn = mn;
      this.def = def;
      this.name = displayName || def.name;
      this.children = [];
      this.keys = [];
      this.touched = false;
      this.serial = ++nodeSerial;
      this.enabled = true;
      if (def.kind === 'prop') {
        if (def.pvt === PVT.SHAPE) this.value = { v: [], i: [], o: [], closed: true };
        else if (def.pvt === PVT.TEXT_DOCUMENT) this.value = { ...new TextDocImpl()._f };
        else if (def.pvt === PVT.COLOR) this.value = [...def.dflt, 1];
        else this.value = Array.isArray(def.dflt) ? def.dflt.slice() : def.dflt;
      } else if (def.kind === 'named') {
        for (const [cmn, cdef] of def.children) this.children.push(new Node(layer, this, cmn, cdef));
      }
      if (def.mask) { this.maskMode = MASK_MODE.ADD; this.inverted = false; this.locked = false; this.rotoBezier = false; }
    }
    get index() { return this.parent ? this.parent.children.indexOf(this) + 1 : 0; }
    path() {
      const parts = [];
      for (let n = this; n && n.parent; n = n.parent) parts.unshift(n.mn);
      return (this.layer ? `layer "${this.layer._name}" > ` : '') + parts.join(' > ');
    }
    child(mn) { return this.children.find((c) => c.mn === mn) || null; }
  }

  const validateValue = (n, v, what) => {
    const d = n.def;
    const where = `${what} on "${n.mn}" (${n.path()})`;
    switch (d.pvt) {
      case PVT.OneD: {
        let x = v;
        if (d.checkbox && typeof x === 'boolean') x = x ? 1 : 0;
        if (!isNum(x)) fail(`${where}: expected a number, got ${fmt(v)}`);
        if (d.integer && Math.round(x) !== x) fail(`${where}: expected an integer menu index, got ${x}`);
        if (d.min !== undefined && x < d.min - 1e-9) fail(`${where}: ${x} is below the minimum ${d.min}`);
        if (d.max !== undefined && x > d.max + 1e-9) fail(`${where}: ${x} is above the maximum ${d.max}`);
        return x;
      }
      case PVT.TwoD: case PVT.TwoD_SPATIAL: {
        const a = list(v);
        if (!a || a.length !== 2 || !a.every(isNum)) fail(`${where}: expected [x, y] (2 numbers), got ${fmt(v)}`);
        for (const x of a) {
          if (d.min !== undefined && x < d.min - 1e-9) fail(`${where}: ${x} is below the minimum ${d.min}`);
          if (d.max !== undefined && x > d.max + 1e-9) fail(`${where}: ${x} is above the maximum ${d.max}`);
        }
        return a;
      }
      case PVT.ThreeD: case PVT.ThreeD_SPATIAL: {
        const a = list(v);
        if (!a || (a.length !== 2 && a.length !== 3) || !a.every(isNum)) fail(`${where}: expected 2 or 3 numbers, got ${fmt(v)}`);
        if (a.length === 2) a.push(Array.isArray(n.value) ? n.value[2] : 0);
        return a;
      }
      case PVT.COLOR: return [...color3(v, where), 1];
      case PVT.SHAPE: {
        const s = unwrap(v);
        if (!(s instanceof ShapeImpl)) fail(`${where}: expected a Shape object, got ${fmt(v)}`);
        if (s._v.length === 0) fail(`${where}: Shape has no vertices`);
        if (s._i.length !== s._v.length || s._o.length !== s._v.length) {
          fail(`${where}: Shape needs equal-length arrays (vertices ${s._v.length}, inTangents ${s._i.length}, outTangents ${s._o.length})`);
        }
        return { v: s._v.map((p) => p.slice()), i: s._i.map((p) => p.slice()), o: s._o.map((p) => p.slice()), closed: s._closed };
      }
      case PVT.TEXT_DOCUMENT: {
        const td = unwrap(v);
        if (!(td instanceof TextDocImpl)) fail(`${where}: expected a TextDocument, got ${fmt(v)}`);
        if (td._f.text.includes('\n')) fail(`${where}: text contains "\\n"; After Effects line breaks are "\\r"`);
        td._dirty = false;
        td._applied = true;
        const f = { ...td._f };
        if (!state.installedFonts.has(f.font)) {
          record(`${where}: font "${f.font}" is not installed (fonts in <root>/Fonts: ${[...state.installedFonts].join(', ') || 'none'}); After Effects keeps the previous font`);
          f.font = n.value && n.value.font ? n.value.font : 'ArialMT';
        }
        return f;
      }
      case PVT.MARKER: {
        if (!(v instanceof MarkerValue)) fail(`${where}: expected a MarkerValue, got ${fmt(v)}`);
        return { comment: v.comment, duration: v.duration, chapter: v.chapter };
      }
      default: fail(`${where}: property has no settable value`);
    }
    return undefined;
  };

  const exportValue = (n, value) => {
    const d = n.def;
    if (d.pvt === PVT.SHAPE) return makeShape(value);
    if (d.pvt === PVT.TEXT_DOCUMENT) return makeTextDoc({ ...value }, 'value');
    if (d.pvt === PVT.MARKER) return value ? new MarkerValue(value.comment) : null;
    return Array.isArray(value) ? vmArr(value) : value;
  };

  // Selector Index props only apply in Index units, after Based On is chosen.
  const guardSet = (n) => {
    if (n.def.units) {
      const adv = n.parent.child('ADBE Text Range Advanced');
      const units = adv.child('ADBE Text Range Units');
      const based = adv.child('ADBE Text Range Type2');
      if (units.value !== n.def.units) fail(`"${n.mn}" set while Units is ${units.value}; set "ADBE Text Range Units" to ${n.def.units} first`);
      if (n.def.units === 2 && !based.touched) fail(`"${n.mn}" set before "ADBE Text Range Type2" (Based On); set Units and Based On first`);
    }
    if (n.mn === 'ADBE Text Range Units' || n.mn === 'ADBE Text Range Type2') {
      const sel = n.parent.parent;
      for (const c of sel.children) {
        if (c.def.units && c.touched) fail(`"${n.mn}" changed after "${c.mn}" was set; set Units / Based On before the index values`);
      }
    }
  };

  const newKey = (n, t, value) => {
    const dims = easeDims(n.def.pvt);
    const ease = () => Array.from({ length: dims }, () => ({ speed: 0, influence: DEFAULT_EASE_INFLUENCE }));
    return {
      time: t, value, inType: KIT.LINEAR, outType: KIT.LINEAR, inEase: ease(), outEase: ease(), easeSet: false,
      spatialAutoBezier: spatialDims(n.def.pvt) > 0, spatialContinuous: spatialDims(n.def.pvt) > 0,
      inTangent: null, outTangent: null, temporalContinuous: false, temporalAutoBezier: false,
    };
  };

  const PROP_SETTABLE = new Set(['name', 'enabled', 'maskMode', 'inverted', 'locked', 'rotoBezier', 'selected']);
  class PropertyAPI {
    constructor(node) { this._n = node; this._g = node.layer ? node.layer._gen : 0; }
    _check(k) {
      const n = this._n;
      if (n.layer && this._g !== n.layer._gen) {
        fail(`Object is invalid: "${n.mn}" (${n.path()}) was obtained before a later addProperty() on this layer; re-acquire it from the layer [.${k}]`);
      }
    }
    _prop(what) { if (this._n.def.kind !== 'prop') fail(`${what} called on group "${this._n.mn}"; it only exists on properties`); return this._n; }
    _group(what) { if (this._n.def.kind === 'prop') fail(`${what} called on property "${this._n.mn}"; it only exists on property groups`); return this._n; }
    _key(i, what) {
      const n = this._prop(what);
      if (!Number.isInteger(i) || i < 1 || i > n.keys.length) fail(`${what}(${fmt(i)}) on "${n.mn}": key index out of range 1..${n.keys.length}`);
      return n.keys[i - 1];
    }
    get name() { return this._n.name; }
    set name(v) {
      const n = this._n;
      if (!n.def.renamable) fail(`cannot rename "${n.mn}" (only groups, shapes, effects, masks, animators and selectors can be renamed)`);
      if (typeof v !== 'string' || v === '') fail(`name must be a non-empty string, got ${fmt(v)}`);
      n.name = v;
    }
    get matchName() { return this._n.mn; }
    get propertyType() { const k = this._n.def.kind; return k === 'prop' ? PT.PROPERTY : k === 'indexed' ? PT.INDEXED_GROUP : PT.NAMED_GROUP; }
    get propertyValueType() { return this._n.def.kind === 'prop' ? this._n.def.pvt : PVT.NO_VALUE; }
    get propertyIndex() { return this._n.index; }
    get parentProperty() {
      const n = this._n;
      if (n.parent && n.parent.parent) return handle(n.parent);
      return n.layer ? n.layer._proxy : null;
    }
    get numProperties() { return this._n.def.kind === 'prop' ? undefined : this._n.children.length; }
    get isEffect() { return !!this._n.def.effect; }
    get isMask() { return !!this._n.def.mask; }
    get enabled() { return this._n.enabled; }
    set enabled(v) { this._n.enabled = bool(v, 'enabled'); }
    get active() { return this._n.enabled; }
    get canSetExpression() { return this._n.def.kind === 'prop'; }
    get canVaryOverTime() { return this._n.def.kind === 'prop' && this._n.def.pvt !== PVT.NO_VALUE; }
    get isTimeVarying() { return this._n.def.kind === 'prop' && this._n.keys.length > 0; }
    get isSpatial() { return this._n.def.kind === 'prop' && spatialDims(this._n.def.pvt) > 0; }
    get hasMin() { return this._n.def.kind === 'prop' && this._n.def.min !== undefined; }
    get hasMax() { return this._n.def.kind === 'prop' && this._n.def.max !== undefined; }
    get minValue() { if (this._n.def.min === undefined) fail(`"${this._n.mn}" has no minValue (check hasMin first)`); return this._n.def.min; }
    get maxValue() { if (this._n.def.max === undefined) fail(`"${this._n.mn}" has no maxValue (check hasMax first)`); return this._n.def.max; }
    set expression(v) { fail(`expressions are not used by this build and not modelled (setting expression on "${this._n.mn}")`); }

    property(x) {
      const n = this._group('property()');
      return handle(lookupChild(n, x));
    }
    canAddProperty(mn) {
      const n = this._n;
      return n.def.kind === 'indexed' && n.def.addable.includes(mn) && !!ADDABLE[mn];
    }
    addProperty(mn) {
      const n = this._group('addProperty()');
      requireUndo(`addProperty("${mn}")`);
      if (n.def.kind !== 'indexed') fail(`addProperty("${mn}") on "${n.mn}" (${n.path()}), which is not an indexed group`);
      if (!n.def.addable.includes(mn)) {
        fail(ALL_MATCHNAMES.has(mn) ? `"${mn}" cannot be added to "${n.mn}" (wrong parent)` : `unknown matchName "${mn}" in addProperty under "${n.mn}"`);
      }
      const def = ADDABLE[mn];
      if (!def) fail(`"${mn}" exists in After Effects but is not modelled by tools/mock_ae/tree.js`);
      const count = n.children.filter((c) => c.mn === mn).length + 1;
      const child = new Node(n.layer, n, mn, def, def.effect && count === 1 ? def.name : `${def.name} ${count}`);
      n.children.push(child);
      if (n.layer) n.layer._gen++;   // AE invalidates earlier references on this layer
      return handle(child);
    }

    get value() { const n = this._prop('value'); return exportValue(n, n.value); }
    setValue(v) {
      const n = this._prop('setValue');
      if (n.keys.length > 0) fail(`setValue on "${n.mn}" (${n.path()}), which has keyframes (After Effects throws; use setValueAtTime / setValueAtKey)`);
      guardSet(n);
      n.value = validateValue(n, v, 'setValue');
      n.touched = true;
    }
    valueAtTime(t) {
      const n = this._prop('valueAtTime');
      if (!n.keys.length) return exportValue(n, n.value);
      let k = n.keys[0];
      for (const q of n.keys) if (q.time <= t) k = q;
      return exportValue(n, k.value);
    }
    get numKeys() { return this._prop('numKeys').keys.length; }
    addKey(t) {
      const n = this._prop('addKey');
      if (!isNum(t)) fail(`addKey on "${n.mn}": time must be a number, got ${fmt(t)}`);
      const comp = n.layer ? n.layer._comp : n.comp;
      if (comp && gridError(t, comp._fps) > 1e-6) {
        fail(`addKey(${t}) on "${n.mn}" (${n.path()}): not on the ${comp._fps} fps frame grid (frame ${(t * comp._fps).toFixed(4)}); a HOLD here switches one frame late`);
      }
      guardSet(n);
      const ex = n.keys.findIndex((k) => Math.abs(k.time - t) < 1e-9);
      if (ex >= 0) return ex + 1;
      let prev = n.value;
      for (const k of n.keys) if (k.time < t) prev = k.value;
      const key = newKey(n, t, structuredClone(prev));
      let pos = n.keys.findIndex((k) => k.time > t);
      if (pos < 0) pos = n.keys.length;
      n.keys.splice(pos, 0, key);
      n.touched = true;
      return pos + 1;
    }
    setValueAtKey(i, v) {
      const k = this._key(i, 'setValueAtKey');
      guardSet(this._n);
      k.value = validateValue(this._n, v, `setValueAtKey(${i})`);
      k.valueSet = true;
    }
    setValueAtTime(t, v) {
      const i = this.addKey(t);
      this.setValueAtKey(i, v);
    }
    keyTime(i) { return this._key(i, 'keyTime').time; }
    keyValue(i) { return exportValue(this._n, this._key(i, 'keyValue').value); }
    nearestKeyIndex(t) {
      const n = this._prop('nearestKeyIndex');
      if (!n.keys.length) fail(`nearestKeyIndex on "${n.mn}", which has no keys`);
      let best = 0;
      n.keys.forEach((k, j) => { if (Math.abs(k.time - t) < Math.abs(n.keys[best].time - t)) best = j; });
      return best + 1;
    }
    setInterpolationTypeAtKey(i, inType, outType) {
      const k = this._key(i, 'setInterpolationTypeAtKey');
      const out = outType === undefined ? inType : outType;
      for (const [v, side] of [[inType, 'inType'], [out, 'outType']]) {
        if (!Object.values(KIT).includes(v)) fail(`setInterpolationTypeAtKey(${i}) on "${this._n.mn}": ${side} must be a KeyframeInterpolationType, got ${fmt(v)}`);
      }
      k.inType = inType;
      k.outType = out;
      k.typeSet = true;
    }
    keyInInterpolationType(i) { return this._key(i, 'keyInInterpolationType').inType; }
    keyOutInterpolationType(i) { return this._key(i, 'keyOutInterpolationType').outType; }
    setTemporalEaseAtKey(i, inEase, outEase) {
      const k = this._key(i, 'setTemporalEaseAtKey');
      const n = this._n;
      const dims = easeDims(n.def.pvt);
      const check = (arr, side) => {
        const a = list(arr);
        if (!a) fail(`setTemporalEaseAtKey(${i}) on "${n.mn}": ${side} must be an Array of KeyframeEase, got ${fmt(arr)}`);
        if (a.length !== dims) {
          fail(`setTemporalEaseAtKey(${i}) on "${n.mn}" (${PVT_NAME[n.def.pvt]}): ${side} needs ${dims} KeyframeEase object${dims > 1 ? 's' : ''}, got ${a.length}`);
        }
        return a.map((e) => {
          if (!(e instanceof KeyframeEase)) fail(`setTemporalEaseAtKey(${i}) on "${n.mn}": ${side} entries must be KeyframeEase objects, got ${fmt(e)}`);
          if (!isNum(e.influence) || e.influence < 0.1 || e.influence > 100) fail(`setTemporalEaseAtKey(${i}) on "${n.mn}": influence ${fmt(e.influence)} is outside 0.1..100`);
          if (!isNum(e.speed)) fail(`setTemporalEaseAtKey(${i}) on "${n.mn}": speed must be a number`);
          return { speed: e.speed, influence: e.influence };
        });
      };
      k.inEase = check(inEase, 'inTemporalEase');
      k.outEase = check(outEase === undefined ? inEase : outEase, 'outTemporalEase');
      k.easeSet = true;
    }
    keyInTemporalEase(i) { return vmArr(this._key(i, 'keyInTemporalEase').inEase.map((e) => new KeyframeEase(e.speed, e.influence))); }
    keyOutTemporalEase(i) { return vmArr(this._key(i, 'keyOutTemporalEase').outEase.map((e) => new KeyframeEase(e.speed, e.influence))); }
    _spatial(what) {
      const sd = spatialDims(this._n.def.pvt);
      if (!sd) fail(`${what} on "${this._n.mn}" (${PVT_NAME[this._n.def.pvt]}), which is not a spatial property`);
      return sd;
    }
    setSpatialTangentsAtKey(i, inT, outT) {
      const k = this._key(i, 'setSpatialTangentsAtKey');
      const sd = this._spatial('setSpatialTangentsAtKey');
      const check = (v, side) => {
        const a = list(v);
        if (!a || a.length !== sd || !a.every(isNum)) fail(`setSpatialTangentsAtKey(${i}) on "${this._n.mn}" (${PVT_NAME[this._n.def.pvt]}): ${side} must be ${sd} numbers, got ${fmt(v)}`);
        return a;
      };
      k.inTangent = check(inT, 'inTangent');
      k.outTangent = check(outT === undefined ? inT : outT, 'outTangent');
    }
    setSpatialAutoBezierAtKey(i, b) { const k = this._key(i, 'setSpatialAutoBezierAtKey'); this._spatial('setSpatialAutoBezierAtKey'); k.spatialAutoBezier = bool(b, 'autoBezier'); }
    setSpatialContinuousAtKey(i, b) { const k = this._key(i, 'setSpatialContinuousAtKey'); this._spatial('setSpatialContinuousAtKey'); k.spatialContinuous = bool(b, 'continuous'); }
    setTemporalContinuousAtKey(i, b) { this._key(i, 'setTemporalContinuousAtKey').temporalContinuous = bool(b, 'continuous'); }
    setTemporalAutoBezierAtKey(i, b) { this._key(i, 'setTemporalAutoBezierAtKey').temporalAutoBezier = bool(b, 'autoBezier'); }
    keySpatialAutoBezier(i) { return this._key(i, 'keySpatialAutoBezier').spatialAutoBezier; }

    _mask(what) { if (!this._n.def.mask) fail(`${what} only exists on masks ("ADBE Mask Atom"), not on "${this._n.mn}"`); return this._n; }
    get maskMode() { return this._mask('maskMode').maskMode; }
    set maskMode(v) {
      const n = this._mask('maskMode');
      if (!Object.values(MASK_MODE).includes(v)) fail(`maskMode must be a MaskMode value, got ${fmt(v)}`);
      n.maskMode = v;
    }
    get inverted() { return this._mask('inverted').inverted; }
    set inverted(v) { this._mask('inverted').inverted = bool(v, 'inverted'); }
    toString() { return '[object Property]'; }
  }
  const handle = (node) => {
    const api = new PropertyAPI(node);
    const p = new Proxy(api, {
      get(t, k, r) {
        if (typeof k === 'string' && k[0] !== '_' && k !== 'constructor' && k !== 'then') t._check(k);
        return Reflect.get(t, k, r);
      },
      set(t, k, v, r) {
        if (typeof k === 'string' && k[0] === '_') { t[k] = v; return true; }
        t._check(k);
        if (!PROP_SETTABLE.has(k)) fail(`cannot set .${String(k)} on "${node.mn}" (read-only, or not an attribute; values go through setValue)`);
        return Reflect.set(t, k, v, r);
      },
    });
    return p;
  };

  const lookupChild = (n, x) => {
    if (typeof x === 'number') {
      if (!Number.isInteger(x) || x < 1 || x > n.children.length) fail(`property(${x}) on "${n.mn}" (${n.path()}): index out of range 1..${n.children.length}`);
      return n.children[x - 1];
    }
    if (typeof x !== 'string') fail(`property() needs a matchName or an index, got ${fmt(x)}`);
    const c = n.child(x);
    if (c) return c;
    if (n.children.some((q) => q.name === x)) fail(`property("${x}") on "${n.mn}" uses a display name; use the matchName (display names are localised)`);
    const layer = n.layer;
    if (x === 'ADBE Audio Group' && layer && !layer._hasAudio) fail(`property("ADBE Audio Group") on layer "${layer._name}", which has no audio (check layer.hasAudio first)`);
    if (['ADBE Transform Group', 'ADBE Effect Parade', 'ADBE Mask Parade'].includes(x) && layer && !layer._hasVideo) {
      fail(`property("${x}") on audio-only layer "${layer._name}"`);
    }
    if (ALL_MATCHNAMES.has(x)) fail(`"${x}" is not a child of "${n.mn}" (${n.path() || 'layer root'}): wrong parent`);
    fail(`unknown matchName "${x}" under "${n.mn}" (${n.path() || 'layer root'})`);
    return null;
  };

  // ------------------------------------------------------------------ items
  let itemSerial = 0;
  const ITEM_SETTABLE = ['name', 'parentFolder', 'comment', 'label', 'selected'];
  class ItemImpl {
    constructor(project, name, typeName) {
      this._project = project;
      this._name = name;
      this._typeName = typeName;
      this._id = ++itemSerial;
      this._parent = project ? project._root : null;
      this._comment = '';
      if (project) project._items.push(this);
    }
    get id() { return this._id; }
    get name() { return this._name; }
    set name(v) { if (typeof v !== 'string' || v === '') fail(`item name must be a non-empty string, got ${fmt(v)}`); this._name = v; }
    get typeName() { return this._typeName; }
    get parentFolder() { return this._parent ? this._parent._proxy : null; }
    set parentFolder(v) {
      const f = unwrap(v);
      if (!(f instanceof FolderImpl)) fail(`parentFolder must be a FolderItem, got ${fmt(v)}`);
      if (f._project !== this._project) fail('parentFolder belongs to another project');
      this._parent = f;
    }
    get comment() { return this._comment; }
    set comment(v) { this._comment = String(v); }
    get label() { return 0; }
    set label(v) {}
    set selected(v) {}
  }

  class FolderImpl extends ItemImpl {
    constructor(project, name) { super(project, name, 'Folder'); }
    get numItems() { return this._project._items.filter((i) => i._parent === this).length; }
    item(i) { const a = this._project._items.filter((q) => q._parent === this); if (!a[i - 1]) fail(`FolderItem.item(${i}) out of range`); return a[i - 1]._proxy; }
  }
  const FOLDER_SETTABLE = new Set(ITEM_SETTABLE);

  class FootageImpl extends ItemImpl {
    constructor(project, file, info) {
      super(project, path.basename(file), 'Footage');
      this._file = file;
      this._info = info;
    }
    get width() { return this._info.width; }
    get height() { return this._info.height; }
    get pixelAspect() { return 1; }
    get duration() { return this._info.duration; }
    get frameRate() { return this._info.frameRate; }
    get frameDuration() { return this._info.frameRate ? 1 / this._info.frameRate : 0; }
    get hasVideo() { return this._info.hasVideo; }
    get hasAudio() { return this._info.hasAudio; }
    get file() { return new File(this._file); }
    get mainSource() { return { isStill: this._info.isStill, hasAlpha: false, nativeFrameRate: this._info.frameRate, conformFrameRate: 0 }; }
    get usedIn() { return vmArr([]); }
  }
  const FOOTAGE_SETTABLE = new Set(ITEM_SETTABLE);

  const COMP_SETTABLE = new Set([...ITEM_SETTABLE, 'bgColor', 'duration', 'frameRate', 'width', 'height', 'pixelAspect',
    'displayStartTime', 'workAreaStart', 'workAreaDuration', 'motionBlur', 'shutterAngle', 'shutterPhase',
    'resolutionFactor', 'frameBlending', 'preserveNestedFrameRate', 'preserveNestedResolution', 'renderer', 'draft3d']);
  class CompImpl extends ItemImpl {
    constructor(project, name, w, h, par, dur, fps) {
      super(project, name, 'Composition');
      this._w = w; this._h = h; this._par = par; this._dur = dur; this._fps = fps;
      this._bg = [0, 0, 0];
      this._bgSet = false;
      this._layers = [];   // index 0 = top (layer 1)
      this._marker = new Node(null, null, 'ADBE Marker', { kind: 'prop', name: 'Marker', pvt: PVT.MARKER, dflt: null });
      this._marker.comp = this;
      const self = this;
      this._layerColl = strictProxy({
        addShape() { requireUndo('layers.addShape()'); return self._addLayer('shape', {})._proxy; },
        addText(text) {
          requireUndo('layers.addText()');
          let t = text;
          const td = unwrap(text);
          if (td instanceof TextDocImpl) { t = td._f.text; td._dirty = false; }
          if (t === undefined) t = '';
          if (typeof t !== 'string') fail(`layers.addText(text): text must be a string or TextDocument, got ${fmt(text)}`);
          if (t.includes('\n')) fail('layers.addText(): text contains "\\n"; After Effects line breaks are "\\r"');
          const L = self._addLayer('text', {});
          L._root.child('ADBE Text Properties').child('ADBE Text Document').value.text = t;
          return L._proxy;
        },
        add(item, duration) {
          requireUndo('layers.add()');
          const it = unwrap(item);
          if (!(it instanceof FootageImpl) && !(it instanceof CompImpl)) fail(`layers.add(item): item must be a FootageItem or CompItem, got ${fmt(item)}`);
          if (it._project !== self._project) fail('layers.add(item): item belongs to another project');
          if (it === self || (it instanceof CompImpl && it._contains(self))) fail(`layers.add(): adding comp "${it._name}" to "${self._name}" would create a cycle`);
          const still = it instanceof FootageImpl && it._info.isStill;
          if (duration !== undefined && (!isNum(duration) || duration <= 0)) fail(`layers.add(item, duration): duration must be a positive number, got ${fmt(duration)}`);
          return self._addLayer('av', { source: it, still, stillDuration: still ? (duration === undefined ? self._dur : duration) : undefined })._proxy;
        },
        get length() { return self._layers.length; },
      }, () => `comp "${self._name}".layers`, new Set());
    }
    _addLayer(kind, o) {
      const L = new LayerImpl(this, kind, o);
      this._layers.unshift(L);   // a new layer goes on top
      return L;
    }
    _contains(c) {
      return this._layers.some((L) => L._source === c || (L._source instanceof CompImpl && L._source._contains(c)));
    }
    get width() { return this._w; }
    get height() { return this._h; }
    get pixelAspect() { return this._par; }
    get duration() { return this._dur; }
    get frameRate() { return this._fps; }
    get frameDuration() { return 1 / this._fps; }
    get bgColor() { return vmArr(this._bg); }
    set bgColor(v) { this._bg = color3(v, `comp "${this._name}".bgColor`); this._bgSet = true; }
    get layers() { return this._layerColl; }
    get numLayers() { return this._layers.length; }
    layer(i) {
      if (!Number.isInteger(i) || i < 1 || i > this._layers.length) fail(`comp "${this._name}".layer(${fmt(i)}): index out of range 1..${this._layers.length}`);
      return this._layers[i - 1]._proxy;
    }
    get markerProperty() { return handle(this._marker); }
    get hasAudio() { return this._layers.some((L) => L._hasAudio); }
    get hasVideo() { return true; }
    get displayStartTime() { return 0; }
    set displayStartTime(v) { if (v !== 0) fail('displayStartTime other than 0 is not modelled'); }
    get workAreaStart() { return 0; }
    get workAreaDuration() { return this._dur; }
    get usedIn() { return vmArr([]); }
    openInViewer() { state.viewer = this._name; return null; }
  }

  // ------------------------------------------------------------------ layers
  const LAYER_SETTABLE = new Set(['name', 'startTime', 'inPoint', 'outPoint', 'enabled', 'audioEnabled', 'solo', 'shy',
    'locked', 'quality', 'motionBlur', 'label', 'comment', 'selected', 'collapseTransformation']);
  class LayerImpl {
    constructor(comp, kind, o) {
      this._comp = comp;
      this._kind = kind;
      this._source = o.source || null;
      this._still = !!o.still;
      this._gen = 1;
      this._name = kind === 'shape' ? 'Shape Layer' : kind === 'text' ? 'Text Layer' : this._source._name;
      this._nameSet = false;
      const src = this._source;
      if (kind === 'av') {
        this._hasVideo = src instanceof CompImpl ? true : src._info.hasVideo;
        this._hasAudio = src instanceof CompImpl ? src.hasAudio : src._info.hasAudio;
        this._timed = src instanceof CompImpl || !src._info.isStill;
        this._srcDur = src instanceof CompImpl ? src._dur : (src._info.isStill ? null : src._info.duration);
      } else {
        this._hasVideo = true;
        this._hasAudio = false;
        this._timed = false;
        this._srcDur = null;
      }
      this._audioEnabled = this._hasAudio;
      this._enabled = this._hasVideo;
      this._start = 0;     // "Create Layers at Composition Start Time" (AE default)
      this._in = 0;
      this._out = kind === 'av' ? (this._timed ? this._srcDur : o.stillDuration) : comp._dur;
      this._startSet = false;
      this._inSet = false;
      this._outSet = false;
      const w = kind === 'av' ? src.width : comp._w;
      const h = kind === 'av' ? src.height : comp._h;
      const anchor = kind === 'av' ? [w / 2, h / 2, 0] : [0, 0, 0];
      this._root = new Node(this, null, 'Layer', layerRootDef(kind, { hasVideo: this._hasVideo, hasAudio: this._hasAudio, anchor, position: [comp._w / 2, comp._h / 2, 0] }));
      strictProxy(this, () => `layer "${this._name}"`, LAYER_SETTABLE);
    }
    get name() { return this._name; }
    set name(v) { if (typeof v !== 'string' || v === '') fail(`layer name must be a non-empty string, got ${fmt(v)}`); this._name = v; this._nameSet = true; }
    get isNameSet() { return this._nameSet; }
    get index() { return this._comp._layers.indexOf(this) + 1; }
    get matchName() { return this._kind === 'shape' ? 'ADBE Vector Layer' : this._kind === 'text' ? 'ADBE Text Layer' : 'ADBE AV Layer'; }
    get containingComp() { return this._comp._proxy; }
    get source() { return this._source ? this._source._proxy : null; }
    get hasVideo() { return this._hasVideo; }
    get hasAudio() { return this._hasAudio; }
    get audioActive() { return this._hasAudio && this._audioEnabled; }
    get audioEnabled() { return this._audioEnabled; }
    set audioEnabled(v) {
      if (!this._hasAudio) fail(`audioEnabled set on layer "${this._name}", which has no audio`);
      this._audioEnabled = bool(v, 'audioEnabled');
    }
    get enabled() { return this._enabled; }
    set enabled(v) { this._enabled = bool(v, 'enabled'); }
    get width() { return this._kind === 'av' ? this._source.width : this._comp._w; }
    get height() { return this._kind === 'av' ? this._source.height : this._comp._h; }
    get stretch() { return 100; }
    get threeDLayer() { return false; }
    get nullLayer() { return false; }
    get startTime() { return this._start; }
    set startTime(v) {
      if (!isNum(v)) fail(`layer "${this._name}".startTime must be a number, got ${fmt(v)}`);
      if (this._inSet || this._outSet) fail(`layer "${this._name}": startTime set after inPoint/outPoint (startTime moves the whole layer; set it first)`);
      const d = v - this._start;
      this._start = v;
      this._in += d;
      this._out += d;
      this._startSet = true;
    }
    get inPoint() { return this._in; }
    set inPoint(v) {
      const who = `layer "${this._name}" in comp "${this._comp._name}"`;
      if (!isNum(v)) fail(`${who}: inPoint must be a number, got ${fmt(v)}`);
      if (this._timed && !this._startSet) fail(`${who}: inPoint set before startTime (footage, audio and comp layers: set startTime, then inPoint, then outPoint)`);
      if (v < this._start - 1e-6) fail(`${who}: inPoint ${v} is before startTime ${this._start} (before the source starts)`);
      if (v >= this._out - 1e-6) fail(`${who}: inPoint ${v} is not before the current outPoint ${this._out}`);
      if (v < -1e-6 || v >= this._comp._dur - 1e-6) fail(`${who}: inPoint ${v} is outside the comp (0..${this._comp._dur})`);
      if (gridError(v, this._comp._fps) > 1e-6) fail(`${who}: inPoint ${v} is not on the ${this._comp._fps} fps frame grid (frame ${(v * this._comp._fps).toFixed(4)}); the layer would start one frame late`);
      this._in = v;
      this._inSet = true;
    }
    get outPoint() { return this._out; }
    set outPoint(v) {
      const who = `layer "${this._name}" in comp "${this._comp._name}"`;
      if (!isNum(v)) fail(`${who}: outPoint must be a number, got ${fmt(v)}`);
      if (this._timed && !this._startSet) fail(`${who}: outPoint set before startTime (footage, audio and comp layers: set startTime, then inPoint, then outPoint)`);
      if (v <= this._in + 1e-6) fail(`${who}: outPoint ${v} is not after inPoint ${this._in}`);
      if (this._timed && v > this._start + this._srcDur + 1e-6) {
        fail(`${who}: outPoint ${v} is after the end of the source (startTime ${this._start} + duration ${this._srcDur} = ${this._start + this._srcDur})`);
      }
      if (v > this._comp._dur + 1e-6) fail(`${who}: outPoint ${v} is after the end of the comp (${this._comp._dur})`);
      const atSourceEnd = this._timed && Math.abs(v - (this._start + this._srcDur)) < 1e-9;
      if (!atSourceEnd && gridError(v, this._comp._fps) > 1e-6) fail(`${who}: outPoint ${v} is not on the ${this._comp._fps} fps frame grid (frame ${(v * this._comp._fps).toFixed(4)}); the layer would show one extra frame`);
      this._out = v;
      this._outSet = true;
    }
    property(x) { return handle(lookupChild(this._root, x)); }
    get numProperties() { return this._root.children.length; }
    set quality(v) {}
    set motionBlur(v) { bool(v, 'motionBlur'); }
    set collapseTransformation(v) { fail('collapseTransformation is not used by this build (it would stop precomps clipping to their bounds)'); }
    set solo(v) {}
    set shy(v) {}
    set locked(v) { bool(v, 'locked'); }
    set label(v) {}
    set comment(v) {}
    set selected(v) {}
  }

  // ------------------------------------------------------------------ project, render queue
  class OutputModuleImpl {
    constructor(comp) {
      this._file = path.join(os.homedir(), 'Desktop', `${comp._name}.mov`);
      this._template = 'High Quality';
    }
    get templates() { return vmArr(OM_TEMPLATES); }
    applyTemplate(name) {
      if (!OM_TEMPLATES.includes(name)) softThrow(`After Effects error: output module template "${name}" not found`);
      this._template = name;
      const ext = name.startsWith('H.264') ? '.mp4' : name.includes('AIFF') ? '.aif' : '.mov';
      this._file = this._file.replace(/\.[^./\\]*$/, ext);
    }
    get file() { return new File(this._file); }
    set file(v) {
      if (!(v instanceof File)) fail(`outputModule.file must be a File, got ${fmt(v)}`);
      if (!fs.existsSync(path.dirname(v._path))) fail(`outputModule.file folder does not exist: ${path.dirname(v._path)}`);
      this._file = v._path;
    }
    get name() { return this._template; }
  }
  class RQItemImpl {
    constructor(comp) { this._comp = comp; this._oms = [new OutputModuleImpl(comp)]; this._render = true; strictProxy(this, () => 'RenderQueueItem', new Set(['render'])); }
    get comp() { return this._comp._proxy; }
    get numOutputModules() { return this._oms.length; }
    outputModule(i) {
      if (i !== 1 && !(Number.isInteger(i) && i >= 1 && i <= this._oms.length)) fail(`outputModule(${fmt(i)}) out of range`);
      const om = this._oms[i - 1];
      return om._proxy || strictProxy(om, () => 'OutputModule', new Set(['file']));
    }
    get render() { return this._render; }
    set render(v) { this._render = bool(v, 'render'); }
  }

  class ProjectImpl {
    constructor() {
      this._items = [];
      this._root = null;
      this._root = new FolderImpl(this, 'Root');
      this._items = [];   // the root folder is not an item in project.items
      strictProxy(this._root, () => 'rootFolder', FOLDER_SETTABLE);
      this._rq = [];
      this._file = null;
      const self = this;
      this._itemColl = strictProxy({
        addComp(name, w, h, par, dur, fps) {
          requireUndo('items.addComp()');
          if (typeof name !== 'string' || name === '') fail(`addComp: name must be a non-empty string, got ${fmt(name)}`);
          if (!Number.isInteger(w) || w < 4 || w > 30000) fail(`addComp("${name}"): width must be an integer 4..30000, got ${fmt(w)}`);
          if (!Number.isInteger(h) || h < 4 || h > 30000) fail(`addComp("${name}"): height must be an integer 4..30000, got ${fmt(h)}`);
          if (!isNum(par) || par < 0.01 || par > 100) fail(`addComp("${name}"): pixelAspect must be 0.01..100, got ${fmt(par)}`);
          if (!isNum(fps) || fps < 1 || fps > 999) fail(`addComp("${name}"): frameRate must be 1..999, got ${fmt(fps)}`);
          if (!isNum(dur) || dur < 1 / fps - 1e-9 || dur > 10800) fail(`addComp("${name}"): duration must be one frame..10800 s, got ${fmt(dur)}`);
          if (gridError(dur, fps) > 1e-6) fail(`addComp("${name}"): duration ${dur} is not a whole number of frames at ${fps} fps (${(dur * fps).toFixed(4)})`);
          const c = new CompImpl(self, name, w, h, par, dur, fps);
          return strictProxy(c, () => `comp "${c._name}"`, COMP_SETTABLE);
        },
        addFolder(name) {
          requireUndo('items.addFolder()');
          if (typeof name !== 'string' || name === '') fail(`addFolder: name must be a non-empty string, got ${fmt(name)}`);
          const f = new FolderImpl(self, name);
          return strictProxy(f, () => `folder "${f._name}"`, FOLDER_SETTABLE);
        },
        get length() { return self._items.length; },
      }, () => 'project.items', new Set());
      this._rqColl = strictProxy({
        add(comp) {
          requireUndo('renderQueue.items.add()');
          const c = unwrap(comp);
          if (!(c instanceof CompImpl) || c._project !== self) fail(`renderQueue.items.add(comp): expected a CompItem of this project, got ${fmt(comp)}`);
          const r = new RQItemImpl(c);
          self._rq.push(r);
          return r._proxy;
        },
        get length() { return self._rq.length; },
      }, () => 'renderQueue.items', new Set());
      strictProxy(this, () => 'project', new Set(['bitsPerChannel', 'linearBlending', 'workingSpace', 'expressionEngine']));
    }
    get items() { return this._itemColl; }
    get numItems() { return this._items.length; }
    item(i) { if (!this._items[i - 1]) fail(`project.item(${fmt(i)}) out of range`); return this._items[i - 1]._proxy; }
    get rootFolder() { return this._root._proxy; }
    get renderQueue() { const self = this; return { items: self._rqColl, get numItems() { return self._rq.length; }, item: (i) => self._rq[i - 1]._proxy }; }
    get file() { return this._file ? new File(this._file) : null; }
    importFile(io) {
      requireUndo('importFile()');
      const o = unwrap(io);
      if (!(o instanceof ImportOptions)) fail(`importFile(options): expected ImportOptions, got ${fmt(io)}`);
      if (!o._file) fail('importFile: ImportOptions has no file');
      if (!fs.existsSync(o._file._path) || !fs.statSync(o._file._path).isFile()) fail(`importFile: file not found: ${o._file._path} (check File.exists before importing)`);
      if (o._importAs !== IAT.FOOTAGE) fail(`importFile: importAs ${o._importAs} is not FOOTAGE for ${path.basename(o._file._path)}`);
      let info;
      try { info = probeMedia(o._file._path); } catch (e) { fail(`importFile: ${e.message}`); }
      const f = new FootageImpl(this, o._file._path, info);
      return strictProxy(f, () => `footage "${f._name}"`, FOOTAGE_SETTABLE);
    }
    save(file) {
      if (!(file instanceof File)) fail(`project.save(file): expected a File, got ${fmt(file)}`);
      if (path.extname(file._path).toLowerCase() !== '.aep') fail(`project.save: file must end in .aep, got ${file._path}`);
      if (!fs.existsSync(path.dirname(file._path))) fail(`project.save: folder does not exist: ${path.dirname(file._path)}`);
      if (state.undo.depth > 0) state.advisories.push('project saved while an undo group was open');
      this._file = file._path;
      state.saved.push(file._path);
      return true;
    }
  }

  function ImportOptions(file) {
    if (!(this instanceof ImportOptions)) fail('ImportOptions must be called with new');
    this._file = null;
    this._importAs = IAT.FOOTAGE;
    if (file !== undefined) this.file = file;
  }
  Object.defineProperty(ImportOptions.prototype, 'file', {
    get() { return this._file; },
    set(v) { if (!(v instanceof File)) fail(`ImportOptions.file must be a File, got ${fmt(v)}`); this._file = v; },
  });
  Object.defineProperty(ImportOptions.prototype, 'importAs', {
    get() { return this._importAs; },
    set(v) { if (!Object.values(IAT).includes(v)) fail(`ImportOptions.importAs must be an ImportAsType, got ${fmt(v)}`); this._importAs = v; },
  });
  ImportOptions.prototype.canImportAs = function (t) {
    if (!Object.values(IAT).includes(t)) fail(`canImportAs: expected an ImportAsType, got ${fmt(t)}`);
    return t === IAT.FOOTAGE;
  };

  // ------------------------------------------------------------------ File / Folder
  const resolve = (p) => {
    if (p instanceof File || p instanceof Folder) return p._path;
    if (typeof p !== 'string') fail(`File/Folder path must be a string, got ${fmt(p)}`);
    let s = p;
    if (s.startsWith('~')) s = os.homedir() + s.slice(1);
    return path.resolve(s.replace(/\\/g, '/'));
  };
  function Folder(p) {
    if (!(this instanceof Folder)) return new Folder(p);
    this._path = resolve(p);
  }
  Object.defineProperties(Folder.prototype, {
    fsName: { get() { return this._path; } },
    fullName: { get() { return this._path; } },
    absoluteURI: { get() { return encodeURI(this._path); } },
    name: { get() { return encodeURIComponent(path.basename(this._path)); } },
    displayName: { get() { return path.basename(this._path); } },
    exists: { get() { return fs.existsSync(this._path) && fs.statSync(this._path).isDirectory(); } },
    parent: { get() { return new Folder(path.dirname(this._path)); } },
  });
  Folder.prototype.toString = function () { return this._path; };
  Folder.prototype.create = function () { fail(`Folder.create(${this._path}): the build must not create folders`); };
  Folder.prototype.getFiles = function () { return vmArr(fs.readdirSync(this._path).map((f) => new File(path.join(this._path, f)))); };

  function File(p) {
    if (!(this instanceof File)) return new File(p);
    this._path = resolve(p);
    this._mode = null;
    this._buf = null;
    this.encoding = 'BINARY';
    this.lineFeed = os.platform() === 'win32' ? 'Windows' : 'Unix';
  }
  Object.defineProperties(File.prototype, {
    fsName: { get() { return this._path; } },
    fullName: { get() { return this._path; } },
    absoluteURI: { get() { return encodeURI(this._path); } },
    name: { get() { return encodeURIComponent(path.basename(this._path)); } },
    displayName: { get() { return path.basename(this._path); } },
    exists: { get() { return fs.existsSync(this._path) && fs.statSync(this._path).isFile(); } },
    parent: { get() { return new Folder(path.dirname(this._path)); } },
    length: { get() { return this.exists ? fs.statSync(this._path).size : 0; } },
  });
  File.prototype.toString = function () { return this._path; };
  File.prototype.open = function (mode) {
    if (!['r', 'w', 'a', 'e'].includes(mode)) fail(`File.open: mode must be r, w, a or e, got ${fmt(mode)}`);
    if (mode !== 'r') {
      const rel = path.relative(state.root, this._path);
      if (rel.startsWith('..') || path.isAbsolute(rel)) fail(`File.open("${mode}") outside the package root: ${this._path}`);
    }
    this._mode = mode;
    this._buf = mode === 'w' ? '' : mode === 'a' && state.writes.has(this._path) ? state.writes.get(this._path) : '';
    return mode === 'r' ? this.exists : true;
  };
  File.prototype.write = function (...a) {
    if (!this._mode || this._mode === 'r') fail(`File.write on ${this._path}, which is not open for writing`);
    this._buf += a.map(String).join('');
    return true;
  };
  File.prototype.writeln = function (...a) { return this.write(...a, '\n'); };
  File.prototype.read = function () {
    if (this._mode !== 'r') fail(`File.read on ${this._path}, which is not open for reading`);
    return fs.readFileSync(this._path, 'utf8');
  };
  File.prototype.close = function () {
    if (this._mode && this._mode !== 'r') {
      state.writes.set(this._path, this._buf);
      if (state.opts.writeFiles) fs.writeFileSync(this._path, this._buf);
    }
    this._mode = null;
    return true;
  };
  File.prototype.remove = function () { fail(`File.remove(${this._path}): the build must not delete files`); };
  File.openDialog = function (prompt) { state.dialogs.push(String(prompt)); return null; };
  File.saveDialog = function (prompt) { state.dialogs.push(String(prompt)); return null; };
  File.fs = os.platform() === 'win32' ? 'Windows' : os.platform() === 'darwin' ? 'Macintosh' : 'Unix';
  File.encode = encodeURI;
  File.decode = decodeURI;

  // ------------------------------------------------------------------ app, $, globals
  const app = strictProxy({
    get project() { return state.project ? state.project._proxy : null; },
    newProject() {
      state.newProjectCalls++;
      if (state.undo.depth > 0) fail('app.newProject() called inside an open undo group');
      if (state.opts.cancelNewProject) return null;
      state.project = new ProjectImpl();
      return state.project._proxy;
    },
    beginUndoGroup(name) {
      if (typeof name !== 'string') fail(`beginUndoGroup(name): name must be a string, got ${fmt(name)}`);
      state.undo.depth++;
      state.undo.begun++;
    },
    endUndoGroup() {
      if (state.undo.depth <= 0) fail('endUndoGroup() without a matching beginUndoGroup()');
      state.undo.depth--;
      state.undo.ended++;
    },
    get version() { return '24.6.0x55 (mock)'; },
    get buildName() { return 'mock'; },
    get isWatchFolder() { return false; },
    fonts: {
      getFontsByPostScriptName(ps) {
        if (typeof ps !== 'string') fail(`app.fonts.getFontsByPostScriptName: expected a string, got ${fmt(ps)}`);
        return vmArr(state.installedFonts.has(ps) ? [{ postScriptName: ps, familyName: ps.split('-')[0], styleName: ps.split('-')[1] || 'Regular' }] : []);
      },
    },
    // Current AE keeps "Allow Scripts to Write Files and Access Network" in "Main Pref Section v2".
    preferences: {
      havePref(section, key) { return section === 'Main Pref Section v2' && key === 'Pref_SCRIPTING_FILE_NETWORK_SECURITY'; },
      getPrefAsLong(section, key) {
        if (section === 'Main Pref Section v2' && key === 'Pref_SCRIPTING_FILE_NETWORK_SECURITY') return 1;
        softThrow(`preference ${section} / ${key} not found`);
        return 0;
      },
    },
    beginSuppressDialogs() {},
    endSuppressDialogs() {},
  }, () => 'app', new Set());
  state.initialProject = new ProjectImpl();
  state.project = state.initialProject;

  const dollar = {
    get fileName() { return state.scriptFile; },
    writeln(...a) { state.stdout.push(a.map(String).join('')); },
    write(...a) { state.stdout.push(a.map(String).join('')); },
    version: '4.5.5', engineName: 'main', os: os.platform(), level: 0,
    sleep() {},
    gc() {},
  };

  const globals = {
    app, $: dollar, File, Folder, ImportOptions, KeyframeEase, MarkerValue, Shape, TextDocument,
    alert: (m) => { state.alerts.push(String(m)); },
    confirm: () => { fail('confirm() would block the build; not allowed'); },
    prompt: () => { fail('prompt() would block the build; not allowed'); },
    ImportAsType: IAT,
    KeyframeInterpolationType: KIT,
    ParagraphJustification: PJ,
    MaskMode: MASK_MODE,
    PropertyValueType: Object.freeze({ ...PVT }),
    PropertyType: Object.freeze({ ...PT }),
  };
  return { globals, classes: { CompImpl, FootageImpl, FolderImpl, LayerImpl, TextDocImpl, ShapeImpl, Node } };
}

export { fontPostScriptNames };
