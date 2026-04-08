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
const PRIMITIVES_PATH = path.join(__dirname, 'primitives.json');
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

function loadPrimitives() {
  if (!fs.existsSync(PRIMITIVES_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(PRIMITIVES_PATH, 'utf-8')); } catch { return null; }
}

function getAllPrimitives(primData) {
  if (!primData?.primitives) return [];
  return Object.values(primData.primitives).flat();
}

function printPrimitive(prim, verbose = false) {
  const statusColor = prim.status === 'deprecated' ? '\x1b[31m' : prim.status === 'beta' ? '\x1b[33m' : '\x1b[32m';
  console.log(`${BOLD}${prim.key}${RESET} [${statusColor}${prim.status || 'stable'}${RESET}]`);
  console.log(`  ${prim.description}`);
  if (verbose) {
    console.log(`  Import:      ${prim.importPath}`);
    if (prim.exportName) console.log(`  Export:      ${prim.exportName}`);
    console.log(`  Spec ref:    ${prim.specRef}`);
    if (prim.tags?.length) console.log(`  Tags:        ${prim.tags.join(', ')}`);
    if (prim.paramsSchema) {
      console.log(`  Params:      ${JSON.stringify(prim.paramsSchema, null, 2).split('\n').join('\n               ')}`);
    }
  }
  console.log('');
}

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

  case 'primitives': {
    const subCmd = args[0];
    const primData = loadPrimitives();

    if (!primData) {
      console.error(`\n${BOLD}✗ primitives.json not found${RESET}\n`);
      process.exit(1);
    }

    const all = getAllPrimitives(primData);

    switch (subCmd) {
      case 'list': {
        const catFilter = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
        const statusFilter = args.includes('--status') ? args[args.indexOf('--status') + 1] : null;
        let filtered = all;
        if (catFilter) filtered = filtered.filter(p => p.category === catFilter);
        if (statusFilter) filtered = filtered.filter(p => (p.status || 'stable') === statusFilter);

        console.log(`\n${BOLD}Primitive Registry${RESET} ${DIM}v${primData.version} · adapter: ${primData.adapter}${RESET}`);
        console.log(`${DIM}${filtered.length} primitive(s)${catFilter ? ` in category "${catFilter}"` : ''}${RESET}\n`);
        filtered.forEach(p => printPrimitive(p));
        break;
      }

      case 'get': {
        const key = args[1];
        if (!key) { console.error('Usage: primitives get <key>'); process.exit(1); }
        const prim = all.find(p => p.key === key);
        if (!prim) {
          console.error(`\nPrimitive not found: ${key}\n`);
          console.log(`${DIM}Available keys: ${all.map(p => p.key).join(', ')}${RESET}\n`);
          process.exit(1);
        }
        console.log('');
        printPrimitive(prim, true);
        break;
      }

      case 'catalog': {
        // Machine-readable export for AI agents
        console.log(JSON.stringify(primData, null, 2));
        break;
      }

      case 'validate': {
        const errors = [];
        const keys = new Set();

        // Check for duplicate keys
        for (const prim of all) {
          if (keys.has(prim.key)) errors.push(`Duplicate key: ${prim.key}`);
          keys.add(prim.key);

          // Validate key format
          if (!/^(columnType|renderer|editor|filter|formatter|gridPreset|constant):[a-zA-Z][a-zA-Z0-9]*$/.test(prim.key)) {
            errors.push(`Invalid key format: ${prim.key}`);
          }

          // Validate category matches key prefix
          const prefix = prim.key.split(':')[0];
          if (prefix !== prim.category) {
            errors.push(`${prim.key}: key prefix "${prefix}" doesn't match category "${prim.category}"`);
          }

          // Required fields
          if (!prim.description) errors.push(`${prim.key}: missing description`);
          if (!prim.importPath) errors.push(`${prim.key}: missing importPath`);
          if (!prim.specRef) errors.push(`${prim.key}: missing specRef`);

          // Validate specRef points to a known spec
          const specId = prim.specRef.split(' ')[0];
          if (!registry.specs.find(s => s.specId === specId)) {
            errors.push(`${prim.key}: specRef "${specId}" not found in registry`);
          }
        }

        // Category counts
        const catCounts = {};
        for (const prim of all) {
          catCounts[prim.category] = (catCounts[prim.category] || 0) + 1;
        }

        if (errors.length) {
          console.error(`\n${BOLD}Primitive validation failed:${RESET}`);
          errors.forEach(e => console.error(`  ✗ ${e}`));
          console.log('');
          process.exit(1);
        } else {
          console.log(`\n✓ Primitives valid — ${all.length} primitive(s) OK`);
          console.log(`${DIM}  ${Object.entries(catCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}${RESET}\n`);
        }
        break;
      }

      default:
        console.log(`
${BOLD}primitives${RESET} — Grid Primitive Registry

Subcommands:
  list [--category <cat>] [--status <status>]   List primitives
  get <key>                                      Show full primitive details
  catalog                                        Export full registry as JSON (for agents)
  validate                                       Validate primitive registry integrity

Categories: columnType, renderer, editor, filter, formatter, gridPreset, constant
`);
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
  primitives <subcommand>                   Grid primitive registry (list, get, catalog, validate)
`);
}
