#!/usr/bin/env node
// Run an assembled After Effects build script against the strict mock AE DOM.
//
//   node tools/mock_ae/run.js ae/CASHTAGS_VSL_Build.jsx
//   node tools/mock_ae/run.js <build.jsx> --as ae/SOME_Build.jsx   (pretend the script lives there:
//                                                                  assets and fonts resolve from ae/)
// Options:
//   --as <path>            value of $.fileName (package root = its folder). Default: the script path.
//   --write-files          really write build_log.txt (default: captured in memory, nothing on disk).
//   --cancel-new-project   app.newProject() returns null (user cancelled the save prompt).
//   --json                 print the summary as JSON instead of text.
//
// Exit code 0 only when the script ran with no mock error, no interpreter warning, no ES3
// problem, no uncaught exception and no difference between the spec and the built project.
import path from 'node:path';
import { runMock, formatReport } from './mock.js';

function main(argv) {
  const args = argv.slice(2);
  const opts = { scriptPath: null, asPath: null, writeFiles: false, cancelNewProject: false, json: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--as') opts.asPath = args[++i];
    else if (a === '--write-files') opts.writeFiles = true;
    else if (a === '--cancel-new-project') opts.cancelNewProject = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') { process.stdout.write(usage()); return 0; }
    else if (!opts.scriptPath && !a.startsWith('--')) opts.scriptPath = a;
    else { process.stderr.write(`unknown argument ${a}\n${usage()}`); return 2; }
  }
  if (!opts.scriptPath) { process.stderr.write(usage()); return 2; }
  const r = runMock(opts);
  if (opts.json) {
    process.stdout.write(JSON.stringify({
      ok: r.ok, cancelled: r.cancelled, stats: r.stats, warnings: r.warnings,
      errors: r.state.errors, problems: r.problems, conformance: r.conformance, alerts: r.state.alerts,
    }, null, 2) + '\n');
  } else {
    process.stdout.write(formatReport(r, opts) + '\n');
  }
  return r.ok ? 0 : 1;
}

function usage() {
  return `usage: node ${path.join('tools', 'mock_ae', 'run.js')} <build.jsx> [--as <path>] [--write-files] [--cancel-new-project] [--json]\n`;
}

process.exitCode = main(process.argv);
