#!/usr/bin/env node
// Replaces jsDelivr / unpkg npm URLs in a HyperFrames project's HTML files with
// local copies under <project>/vendor/, fetched from the npm registry.
//
// Use it when a session's network policy blocks those CDNs (renders then fail
// with `sub_timeline_script_failure`). Local copies also make renders fully
// offline and pinned. Re-running is safe: already-local URLs are left alone.
//
// Usage: node videos/scripts/vendor-cdn-libs.mjs <project-dir> [--dry-run]

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const projectArg = args.find((a) => !a.startsWith("--"));
if (!projectArg) {
  console.error("Usage: node videos/scripts/vendor-cdn-libs.mjs <project-dir> [--dry-run]");
  process.exit(2);
}
const projectDir = resolve(projectArg);
if (!existsSync(join(projectDir, "index.html"))) {
  console.error(`No index.html in ${projectDir} — pass a HyperFrames project folder.`);
  process.exit(2);
}

// https://cdn.jsdelivr.net/npm/<pkg>[@<spec>]/<path>  or  https://unpkg.com/<pkg>[@<spec>]/<path>
const CDN_URL_RE =
  /https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*)(?:@([\w.^~<>=|-]+))?\/([^"'\s?#)]+)/gi;
const SKIP_DIRS = new Set(["node_modules", "renders", "vendor", ".hyperframes", ".git"]);

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...htmlFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith(".html")) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const workDir = mkdtempSync(join(tmpdir(), "hf-vendor-"));
const unpacked = new Map(); // "<pkg>@<spec>" -> extracted package dir

function unpack(pkg, spec) {
  const key = `${pkg}@${spec}`;
  if (!unpacked.has(key)) {
    const dest = join(workDir, String(unpacked.size));
    mkdirSync(dest);
    const [packed] = JSON.parse(
      execFileSync("npm", ["pack", key, "--json", "--pack-destination", dest], { encoding: "utf8" }),
    );
    execFileSync("tar", ["-xzf", join(dest, packed.filename), "-C", dest]);
    unpacked.set(key, join(dest, "package"));
  }
  return unpacked.get(key);
}

let rewritten = 0;
const problems = [];
try {
  for (const file of htmlFiles(projectDir)) {
    const html = readFileSync(file, "utf8");
    const next = html.replace(CDN_URL_RE, (url, pkg, spec = "latest", path) => {
      const vendorPath = join(projectDir, "vendor", `${pkg}@${spec}`, ...path.split("/"));
      if (!existsSync(vendorPath)) {
        let source;
        try {
          source = join(unpack(pkg, spec), ...path.split("/"));
        } catch (err) {
          problems.push(`${url}: npm pack failed (${err.message.split("\n")[0]})`);
          return url;
        }
        if (!existsSync(source)) {
          problems.push(`${url}: ${path} is not in the published ${pkg}@${spec} package`);
          return url;
        }
        if (!dryRun) {
          mkdirSync(dirname(vendorPath), { recursive: true });
          copyFileSync(source, vendorPath);
        }
      }
      rewritten++;
      const local = relative(dirname(file), vendorPath).split(sep).join("/");
      console.log(`${relative(projectDir, file)}: ${url} -> ${local}`);
      return local;
    });
    if (next !== html && !dryRun) writeFileSync(file, next);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

console.log(`${dryRun ? "Would rewrite" : "Rewrote"} ${rewritten} CDN URL(s) in ${projectDir}.`);
if (problems.length) {
  console.error(`Left ${problems.length} URL(s) unchanged:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
