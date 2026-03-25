#!/usr/bin/env node
/**
 * spec-header-check.js
 *
 * Scans the codebase for @spec provenance headers and validates them
 * against the registry. Reports staleness, deprecation, and missing headers
 * on files that should have them.
 *
 * Usage:
 *   node tools/ci/spec-header-check.js                    # full scan
 *   node tools/ci/spec-header-check.js --changed-only     # only git-changed files
 *   node tools/ci/spec-header-check.js --format github    # GitHub Actions annotations
 *   node tools/ci/spec-header-check.js --format json      # machine-readable output
 *   node tools/ci/spec-header-check.js --fail-on warning  # exit 1 on warnings too
 *
 * Header format expected in source files:
 *   @spec    ds/patterns/ag-grid-datatable v2.0.0
 *   @persona personas/claims-admin v1.0.0   (optional)
 *   @generated 2026-03-20                   (optional)
 *   @compliance PASS                        (optional)
 */

const fs          = require('fs');
const path        = require('path');
const { execSync } = require('child_process');

const ROOT          = path.join(__dirname, '../..');
const REGISTRY_PATH = path.join(ROOT, 'tools/registry/registry.json');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const CHANGED_ONLY = args.includes('--changed-only');
const FORMAT       = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'pretty';
const FAIL_ON      = args.includes('--fail-on')  ? args[args.indexOf('--fail-on') + 1]  : 'error';

// ── Terminal colours (suppressed for non-pretty formats) ──────────────────────
const C = FORMAT === 'pretty' ? {
  bold:   '\x1b[1m', dim:    '\x1b[2m', reset:  '\x1b[0m',
  green:  '\x1b[32m', yellow: '\x1b[33m', red:    '\x1b[31m',
  cyan:   '\x1b[36m', blue:   '\x1b[34m',
} : Object.fromEntries(['bold','dim','reset','green','yellow','red','cyan','blue'].map(k => [k, '']));

// ── Semver helpers ────────────────────────────────────────────────────────────
function parseSemver(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function compareVersions(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

function versionDelta(current, latest) {
  const c = parseSemver(current);
  const l = parseSemver(latest);
  if (!c || !l) return 'unknown';
  if (l.major > c.major) return 'major';
  if (l.minor > c.minor) return 'minor';
  if (l.patch > c.patch) return 'patch';
  return 'current';
}

// ── Registry loader ───────────────────────────────────────────────────────────
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`${C.red}✗ Registry not found at ${REGISTRY_PATH}${C.reset}`);
    console.error(`  Run: npm run sync`);
    process.exit(1);
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  return new Map(registry.specs.map(s => [s.specId, s]));
}

// ── Header parser ─────────────────────────────────────────────────────────────
// Line-based parser — works across block comments, line comments, and all
// file types. Scans line by line for @spec and @persona tags.
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
const SCAN_EXTENSIONS = ['.ts', '.html', '.scss', '.spec.ts'];
const IGNORE_PATTERNS = [
  'node_modules', 'dist', '.git', 'coverage',
  '.angular', 'tools/explorer', 'tools/registry',
  'tools/linter', 'tools/ci', 'tools/hooks',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(p => filePath.includes(p));
}

function walkDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldIgnore(full)) continue;
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) files.push(full);
  }
  return files;
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached', {
      cwd: ROOT, encoding: 'utf-8'
    });
    return output.trim().split('\n')
      .filter(f => f && SCAN_EXTENSIONS.some(ext => f.endsWith(ext)))
      .map(f => path.join(ROOT, f))
      .filter(f => fs.existsSync(f) && !shouldIgnore(f));
  } catch {
    return [];
  }
}

// ── Check severity ────────────────────────────────────────────────────────────
// Returns: 'pass' | 'info' | 'warning' | 'error'
function getSeverity(delta, status) {
  if (status === 'deprecated') return 'error';
  if (delta === 'major')       return 'warning';
  if (delta === 'minor')       return 'info';
  if (delta === 'patch')       return 'info';
  if (delta === 'current')     return 'pass';
  return 'info';
}

// ── Main check ────────────────────────────────────────────────────────────────
function check() {
  const registry  = loadRegistry();
  const files     = CHANGED_ONLY ? getChangedFiles() : walkDir(ROOT);
  const results   = [];

  for (const filePath of files) {
    let content;
    try { content = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }

    const header = parseHeader(content);
    if (!header) continue; // No header — not a tracked file, skip silently

    const relPath = path.relative(ROOT, filePath);
    const result  = { file: relPath, header, checks: [] };

    // ── Check primary spec ────────────────────────────────────────────────────
    const specEntry = registry.get(header.specId);

    if (!specEntry) {
      result.checks.push({
        severity: 'error',
        code:     'SPEC_NOT_FOUND',
        message:  `Spec "${header.specId}" not found in registry`,
        hint:     'Run npm run sync to update the registry, or check the spec-id spelling',
      });
    } else {
      const delta    = versionDelta(header.specVersion, specEntry.version);
      const severity = getSeverity(delta, specEntry.status);

      if (severity !== 'pass') {
        const messages = {
          error:   specEntry.status === 'deprecated'
            ? `Spec "${header.specId}" is deprecated${specEntry.deprecatedBy ? ` — use ${specEntry.deprecatedBy}` : ''}`
            : `Spec "${header.specId}" has a major version gap (header: v${header.specVersion}, current: v${specEntry.version})`,
          warning: `Spec "${header.specId}" is behind by a major version (header: v${header.specVersion}, current: v${specEntry.version})`,
          info:    `Spec "${header.specId}" has a minor/patch update available (v${header.specVersion} → v${specEntry.version})`,
        };

        result.checks.push({
          severity,
          code:     `SPEC_${delta.toUpperCase()}_BEHIND`,
          message:  messages[severity] || messages.info,
          current:  specEntry.version,
          header:   header.specVersion,
          delta,
          hint:     severity === 'error'
            ? 'Regenerate this component against the current spec before merging'
            : severity === 'warning'
            ? 'Review breaking changes in the spec changelog and plan regeneration'
            : `Minor update available — regenerate at your team's convenience`,
        });
      } else {
        result.checks.push({
          severity: 'pass',
          code:     'SPEC_CURRENT',
          message:  `Spec "${header.specId}" v${header.specVersion} is current`,
        });
      }
    }

    // ── Check persona spec (if present) ──────────────────────────────────────
    if (header.personaId) {
      const personaEntry = registry.get(header.personaId);
      if (!personaEntry) {
        result.checks.push({
          severity: 'warning',
          code:     'PERSONA_NOT_FOUND',
          message:  `Persona "${header.personaId}" not found in registry`,
          hint:     'Check persona spec exists and registry is synced',
        });
      } else {
        const delta    = versionDelta(header.personaVersion, personaEntry.version);
        const severity = getSeverity(delta, personaEntry.status);
        if (severity !== 'pass') {
          result.checks.push({
            severity,
            code:    `PERSONA_${delta.toUpperCase()}_BEHIND`,
            message: `Persona "${header.personaId}" v${header.personaVersion} → v${personaEntry.version}`,
            delta,
            hint:    'Verify column visibility and filter rules still match persona definition',
          });
        }
      }
    }

    results.push(result);
  }

  return results;
}

