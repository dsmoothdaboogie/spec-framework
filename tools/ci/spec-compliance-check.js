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
