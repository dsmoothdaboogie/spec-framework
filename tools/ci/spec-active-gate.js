#!/usr/bin/env node
/**
 * spec-active-gate.js
 *
 * CI gate: ensures no spec with `status: active` has linter errors.
 * Runs spec-lint.js on every active spec in the registry and blocks
 * the pipeline if any fail.
 *
 * Usage:
 *   node tools/ci/spec-active-gate.js                    # full scan
 *   node tools/ci/spec-active-gate.js --changed-only     # only git-changed specs
 *   node tools/ci/spec-active-gate.js --format github    # GitHub Actions annotations
 *   node tools/ci/spec-active-gate.js --format json      # machine-readable output
 */

const fs          = require('fs');
const path        = require('path');
const { execSync } = require('child_process');

const ROOT          = path.join(__dirname, '../..');
const REGISTRY_PATH = path.join(ROOT, 'tools/registry/registry.json');
const LINTER_PATH   = path.join(ROOT, 'tools/linter/spec-lint.js');

const args         = process.argv.slice(2);
const CHANGED_ONLY = args.includes('--changed-only');
const FORMAT       = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'pretty';

const C = FORMAT === 'pretty' ? {
  bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
} : Object.fromEntries(['bold','dim','reset','green','yellow','red','cyan'].map(k => [k, '']));

// ── Load registry ────────────────────────────────────────────────────────────
function loadActiveSpecs() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`${C.red}✗ Registry not found at ${REGISTRY_PATH}${C.reset}`);
    process.exit(1);
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  return registry.specs.filter(s => s.status === 'active');
}

// ── Get changed spec files ───────────────────────────────────────────────────
function getChangedSpecPaths() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached', {
      cwd: ROOT, encoding: 'utf-8'
    });
    return output.trim().split('\n')
      .filter(f => f && (f.endsWith('.spec.md') || f.endsWith('.persona.md') || f.endsWith('.entitlement.md')));
  } catch {
    return [];
  }
}

// ── Run linter on a spec ─────────────────────────────────────────────────────
function lintSpec(specPath) {
  const fullPath = path.join(ROOT, specPath);
  if (!fs.existsSync(fullPath)) {
    return { passed: false, output: `File not found: ${specPath}` };
  }

  try {
    const output = execSync(`node "${LINTER_PATH}" "${fullPath}" 2>&1`, {
      cwd: ROOT, encoding: 'utf-8', timeout: 10000,
    });
    return { passed: true, output };
  } catch (e) {
    return { passed: false, output: e.stdout || e.message };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const activeSpecs = loadActiveSpecs();
const changedPaths = CHANGED_ONLY ? getChangedSpecPaths() : null;

const specsToCheck = CHANGED_ONLY
  ? activeSpecs.filter(s => changedPaths.includes(s.path))
  : activeSpecs;

const results = [];
for (const spec of specsToCheck) {
  const lint = lintSpec(spec.path);
  results.push({ spec, ...lint });
}

const failures = results.filter(r => !r.passed);
const passes   = results.filter(r => r.passed);

// ── Report ───────────────────────────────────────────────────────────────────
if (FORMAT === 'github') {
  for (const f of failures) {
    // Extract error lines from linter output
    const errorLines = f.output.split('\n')
      .filter(l => l.includes('✗') && !l.includes('Errors ('))
      .map(l => l.replace(/\x1b\[[0-9;]*m/g, '').trim());

    for (const errLine of errorLines) {
      console.log(`::error file=${f.spec.path},title=Active Spec Lint Failure::${errLine}`);
    }
  }

  if (failures.length) {
    console.log(`::error title=Spec Active Gate::${failures.length} active spec(s) failed linting. Fix errors before merging.`);
  } else {
    console.log(`::notice title=Spec Active Gate::All ${passes.length} active spec(s) passed linting.`);
  }
} else if (FORMAT === 'json') {
  console.log(JSON.stringify({
    summary: { total: results.length, passed: passes.length, failed: failures.length },
    failures: failures.map(f => ({ specId: f.spec.specId, path: f.spec.path, output: f.output })),
  }, null, 2));
} else {
  console.log(`\n${C.bold}spec-active-gate${C.reset} — ${C.dim}Linting all active specs${C.reset}\n`);

  for (const r of results) {
    if (r.passed) {
      console.log(`  ${C.green}✓${C.reset} ${r.spec.specId}`);
    } else {
      console.log(`  ${C.red}✗${C.reset} ${C.bold}${r.spec.specId}${C.reset}`);
      // Show error lines indented
      const errorLines = r.output.split('\n')
        .filter(l => l.includes('✗') && !l.includes('Errors ('))
        .map(l => l.replace(/\x1b\[[0-9;]*m/g, '').trim());
      errorLines.forEach(l => console.log(`    ${C.red}${l}${C.reset}`));
    }
  }

  console.log('');
  if (failures.length) {
    console.log(`${C.red}${C.bold}✗ ${failures.length} of ${results.length} active spec(s) failed linting${C.reset}`);
    console.log(`${C.dim}  Fix all errors before setting status: active${C.reset}\n`);
  } else {
    console.log(`${C.green}${C.bold}✓ All ${passes.length} active spec(s) passed linting${C.reset}\n`);
  }
}

process.exit(failures.length > 0 ? 1 : 0);
