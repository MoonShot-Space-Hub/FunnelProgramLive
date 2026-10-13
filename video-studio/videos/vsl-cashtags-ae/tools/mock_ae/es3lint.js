// Static ES3 / ExtendScript check for the assembled build script.
// 1. A small tokenizer flags ES5+ syntax and library calls ExtendScript lacks.
// 2. If acorn is installed (project node_modules, /opt/node-tools, NODE_PATH), the script
//    is also parsed with ecmaVersion 3 and allowReserved "never" (reserved words such as
//    `in` are illegal as property names in ES3: L.in must be L["in"]).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ES3_RESERVED = new Set(('break case catch continue default delete do else finally for function if in instanceof new ' +
  'return switch this throw try typeof var void while with abstract boolean byte char class const debugger double ' +
  'enum export extends final float goto implements import int interface long native package private protected public ' +
  'short static super synchronized throws transient volatile null true false').split(' '));
const ES6_KEYWORDS = new Set(['let', 'const', 'class', 'yield', 'async', 'await', 'import', 'export', 'super', 'enum']);
const ES5_INSTANCE_METHODS = new Set(['forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some', 'every', 'indexOf',
  'lastIndexOf', 'trim', 'trimLeft', 'trimRight', 'trimStart', 'trimEnd', 'bind', 'includes', 'find', 'findIndex',
  'findLast', 'startsWith', 'endsWith', 'padStart', 'padEnd', 'repeat', 'fill', 'flat', 'flatMap', 'toISOString',
  'toJSON', 'codePointAt', 'normalize', 'matchAll', 'replaceAll', 'at']);
const ES5_STATICS = {
  Object: ['keys', 'create', 'defineProperty', 'defineProperties', 'getPrototypeOf', 'setPrototypeOf', 'freeze', 'seal',
    'assign', 'entries', 'values', 'getOwnPropertyNames', 'getOwnPropertyDescriptor', 'is', 'isFrozen', 'fromEntries'],
  Array: ['isArray', 'from', 'of'],
  Date: ['now'],
  Number: ['isFinite', 'isNaN', 'isInteger', 'isSafeInteger', 'parseFloat', 'parseInt', 'EPSILON'],
  Math: ['trunc', 'sign', 'log10', 'log2', 'hypot', 'cbrt', 'fround', 'clz32', 'imul', 'expm1', 'log1p', 'sinh', 'cosh',
    'tanh', 'asinh', 'acosh', 'atanh'],
  String: ['fromCodePoint', 'raw'],
};
const ES6_GLOBALS = new Set(['JSON', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect',
  'globalThis', 'Intl', 'BigInt', 'ArrayBuffer', 'Uint8Array', 'Float32Array']);
const PUNCTS = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '??=', '||=', '&&=', '=>', '==', '!=', '<=', '>=',
  '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**', '?.', '??',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.'];
const ES6_PUNCTS = new Set(['=>', '...', '**', '**=', '?.', '??', '??=', '||=', '&&=']);
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'instanceof', 'new', 'delete', 'void', 'throw']);

function tokenize(src, problems) {
  const toks = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const last = () => toks[toks.length - 1];
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) { problems.push({ line, msg: 'unterminated comment' }); break; }
      for (let k = i; k < e; k++) if (src[k] === '\n') line++;
      i = e + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < n && src[k] !== c) {
        if (src[k] === '\\') k++;
        else if (src[k] === '\n') { problems.push({ line, msg: 'newline inside a string literal' }); break; }
        k++;
      }
      toks.push({ type: 'string', value: src.slice(i, k + 1), line });
      i = k + 1;
      continue;
    }
    if (c === '`') {
      problems.push({ line, msg: 'template literal (ES6)' });
      const e = src.indexOf('`', i + 1);
      i = e < 0 ? n : e + 1;
      toks.push({ type: 'string', value: '``', line });
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let k = i + 1;
      while (k < n && /[A-Za-z0-9_$]/.test(src[k])) k++;
      toks.push({ type: 'ident', value: src.slice(i, k), line });
      i = k;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(src.slice(i, i + 64));
      toks.push({ type: 'number', value: m[0], line });
      i += m[0].length;
      continue;
    }
    if (c === '/') {
      const p = last();
      const regexOk = !p || (p.type === 'punct' && ![')', ']', '}'].includes(p.value)) ||
        (p.type === 'ident' && REGEX_AFTER_WORD.has(p.value));
      if (regexOk) {
        let k = i + 1;
        let inClass = false;
        while (k < n) {
          const ch = src[k];
          if (ch === '\\') { k += 2; continue; }
          if (ch === '\n') { problems.push({ line, msg: 'unterminated regex' }); break; }
          if (ch === '[') inClass = true;
          else if (ch === ']') inClass = false;
          else if (ch === '/' && !inClass) break;
          k++;
        }
        k++;
        while (k < n && /[a-z]/i.test(src[k])) {
          if (!'gim'.includes(src[k])) problems.push({ line, msg: `regex flag "${src[k]}" is not ES3` });
          k++;
        }
        toks.push({ type: 'regex', value: src.slice(i, k), line });
        i = k;
        continue;
      }
    }
    const p = PUNCTS.find((q) => src.startsWith(q, i));
    if (!p) { problems.push({ line, msg: `unexpected character ${JSON.stringify(c)}` }); i++; continue; }
    toks.push({ type: 'punct', value: p, line });
    i += p.length;
  }
  return toks;
}