// ── Reporters ─────────────────────────────────────────────────────────────────
function reportPretty(results) {
  const counts = { pass: 0, info: 0, warning: 0, error: 0 };
  let hasOutput = false;

  console.log(`\n${C.bold}spec-header-check${C.reset}\n`);

  for (const result of results) {
    const worst = result.checks.reduce((w, c) => {
      const rank = { pass: 0, info: 1, warning: 2, error: 3 };
      return rank[c.severity] > rank[w] ? c.severity : w;
    }, 'pass');

    counts[worst]++;

    if (worst === 'pass') continue;
    hasOutput = true;

    const icon = worst === 'error' ? `${C.red}✗${C.reset}`
               : worst === 'warning' ? `${C.yellow}⚠${C.reset}`
               : `${C.blue}ℹ${C.reset}`;

    console.log(`${icon} ${C.bold}${result.file}${C.reset}`);
    console.log(`  ${C.dim}@spec ${result.header.specId} v${result.header.specVersion}${C.reset}`);

    for (const check of result.checks) {
      if (check.severity === 'pass') continue;
      const checkIcon = check.severity === 'error' ? C.red
                      : check.severity === 'warning' ? C.yellow : C.blue;
      console.log(`  ${checkIcon}${check.message}${C.reset}`);
      if (check.hint) console.log(`  ${C.dim}→ ${check.hint}${C.reset}`);
    }
    console.log('');
  }

  if (!hasOutput) {
    console.log(`${C.green}✓ All spec headers are current${C.reset}\n`);
  }

  // Summary
  const total = results.length;
  console.log(`${C.dim}Scanned ${total} file(s) with @spec headers${C.reset}`);
  if (counts.error)   console.log(`${C.red}${C.bold}  ✗ ${counts.error} error(s)${C.reset}`);
  if (counts.warning) console.log(`${C.yellow}  ⚠ ${counts.warning} warning(s)${C.reset}`);
  if (counts.info)    console.log(`${C.blue}  ℹ ${counts.info} info${C.reset}`);
  if (counts.pass && !counts.error && !counts.warning) {
    console.log(`${C.green}  ✓ ${counts.pass} current${C.reset}`);
  }
  console.log('');

  return counts;
}

function reportGitHub(results) {
  // GitHub Actions annotation format
  // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
  for (const result of results) {
    for (const check of result.checks) {
      if (check.severity === 'pass') continue;
      const level = check.severity === 'error' ? 'error'
                  : check.severity === 'warning' ? 'warning' : 'notice';
      const msg = `${check.message}${check.hint ? ` — ${check.hint}` : ''}`;
      console.log(`::${level} file=${result.file},title=Spec Header [${check.code}]::${msg}`);
    }
  }

  const errors   = results.flatMap(r => r.checks).filter(c => c.severity === 'error').length;
  const warnings = results.flatMap(r => r.checks).filter(c => c.severity === 'warning').length;
  const infos    = results.flatMap(r => r.checks).filter(c => c.severity === 'info').length;

  // Summary annotation
  if (errors || warnings || infos) {
    console.log(`::notice title=Spec Header Summary::${errors} error(s), ${warnings} warning(s), ${infos} info(s) across ${results.length} tracked file(s)`);
  }

  return { error: errors, warning: warnings, info: infos, pass: 0 };
}

function reportJson(results) {
  const output = {
    summary: { total: results.length, error: 0, warning: 0, info: 0, pass: 0 },
    files: results,
  };
  for (const r of results) {
    for (const c of r.checks) output.summary[c.severity]++;
  }
  console.log(JSON.stringify(output, null, 2));
  return output.summary;
}

// ── Run ───────────────────────────────────────────────────────────────────────
const results = check();

const counts = FORMAT === 'github' ? reportGitHub(results)
             : FORMAT === 'json'   ? reportJson(results)
             : reportPretty(results);

// Exit code
const shouldFail = FAIL_ON === 'error'   ? counts.error > 0
                 : FAIL_ON === 'warning' ? (counts.error + counts.warning) > 0
                 : FAIL_ON === 'info'    ? (counts.error + counts.warning + counts.info) > 0
                 : false;

process.exit(shouldFail ? 1 : 0);
