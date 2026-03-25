#!/usr/bin/env node
/**
 * spec-dependency-check.js
 *
 * Detects DS package version changes in package.json and flags
 * all specs that have a dependency on those packages.
 * Outputs GitHub annotations or a summary report.
 *
 * Usage:
 *   node tools/ci/spec-dependency-check.js
 *   node tools/ci/spec-dependency-check.js --format github
 *   node tools/ci/spec-dependency-check.js --format json
 */

const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

const ROOT          = path.join(__dirname, '../..');
const REGISTRY_PATH = path.join(ROOT, 'tools/registry/registry.json');
const SPECS_DIR     = path.join(ROOT, 'specs');

const args   = process.argv.slice(2);
const FORMAT = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'pretty';

const C = FORMAT === 'pretty' ? {
  bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
} : Object.fromEntries(['bold','dim','reset','green','yellow','red','cyan'].map(k=>[k,'']));

// ── Detect changed packages ───────────────────────────────────────────────────
function getChangedPackages() {
  try {
    const diff = execSync('git diff HEAD~1 HEAD -- package.json', {
      cwd: ROOT, encoding: 'utf-8'
    });

    const changed = [];
    const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));

    for (const line of addedLines) {
      // Match "@company/ds-tokens": "^2.0.0" style lines
      const m = line.match(/"(@company\/[^"]+)":\s*"([^"]+)"/);
      if (m) changed.push({ package: m[1], version: m[2] });
    }
    return changed;
  } catch {
    return [];
  }
}

// ── Find specs that reference changed packages ────────────────────────────────
function findAffectedSpecs(changedPackages) {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  const affected  = [];

  for (const spec of registry.specs) {
    const specPath = path.join(ROOT, spec.path);
    if (!fs.existsSync(specPath)) continue;

    const content = fs.readFileSync(specPath, 'utf-8');

    for (const pkg of changedPackages) {
      if (content.includes(pkg.package)) {
        affected.push({
          spec,
          triggeredBy: pkg,
          // Check if spec has a design.md with anchors
          hasDesignDoc: fs.existsSync(specPath.replace('.spec.md', '.design.md')),
        });
        break; // One match per spec is enough
      }
    }
  }

  return affected;
}

// ── Run ───────────────────────────────────────────────────────────────────────
const changedPackages = getChangedPackages();

if (!changedPackages.length) {
  if (FORMAT === 'pretty') {
    console.log(`\n${C.green}✓ No DS package changes detected${C.reset}\n`);
  }
  process.exit(0);
}

const affected = findAffectedSpecs(changedPackages);

if (FORMAT === 'github') {
  for (const pkg of changedPackages) {
    console.log(`::notice title=DS Package Changed::${pkg.package} updated to ${pkg.version}`);
  }

  if (affected.length) {
    const specList = affected.map(a => a.spec.specId).join(', ');
    console.log(`::warning title=Spec Review Required::${affected.length} spec(s) may need review due to DS package changes: ${specList}`);

    for (const a of affected) {
      console.log(`::notice file=${a.spec.path},title=Spec Review::This spec references ${a.triggeredBy.package} which changed to ${a.triggeredBy.version}. Review §3 token mappings and §10 swap checklist.`);
    }
  }
} else if (FORMAT === 'json') {
  console.log(JSON.stringify({ changedPackages, affectedSpecs: affected }, null, 2));
} else {
  console.log(`\n${C.bold}spec-dependency-check${C.reset}\n`);
  console.log(`${C.yellow}DS packages changed:${C.reset}`);
  changedPackages.forEach(p => console.log(`  ${C.dim}+${C.reset} ${p.package} → ${p.version}`));
  console.log('');

  if (affected.length) {
    console.log(`${C.yellow}${C.bold}${affected.length} spec(s) need review:${C.reset}`);
    affected.forEach(a => {
      console.log(`  ${C.yellow}⚠${C.reset} ${C.bold}${a.spec.specId}${C.reset} v${a.spec.version}`);
      console.log(`    ${C.dim}Triggered by: ${a.triggeredBy.package}${C.reset}`);
      console.log(`    ${C.dim}${a.spec.path}${C.reset}`);
      if (a.hasDesignDoc) {
        console.log(`    ${C.cyan}→ design.md exists — check decision anchors${C.reset}`);
      }
    });
  } else {
    console.log(`${C.green}✓ No specs affected by these package changes${C.reset}`);
  }
  console.log('');
}