function tokenChecks(toks, problems) {
  for (let t = 0; t < toks.length; t++) {
    const k = toks[t];
    const prev = toks[t - 1];
    const next = toks[t + 1];
    const afterDot = prev && prev.type === 'punct' && prev.value === '.';
    if (k.type === 'punct') {
      if (ES6_PUNCTS.has(k.value)) problems.push({ line: k.line, msg: `"${k.value}" is not ES3` });
      if (k.value === ',' && next && next.type === 'punct' && (next.value === ']' || next.value === '}')) {
        problems.push({ line: k.line, msg: 'trailing comma' });
      }
      continue;
    }
    if (k.type !== 'ident') continue;
    if (afterDot) {
      if (ES3_RESERVED.has(k.value)) problems.push({ line: k.line, msg: `reserved word "${k.value}" used as a property name (use ["${k.value}"])` });
      // Only calls: spec fields such as L.fill or L.trim are plain data.
      if (ES5_INSTANCE_METHODS.has(k.value) && next && next.value === '(') {
        problems.push({ line: k.line, msg: `.${k.value}() is ES5+ (not in ExtendScript)` });
      }
      continue;
    }
    if (ES6_KEYWORDS.has(k.value)) problems.push({ line: k.line, msg: `"${k.value}" is not ES3` });
    if (ES6_GLOBALS.has(k.value)) problems.push({ line: k.line, msg: `${k.value} does not exist in ExtendScript` });
    if (ES5_STATICS[k.value] && next && next.value === '.' && toks[t + 2] && ES5_STATICS[k.value].includes(toks[t + 2].value)) {
      problems.push({ line: k.line, msg: `${k.value}.${toks[t + 2].value} is ES5+` });
    }
    if ((prev && (prev.value === '{' || prev.value === ',')) && next && next.value === ':' &&
        ES3_RESERVED.has(k.value) && k.value !== 'default' && k.value !== 'case') {
      problems.push({ line: k.line, msg: `reserved word "${k.value}" used as an object key (quote it)` });
    }
    if (k.value === 'of' && prev && prev.type === 'ident' && toks[t - 2] && (toks[t - 2].value === 'var' || toks[t - 2].value === '(')) {
      problems.push({ line: k.line, msg: 'for...of is not ES3' });
    }
    if ((k.value === 'get' || k.value === 'set') && prev && (prev.value === '{' || prev.value === ',') &&
        next && next.type === 'ident' && toks[t + 2] && toks[t + 2].value === '(') {
      problems.push({ line: k.line, msg: 'getter/setter literal is ES5' });
    }
  }
}

function loadAcorn() {
  const req = createRequire(import.meta.url);
  const candidates = ['acorn', '/opt/node-tools/node_modules/acorn'];
  for (const p of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) candidates.push(path.join(p, 'acorn'));
  for (const c of candidates) {
    try { return { acorn: req(c), from: c }; } catch (e) { /* try next */ }
  }
  return null;
}

// Returns {problems: [{line, msg}], acorn: 'ok' | 'skipped (...)' | 'failed'}.
export function lintES3(src) {
  const problems = [];
  for (let i = 0, line = 1; i < src.length; i++) {
    if (src.charCodeAt(i) > 127) { problems.push({ line, msg: `non-ASCII character U+${src.charCodeAt(i).toString(16).toUpperCase()}` }); break; }
    if (src[i] === '\n') line++;
  }
  const toks = tokenize(src, problems);
  tokenChecks(toks, problems);
  let acornStatus;
  const a = loadAcorn();
  if (!a) {
    acornStatus = 'skipped (acorn not installed; token lint still ran)';
  } else {
    try {
      a.acorn.parse(src, { ecmaVersion: 3, allowReserved: 'never', sourceType: 'script', locations: true });
      acornStatus = `ok (acorn ${a.acorn.version}, ecmaVersion 3)`;
    } catch (e) {
      acornStatus = 'failed';
      problems.push({ line: e.loc ? e.loc.line : 0, msg: `acorn ES3 parse: ${e.message}` });
    }
  }
  return { problems, acorn: acornStatus, tokens: toks.length };
}

export function lintFile(file) {
  return lintES3(fs.readFileSync(file, 'utf8'));
}
