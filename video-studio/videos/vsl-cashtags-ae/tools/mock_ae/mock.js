// Runs an assembled build script against the mock AE DOM and reports what it built.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createState, createAE, fontPostScriptNames } from './dom.js';
import { lintES3 } from './es3lint.js';
import { checkConformance, walk } from './conformance.js';

// ExtendScript is ES3: remove ES5+ built-ins inside the script's realm so any use fails at run time
// too (the static lint catches most of it first).
const STRIP_ES5 = `(function (g) {
  function strip(o, names) { for (var i = 0; i < names.length; i++) { try { delete o[names[i]]; } catch (e) {} } }
  strip(Array.prototype, ['indexOf','lastIndexOf','forEach','map','filter','reduce','reduceRight','some','every','find',
    'findIndex','findLast','findLastIndex','includes','fill','flat','flatMap','keys','values','entries','at','copyWithin',
    'toSorted','toReversed','toSpliced','with']);
  strip(Array, ['isArray','from','of']);
  strip(Object, ['keys','create','defineProperty','defineProperties','getPrototypeOf','setPrototypeOf','freeze','seal',
    'assign','entries','values','getOwnPropertyNames','getOwnPropertyDescriptor','getOwnPropertyDescriptors','is',
    'fromEntries','isFrozen','isSealed','preventExtensions','isExtensible','getOwnPropertySymbols','groupBy','hasOwn']);
  strip(String.prototype, ['trim','trimStart','trimEnd','trimLeft','trimRight','startsWith','endsWith','includes',
    'padStart','padEnd','repeat','codePointAt','normalize','matchAll','replaceAll','at']);
  strip(String, ['fromCodePoint','raw']);
  strip(Function.prototype, ['bind']);
  strip(Date, ['now']);
  strip(Date.prototype, ['toISOString','toJSON']);
  strip(Number, ['isFinite','isNaN','isInteger','isSafeInteger','parseFloat','parseInt','EPSILON','MAX_SAFE_INTEGER','MIN_SAFE_INTEGER']);
  strip(Math, ['trunc','sign','log10','log2','hypot','cbrt','fround','clz32','imul','expm1','log1p','sinh','cosh','tanh','asinh','acosh','atanh']);
  strip(g, ['JSON','Promise','Map','Set','WeakMap','WeakSet','WeakRef','Symbol','Proxy','Reflect','Intl','BigInt',
    'structuredClone','queueMicrotask','setTimeout','setInterval','console']);
})(this);`;

