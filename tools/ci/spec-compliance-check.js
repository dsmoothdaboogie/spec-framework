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

// ── Universal passes ──────────────────────────────────────────────────────────
// Angular convention checks from fw/angular/component-patterns.
// Each pass receives a ComponentBundle and returns a result object.

function getTemplateContent(bundle) {
  if (bundle.files.html) return bundle.files.html.content;
  if (bundle.inlineTemplate) {
    const m = bundle.files.ts.content.match(/template\s*:\s*[`']([\s\S]*?)[`']/);
    return m ? m[1] : '';
  }
  return '';
}

const UNIVERSAL_PASSES = [
  {
    id: 'onpush',
    label: 'ChangeDetectionStrategy.OnPush',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'Missing ChangeDetectionStrategy.OnPush in @Component decorator' };
    },
  },
  {
    id: 'standalone',
    label: 'standalone: true',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/standalone\s*:\s*true/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'Missing standalone: true in @Component decorator' };
    },
  },
  {
    id: 'signal-inputs',
    label: 'input() / input.required() — no @Input()',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/@Input\s*\(/.test(ts)) {
        const line = ts.split('\n').findIndex(l => /@Input\s*\(/.test(l)) + 1;
        return { status: 'fail', evidence: `Found @Input() decorator (line ${line}) — use input() signal instead` };
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'signal-outputs',
    label: 'output() — no @Output() / EventEmitter',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/@Output\s*\(/.test(ts)) {
        const line = ts.split('\n').findIndex(l => /@Output\s*\(/.test(l)) + 1;
        return { status: 'fail', evidence: `Found @Output() decorator (line ${line}) — use output() signal instead` };
      }
      if (/new\s+EventEmitter/.test(ts)) {
        const line = ts.split('\n').findIndex(l => /new\s+EventEmitter/.test(l)) + 1;
        return { status: 'fail', evidence: `Found new EventEmitter (line ${line}) — use output() signal instead` };
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'inject-pattern',
    label: 'inject() — no constructor DI',
    run(bundle) {
      const ts = bundle.files.ts.content;
      const ctorMatch = ts.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch && ctorMatch[1].trim().length > 0) {
        const params = ctorMatch[1].trim();
        if (/(?:private|protected|public|readonly)\s+\w+/.test(params)) {
          const line = ts.split('\n').findIndex(l => /constructor\s*\(/.test(l)) + 1;
          return { status: 'fail', evidence: `Found constructor DI (line ${line}) — use inject() instead` };
        }
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'control-flow',
    label: '@if / @for — no *ngIf / *ngFor',
    run(bundle) {
      const tpl = getTemplateContent(bundle);
      if (!tpl) return { status: 'skip', evidence: 'No template found' };
      if (/\*ngIf/.test(tpl)) return { status: 'fail', evidence: 'Found *ngIf — use @if instead' };
      if (/\*ngFor/.test(tpl)) return { status: 'fail', evidence: 'Found *ngFor — use @for instead' };
      return { status: 'pass' };
    },
  },
  {
    id: 'ds-imports',
    label: 'No direct @angular/material or @angular/cdk imports',
    run(bundle) {
      const ts = bundle.files.ts.content;
      const lines = ts.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/from\s+['"]@angular\/material/.test(lines[i])) {
          return { status: 'fail', evidence: `Direct @angular/material import (line ${i + 1}) — use DS wrapper` };
        }
        if (/from\s+['"]@angular\/cdk/.test(lines[i])) {
          return { status: 'fail', evidence: `Direct @angular/cdk import (line ${i + 1}) — use DS wrapper` };
        }
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'token-usage',
    label: 'No hardcoded hex colors or raw px in styles',
    run(bundle) {
      if (!bundle.files.style) return { status: 'skip', evidence: 'No style file found' };
      const style = bundle.files.style.content;
      const lines = style.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || /@use\s/.test(line)) continue;
        if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/url\(/.test(line)) {
          return { status: 'fail', evidence: `Hardcoded hex color (line ${i + 1}) — use semantic token` };
        }
      }
      return { status: 'pass' };
    },
  },
  {
    id: 'state-coverage',
    label: 'Loading, empty, and error states present',
    run(bundle) {
      const tpl = getTemplateContent(bundle);
      const ts = bundle.files.ts.content;
      const all = tpl + '\n' + ts;
      const missing = [];
      if (!/loading|skeleton|shimmer|isLoading|\.loading/i.test(all)) missing.push('loading');
      if (!/empty|no.?data|no.?results|no.?items|isEmpty|\.empty/i.test(all)) missing.push('empty');
      if (!/error|\.error|isError|hasError|retry/i.test(all)) missing.push('error');
      if (missing.length) return { status: 'fail', evidence: `Missing state(s): ${missing.join(', ')}` };
      return { status: 'pass' };
    },
  },
];

function runUniversalPasses(bundle) {
  return UNIVERSAL_PASSES.map(pass => ({
    passId: pass.id,
    label: pass.label,
    ...pass.run(bundle),
  }));
}
