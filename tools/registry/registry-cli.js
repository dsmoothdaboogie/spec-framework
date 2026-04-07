#!/usr/bin/env node
/**
 * spec-registry CLI
 * Usage:
 *   node registry-cli.js list
 *   node registry-cli.js list --status active
 *   node registry-cli.js search <query>
 *   node registry-cli.js get <spec-id>
 *   node registry-cli.js validate
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'registry.json');
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));

const [,, command, ...args] = process.argv;

const STATUS_COLORS = {
  active: '\x1b[32m',     // green
  draft: '\x1b[33m',      // yellow
  deprecated: '\x1b[31m', // red
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

function colorStatus(status) {
  return `${STATUS_COLORS[status] || ''}${status}${RESET}`;
}

function printSpec(spec, verbose = false) {
  const deprecated = spec.status === 'deprecated' ? ` → ${spec.deprecatedBy}` : '';
  console.log(`${BOLD}${spec.specId}${RESET} ${DIM}v${spec.version}${RESET} [${colorStatus(spec.status)}${deprecated}]`);
  console.log(`  ${spec.title}`);
  if (verbose) {
    console.log(`  Owner:       ${spec.owner}`);
    if (spec.specType)  console.log(`  Spec type:   ${spec.specType}`);
    if (spec.layer != null) console.log(`  Layer:       ${spec.layer}`);
    console.log(`  Applies to:  ${(spec.appliesTo || []).join(', ') || '—'}`);
    console.log(`  Tags:        ${spec.tags.join(', ')}`);
    console.log(`  Path:        ${spec.path}`);
    if (spec.dependsOn?.length) {
      console.log(`  Depends on:  ${spec.dependsOn.map(d => `${d.specId}@${d.version || '?'}`).join(', ')}`);
    }
    if (spec.requiredBy?.length) {
      console.log(`  Required by: ${spec.requiredBy.join(', ')}`);
    }
    if (spec.related?.length) {
      console.log(`  Related:     ${spec.related.join(', ')}`);
    }
    console.log(`  Last review: ${spec.lastReviewed}`);
  }
  console.log('');
}

switch (command) {
  case 'list': {
    const statusFilter = args.includes('--status') ? args[args.indexOf('--status') + 1] : null;
    const filtered = statusFilter
      ? registry.specs.filter(s => s.status === statusFilter)
      : registry.specs;

    console.log(`\n${BOLD}Spec Registry${RESET} ${DIM}v${registry.version}${RESET}`);
    console.log(`${DIM}Maintained by ${registry.maintainer} · ${filtered.length} spec(s)${RESET}\n`);
    filtered.forEach(s => printSpec(s));
    break;
  }

  case 'search': {
    const query = args.join(' ').toLowerCase();
    if (!query) { console.error('Usage: search <query>'); process.exit(1); }

    const results = registry.specs.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.specId.toLowerCase().includes(query) ||
      s.tags.some(t => t.toLowerCase().includes(query))
    );

    console.log(`\n${BOLD}Search: "${query}"${RESET} — ${results.length} result(s)\n`);
    if (!results.length) {
      console.log('No specs found. Consider creating one with the SPEC.template.md.\n');
    } else {
      results.forEach(s => printSpec(s));
    }
    break;
  }

  case 'get': {
    const specId = args[0];
    if (!specId) { console.error('Usage: get <spec-id>'); process.exit(1); }

    const spec = registry.specs.find(s => s.specId === specId);
    if (!spec) {
      console.error(`\nSpec not found: ${specId}\n`);
      process.exit(1);
    }
    console.log('');
    printSpec(spec, true);
    break;
  }

  case 'validate': {
    const errors = [];
    const ids = new Set();

    registry.specs.forEach((spec, i) => {
      const prefix = `specs[${i}] (${spec.specId})`;

      if (ids.has(spec.specId)) errors.push(`${prefix}: duplicate specId`);
      ids.add(spec.specId);

      if (!spec.specId.match(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*\/[a-z0-9-]+(\/[a-z0-9-]+)?$/)) {
        errors.push(`${prefix}: specId format invalid — must be namespace/category/pattern`);
      }
      if (!['draft', 'active', 'deprecated'].includes(spec.status)) {
        errors.push(`${prefix}: invalid status "${spec.status}"`);
      }
      if (spec.status === 'deprecated' && !spec.deprecatedBy) {
        errors.push(`${prefix}: deprecated spec must have deprecatedBy field`);
      }
      if (!fs.existsSync(path.join(__dirname, '../../', spec.path))) {
        errors.push(`${prefix}: spec file not found at ${spec.path}`);
      }
    });

    if (errors.length) {
      console.error(`\n${BOLD}Registry validation failed:${RESET}`);
      errors.forEach(e => console.error(`  ✗ ${e}`));
      console.log('');
      process.exit(1);
    } else {
      console.log(`\n✓ Registry valid — ${registry.specs.length} spec(s) OK\n`);
    }
    break;
  }

  case 'blast-radius': {
    const targetId = args[0];
    if (!targetId) { console.error('Usage: blast-radius <spec-id>'); process.exit(1); }

    const target = registry.specs.find(s => s.specId === targetId);
    if (!target) {
      console.error(`\nSpec not found: ${targetId}\n`);
      process.exit(1);
    }

    // Direct dependents from requiredBy
    const directDeps = target.requiredBy || [];

    // Transitive: specs that depend on the direct dependents
    const transitive = new Set();
    function walk(specId) {
      const spec = registry.specs.find(s => s.specId === specId);
      if (!spec || !spec.requiredBy) return;
      for (const depId of spec.requiredBy) {
        if (!transitive.has(depId) && depId !== targetId) {
          transitive.add(depId);
          walk(depId);
        }
      }
    }
    directDeps.forEach(walk);

    console.log(`\n${BOLD}Blast radius: ${targetId}${RESET} v${target.version}\n`);

    if (!directDeps.length) {
      console.log(`  No specs depend on this spec.\n`);
    } else {
      console.log(`  ${BOLD}Direct dependents (${directDeps.length}):${RESET}`);
      directDeps.forEach(id => {
        const s = registry.specs.find(sp => sp.specId === id);
        const label = s ? `${DIM}${s.specType || '?'} · ${s.status}${RESET}` : '';
        console.log(`    → ${id} ${label}`);
      });

      if (transitive.size) {
        console.log(`\n  ${BOLD}Transitive dependents (${transitive.size}):${RESET}`);
        [...transitive].forEach(id => console.log(`    → ${id}`));
      }
      console.log('');
    }
    break;
  }

  default:
    console.log(`
${BOLD}spec-registry${RESET} — Spec Framework CLI

Commands:
  list [--status draft|active|deprecated]   List all specs
  search <query>                            Search by title, id, or tag
  get <spec-id>                             Show full spec details
  validate                                  Validate registry integrity
  blast-radius <spec-id>                    Show all specs affected by a change
`);
}