export function runMock({ scriptPath, source, asPath, writeFiles = false, cancelNewProject = false }) {
  const state = createState({ writeFiles, cancelNewProject });
  const scriptAbs = path.resolve(asPath || scriptPath);
  state.scriptFile = scriptAbs;
  state.root = path.dirname(scriptAbs);
  state.installedFonts = fontPostScriptNames(path.join(state.root, 'Fonts'));
  const src = source !== undefined ? source : fs.readFileSync(scriptPath, 'utf8');

  const lint = lintES3(src);
  const { globals, classes } = createAE(state);
  const ctx = vm.createContext({});
  vm.runInContext(STRIP_ES5, ctx);
  state.VMArray = vm.runInContext('Array', ctx);
  for (const [k, v] of Object.entries(globals)) ctx[k] = v;

  let uncaught = null;
  const t0 = process.hrtime.bigint();
  try {
    vm.runInContext(src, ctx, { filename: scriptAbs, timeout: 300000 });
  } catch (e) {
    uncaught = e;
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;

  let spec = null;
  try { spec = ctx.SPEC === undefined ? null : JSON.parse(JSON.stringify(ctx.SPEC)); } catch (e) { spec = null; }

  // interpreter warnings: build_log.txt lines and $.writeln lines starting with "WARNING: "
  const logPath = path.join(state.root, 'build_log.txt');
  const logText = state.writes.get(logPath);
  const warnings = [];
  const seen = new Set();
  const take = (line) => { if (line.startsWith('WARNING: ') && !seen.has(line)) { seen.add(line); warnings.push(line.slice(9)); } };
  if (logText) logText.split('\n').forEach(take);
  state.stdout.forEach(take);

  const problems = [];   // anything that fails the run besides interpreter warnings and mock errors
  if (uncaught) problems.push(`uncaught exception: ${uncaught && uncaught.stack ? uncaught.stack.split('\n').slice(0, 4).join(' | ') : uncaught}`);
  for (const p of lint.problems) problems.push(`ES3 lint line ${p.line}: ${p.msg}`);
  if (state.undo.depth !== 0 || state.undo.begun !== state.undo.ended) problems.push(`undo groups unbalanced (begun ${state.undo.begun}, ended ${state.undo.ended})`);
  if (state.undo.begun === 0 && !cancelNewProject) problems.push('no undo group was opened');
  for (const td of state.textDocs) {
    if (td._dirty) problems.push(`a TextDocument (${td._origin}, text ${JSON.stringify(td._f.text.slice(0, 40))}) was modified but never applied with setValue()`);
  }
  if (state.dialogs.length) problems.push(`File dialogs opened: ${state.dialogs.join(' | ')}`);
  if (state.alerts.length !== 1) problems.push(`expected exactly one alert (the summary), got ${state.alerts.length}`);

  let conformance = { issues: [], advisories: [] };
  const cancelled = cancelNewProject && state.project === state.initialProject;
  if (cancelNewProject) {
    if (!cancelled) problems.push('build continued after app.newProject() returned null');
    if (state.saved.length) problems.push('project saved although the build was cancelled');
    if (state.initialProject._items.length) problems.push('items were created although the build was cancelled');
  } else if (spec) {
    conformance = checkConformance(spec, state, classes, state.root);
  } else {
    problems.push('SPEC is not defined by the script');
  }

  const stats = summarize(state, spec, classes);
  const ok = problems.length === 0 && state.errors.length === 0 && warnings.length === 0 && conformance.issues.length === 0;
  return { ok, cancelled, ms, state, lint, warnings, problems, conformance, stats, spec, logText };
}

function summarize(state, spec, classes) {
  const P = state.project;
  const s = { comps: [], layerKinds: {}, specTypes: {}, keys: 0, keysByProp: {}, effects: {}, masks: 0, maskKeys: 0,
    animators: 0, markers: 0, folders: 0, footage: 0, rq: [] };
  if (!P) return s;
  for (const it of P._items) {
    if (it instanceof classes.FolderImpl) s.folders++;
    if (it instanceof classes.FootageImpl) s.footage++;
  }
  for (const c of P._items.filter((i) => i instanceof classes.CompImpl)) {
    s.comps.push({ name: c._name, w: c._w, h: c._h, fps: c._fps, dur: c._dur, layers: c._layers.length });
    s.markers += c._marker.keys.length;
    for (const L of c._layers) {
      let k = L._kind === 'shape' ? 'ShapeLayer' : L._kind === 'text' ? 'TextLayer' : 'AVLayer';
      if (L._kind === 'av') {
        const src = L._source;
        k += src instanceof classes.CompImpl ? ' (comp)' : !src._info.hasVideo ? ' (audio)' : src._info.isStill ? ' (image)' : ' (footage)';
      }
      s.layerKinds[k] = (s.layerKinds[k] || 0) + 1;
      for (const n of walk(L._root)) {
        if (n.keys.length) {
          s.keys += n.keys.length;
          s.keysByProp[n.mn] = (s.keysByProp[n.mn] || 0) + n.keys.length;
        }
        if (n.def.effect) s.effects[n.mn] = (s.effects[n.mn] || 0) + 1;
        if (n.mn === 'ADBE Mask Atom') s.masks++;
        if (n.mn === 'ADBE Mask Shape' && n.keys.length) s.maskKeys++;
        if (n.mn === 'ADBE Text Animator') s.animators++;
      }
    }
  }
  if (spec) for (const C of spec.comps || []) for (const L of C.layers || []) s.specTypes[L.type] = (s.specTypes[L.type] || 0) + 1;
  for (const r of P._rq) s.rq.push({ comp: r._comp._name, template: r._oms[0]._template, file: r._oms[0]._file });
  return s;
}

export function formatReport(r, { scriptPath, asPath, cwd = process.cwd() }) {
  const rel = (p) => (p ? path.relative(cwd, p) || '.' : p);
  const out = [];
  const s = r.stats;
  out.push(`mock_ae: ${rel(path.resolve(scriptPath))}${asPath ? ` (as ${rel(path.resolve(asPath))})` : ''}  [${r.ms.toFixed(0)} ms]`);
  out.push(`ES3 check: ${r.lint.problems.length ? `${r.lint.problems.length} problem(s)` : 'ok'}; acorn: ${r.lint.acorn}`);
  out.push(`Package root: ${rel(r.state.root)}  fonts found: ${[...r.state.installedFonts].join(', ') || 'none'}`);
  if (r.cancelled) {
    out.push('Build cancelled at app.newProject() (as requested by --cancel-new-project).');
  } else {
    out.push(`Project: ${s.folders} folders, ${s.footage} imported items, ${s.comps.length} comps`);
    for (const c of s.comps) out.push(`  comp "${c.name}" ${c.w}x${c.h} ${c.fps} fps ${c.dur} s: ${c.layers} layers`);
    out.push(`Layers by AE type: ${Object.entries(s.layerKinds).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
    out.push(`Layers by spec type: ${Object.entries(s.specTypes).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
    out.push(`Keyframes: ${s.keys} on layers (${Object.entries(s.keysByProp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    out.push(`Effects: ${Object.entries(s.effects).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}; masks: ${s.masks} (${s.maskKeys} keyframed); text animators: ${s.animators}`);
    out.push(`Comp markers: ${s.markers}`);
    for (const q of s.rq) out.push(`Render Queue: "${q.comp}" -> ${rel(q.file)} [${q.template}]`);
    out.push(`Saved: ${r.state.saved.map(rel).join(', ') || 'nothing'}`);
    out.push(`Files written (${r.state.opts.writeFiles ? 'on disk' : 'captured in memory, not on disk'}): ${[...r.state.writes.keys()].map((p) => `${rel(p)} (${r.state.writes.get(p).split('\n').length} lines)`).join(', ') || 'none'}`);
    if (r.state.viewer) out.push(`Opened in viewer: "${r.state.viewer}"`);
  }
  for (const a of r.state.alerts) out.push(`alert(): ${a.split('\n').filter(Boolean).join(' | ')}`);
  const section = (title, items) => {
    out.push(`${title}: ${items.length}`);
    for (const x of items.slice(0, 60)) out.push(`  - ${x}`);
    if (items.length > 60) out.push(`  ... ${items.length - 60} more`);
  };
  section('Interpreter warnings', r.warnings);
  section('Mock AE errors', r.state.errors.map((e) => (e.line ? `[script line ${e.line}] ${e.msg}` : e.msg)));
  section('Other problems', r.problems);
  section('Spec conformance issues', r.conformance.issues);
  if (r.conformance.advisories.length || r.state.advisories.length) section('Advisories (do not fail the run)', [...r.state.advisories, ...r.conformance.advisories]);
  out.push(`RESULT: ${r.ok ? 'PASS' : 'FAIL'}`);
  return out.join('\n');
}
