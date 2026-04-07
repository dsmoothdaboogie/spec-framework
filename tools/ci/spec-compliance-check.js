#!/usr/bin/env node
/**
 * spec-compliance-check.js
 *
 * Validates generated Angular code against the spec it claims to implement.
 * Two analysis layers:
 *   1. Universal passes — Angular convention checks (always run)
 *   2. Checklist rules — spec-specific checks matched via rule library
 *
 * Usage:
 *   node tools/ci/spec-compliance-check.js                          # full scan
 *   node tools/ci/spec-compliance-check.js --changed-only           # git-changed files only
 *   node tools/ci/spec-compliance-check.js --spec-root ../specs     # custom spec location
 *   node tools/ci/spec-compliance-check.js --format github          # GH Actions annotations
 *   node tools/ci/spec-compliance-check.js --format json            # machine-readable
 *   node tools/ci/spec-compliance-check.js --fail-on warning        # exit 1 on warnings too
 */

const fs          = require('fs');
const path        = require('path');
const { execSync } = require('child_process');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const CHANGED_ONLY = args.includes('--changed-only');
const FORMAT       = args.includes('--format')    ? args[args.indexOf('--format') + 1]    : 'pretty';
const FAIL_ON      = args.includes('--fail-on')   ? args[args.indexOf('--fail-on') + 1]   : 'error';
const SPEC_ROOT    = args.includes('--spec-root') ? path.resolve(args[args.indexOf('--spec-root') + 1]) : process.cwd();

const REGISTRY_PATH = path.join(SPEC_ROOT, 'tools/registry/registry.json');

// ── Terminal colours (suppressed for non-pretty formats) ──────────────────────
const C = FORMAT === 'pretty' ? {
  bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
  cyan: '\x1b[36m', blue: '\x1b[34m',
} : Object.fromEntries(['bold','dim','reset','green','yellow','red','cyan','blue'].map(k => [k, '']));

// ── Ignore patterns ──────────────────────────────────────────────────────────
const IGNORE_PATTERNS = [
  'node_modules', 'dist', '.git', 'coverage', '.angular',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(p => filePath.includes(p));
}

// ── Header parser ─────────────────────────────────────────────────────────────
function parseHeader(content) {
  let specId = null, specVersion = null;
  let personaId = null, personaVersion = null;

  for (const line of content.split('\n')) {
    if (!specId) {
      const m = line.match(/@spec\s+(\S+)\s+v?([\d.]+)/);
      if (m) { specId = m[1]; specVersion = m[2]; }
    }
    if (!personaId) {
      const m = line.match(/@persona\s+(\S+)\s+v?([\d.]+)/);
      if (m) { personaId = m[1]; personaVersion = m[2]; }
    }
    if (specId && personaId) break;
  }

  return specId ? { specId, specVersion, personaId, personaVersion } : null;
}

// ── File discovery ────────────────────────────────────────────────────────────
function walkDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldIgnore(full)) continue;
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
  }
  return files;
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached', {
      cwd: process.cwd(), encoding: 'utf-8',
    });
    return output.trim().split('\n')
      .filter(f => f && f.endsWith('.ts') && !f.endsWith('.spec.ts'))
      .map(f => path.resolve(f))
      .filter(f => fs.existsSync(f) && !shouldIgnore(f));
  } catch {
    return [];
  }
}

// ── Component bundling ────────────────────────────────────────────────────────
function bundleComponent(tsPath) {
  const content = fs.readFileSync(tsPath, 'utf-8');
  const header = parseHeader(content);
  if (!header) return null;

  const dir  = path.dirname(tsPath);
  const base = path.basename(tsPath, '.ts');

  const htmlPath = path.join(dir, base + '.html');
  const scssPath = path.join(dir, base + '.scss');
  const cssPath  = path.join(dir, base + '.css');
  const specPath = path.join(dir, base + '.spec.ts');

  const stylePath = fs.existsSync(scssPath) ? scssPath
                  : fs.existsSync(cssPath)  ? cssPath
                  : null;

  const inlineTemplate = /template\s*:\s*`/.test(content) || /template\s*:\s*'/.test(content);

  const files = {
    ts:    { path: tsPath, content },
    html:  null,
    style: null,
    spec:  null,
  };

  if (!inlineTemplate && fs.existsSync(htmlPath)) {
    files.html = { path: htmlPath, content: fs.readFileSync(htmlPath, 'utf-8') };
  }
  if (stylePath) {
    files.style = { path: stylePath, content: fs.readFileSync(stylePath, 'utf-8') };
  }
  if (fs.existsSync(specPath)) {
    files.spec = { path: specPath, content: fs.readFileSync(specPath, 'utf-8') };
  }

  return { entry: tsPath, files, header, inlineTemplate };
}
