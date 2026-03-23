#!/usr/bin/env node
/**
 * registry-sync.js
 *
 * Scans the specs/ directory, extracts frontmatter from every *.spec.md file,
 * and syncs registry.json — adding new specs, updating changed ones, and
 * flagging files that exist in the registry but no longer on disk.
 *
 * Usage:
 *   node tools/registry/registry-sync.js              # sync and report
 *   node tools/registry/registry-sync.js --dry-run    # preview changes only
 *   node tools/registry/registry-sync.js --watch      # sync on file changes
 *   node tools/registry/registry-sync.js --validate   # sync then validate
 */

const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '../..');
const SPECS_DIR     = path.join(ROOT, 'specs');
const REGISTRY_PATH = path.join(ROOT, 'tools/registry/registry.json');

const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const WATCH    = args.includes('--watch');
const VALIDATE = args.includes('--validate');

// ── Frontmatter parser ────────────────────────────────────────────────────────
// Parses the bold-field markdown frontmatter format:
// **field-name:** `value`  or  **field-name:** plain value
function parseFrontmatter(content) {
  const fields = {};
  const lines  = content.split('\n');

  // Title: first # heading
  const titleLine = lines.find(l => l.startsWith('# '));
  if (titleLine) fields.title = titleLine.replace(/^#\s+/, '').trim();

  // Bold fields: **key:** `value` or **key:** value
  const fieldPattern = /\*\*([a-z-]+):\*\*\s*`?([^`\n<]+)`?/gi;
  let match;
  while ((match = fieldPattern.exec(content)) !== null) {
    const key   = match[1].toLowerCase().trim();
    const value = match[2].trim();
    fields[key] = value;
  }

  // Extract tags from content heuristically if not in frontmatter
  // Tags are inferred from namespace/category in the spec-id
  if (fields['spec-id'] && !fields.tags) {
    const parts = fields['spec-id'].split('/');
    fields._inferredTags = parts;
  }

  // Extract agent instructions (lines starting with > **Agent instruction:**)
  const agentInstructions = [];
  const agentPattern = /^>\s+\*\*Agent instruction:\*\*\s*(.+)$/gm;
  while ((match = agentPattern.exec(content)) !== null) {
    agentInstructions.push(match[1].trim());
  }
  if (agentInstructions.length) fields._agentInstructions = agentInstructions;

  // Extract section headings
  const sections = [];
  const sectionPattern = /^##\s+(.+)$/gm;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  if (sections.length) fields._sections = sections;

  // Extract checklist items
  const checklist = [];
  const checklistPattern = /^- \[ \] (.+)$/gm;
  while ((match = checklistPattern.exec(content)) !== null) {
    checklist.push(match[1].trim());
  }
  if (checklist.length) fields._checklist = checklist;

  return fields;
}

// ── Derive registry entry from frontmatter ────────────────────────────────────
function deriveEntry(filePath, content) {
  const fm      = parseFrontmatter(content);
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');

  // Derive spec-id from file path if not in frontmatter
  const pathSpecId = relPath
    .replace(/^specs\//, '')
    .replace(/\.spec\.md$/, '');

  const specId = fm['spec-id'] || pathSpecId;

  // Validate spec-id matches file path
  const pathMismatch = specId !== pathSpecId;

  // Build tags from spec-id parts + any keywords found
  const idParts = specId.split('/');
  const tags    = [...new Set([
    ...idParts,
    ...(fm._inferredTags || []),
  ])].filter(t => t.length > 1);

  // Derive related specs from adapter fields
  const related = [];
  if (fm['token-adapter'])     related.push(fm['token-adapter'].split(' ')[0]);
  if (fm['component-adapter']) related.push(fm['component-adapter'].split(' ')[0]);

  return {
    specId,
    title:       fm.title || specId,
    version:     fm.version || '0.1.0',
    status:      fm.status || 'draft',
    owner:       fm.owner || 'Unknown',
    path:        relPath,
    tags,
    appliesTo:   fm['applies-to'] ? fm['applies-to'].split(',').map(s => s.trim()) : [],
    lastReviewed: fm['last-reviewed'] || new Date().toISOString().split('T')[0],
    related:     related.length ? related : undefined,
    deprecatedBy: fm['deprecated-by'] || null,
    // Enrichment fields used by the explorer (not part of base schema)
    _meta: {
      adapter:           fm.adapter || null,
      tokenAdapter:      fm['token-adapter'] || null,
      componentAdapter:  fm['component-adapter'] || null,
      agentInstructions: fm._agentInstructions || [],
      sections:          fm._sections || [],
      checklist:         fm._checklist || [],
      pathMismatch,
      wordCount:         content.split(/\s+/).length,
      lastModified:      fs.statSync(filePath).mtime.toISOString().split('T')[0],
    }
  };
}

// ── Walk specs directory ──────────────────────────────────────────────────────
function walkSpecs(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSpecs(full));
    } else if (entry.name.endsWith('.spec.md')) {
      files.push(full);
    }
  }
  return files;
}

// ── Main sync ─────────────────────────────────────────────────────────────────
function sync() {
  console.log(`\n${BOLD}registry-sync${RESET} ${DIM}${DRY_RUN ? '(dry run)' : ''}${RESET}\n`);

  // Load existing registry
  let registry = { version: '1.0.0', lastUpdated: '', maintainer: 'UI Architecture', specs: [], namespaces: {} };
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
    } catch (e) {
      console.warn(`${YELLOW}⚠ Could not parse registry.json — starting fresh${RESET}`);
    }
  }

  const existingById = new Map(registry.specs.map(s => [s.specId, s]));

  // Discover all spec files
  const specFiles = walkSpecs(SPECS_DIR);
  console.log(`${DIM}Found ${specFiles.length} spec file(s) in specs/${RESET}\n`);

  const added    = [];
  const updated  = [];
  const warnings = [];
  const newSpecs = [];

  for (const filePath of specFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entry   = deriveEntry(filePath, content);

    if (entry._meta.pathMismatch) {
      warnings.push(`spec-id "${entry.specId}" does not match file path "${entry.path}" — using file path`);
    }

    const existing = existingById.get(entry.specId);

    if (!existing) {
      // New spec — add it
      added.push(entry.specId);
      console.log(`  ${GREEN}+${RESET} ${BOLD}${entry.specId}${RESET} ${DIM}v${entry.version}${RESET} [${entry.status}]`);
      console.log(`    ${DIM}${entry.title}${RESET}`);
    } else {
      // Existing — check if anything changed
      const changed = (
        existing.version     !== entry.version     ||
        existing.status      !== entry.status      ||
        existing.title       !== entry.title       ||
        existing.lastReviewed !== entry.lastReviewed ||
        JSON.stringify(existing.tags) !== JSON.stringify(entry.tags)
      );

      if (changed) {
        updated.push(entry.specId);
        console.log(`  ${YELLOW}~${RESET} ${BOLD}${entry.specId}${RESET} ${DIM}v${existing.version} → v${entry.version}${RESET}`);
        if (existing.status !== entry.status) {
          console.log(`    status: ${existing.status} → ${entry.status}`);
        }
      }

      // Always preserve manual fields not derivable from frontmatter
      entry.notes = existing.notes;
    }

    // Build clean entry (strip _meta for registry, keep for explorer cache)
    const cleanEntry = { ...entry };
    delete cleanEntry._meta;
    if (!cleanEntry.related?.length) delete cleanEntry.related;
    if (!cleanEntry.notes) delete cleanEntry.notes;

    newSpecs.push({ ...cleanEntry, _meta: entry._meta });
    existingById.delete(entry.specId);
  }

  // Anything left in existingById no longer has a file
  for (const [specId, spec] of existingById) {
    warnings.push(`Registry entry "${specId}" has no matching spec file at "${spec.path}" — it will be removed`);
    console.log(`  ${RED}-${RESET} ${BOLD}${specId}${RESET} ${DIM}(file not found)${RESET}`);
  }

  // Summary
  console.log('');
  if (warnings.length) {
    console.log(`${YELLOW}${BOLD}Warnings:${RESET}`);
    warnings.forEach(w => console.log(`  ${YELLOW}⚠${RESET} ${w}`));
    console.log('');
  }

  if (!added.length && !updated.length && !existingById.size) {
    console.log(`${GREEN}✓ Registry already up to date${RESET}\n`);
    if (!VALIDATE) return;
  } else {
    console.log(`${DIM}${added.length} added, ${updated.length} updated, ${existingById.size} removed${RESET}`);
  }

  if (DRY_RUN) {
    console.log(`\n${DIM}Dry run — registry not written${RESET}\n`);
    return;
  }

  // Write updated registry
  // Separate _meta into an explorer cache file — keep registry.json clean
  const cleanForRegistry = newSpecs.map(s => {
    const clean = { ...s };
    delete clean._meta;
    return clean;
  });

  const updatedRegistry = {
    ...registry,
    lastUpdated: new Date().toISOString().split('T')[0],
    specs: cleanForRegistry,
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(updatedRegistry, null, 2));
  console.log(`\n${GREEN}✓ registry.json updated${RESET}`);

  // Write explorer cache (includes _meta for richer UI)
  const explorerCachePath = path.join(ROOT, 'tools/registry/explorer-cache.json');
  const explorerCache = {
    generated: new Date().toISOString(),
    adapter: registry.adapter || 'material-v3',
    specs: newSpecs,
  };
  fs.writeFileSync(explorerCachePath, JSON.stringify(explorerCache, null, 2));
  console.log(`${GREEN}✓ explorer-cache.json updated${RESET}\n`);

  if (VALIDATE) {
    console.log(`${DIM}Running validation...${RESET}`);
    // Basic validation
    const errors = [];
    const ids    = new Set();
    cleanForRegistry.forEach(s => {
      if (ids.has(s.specId)) errors.push(`Duplicate specId: ${s.specId}`);
      ids.add(s.specId);
      if (!['draft','active','deprecated'].includes(s.status)) {
        errors.push(`Invalid status "${s.status}" on ${s.specId}`);
      }
      if (s.status === 'deprecated' && !s.deprecatedBy) {
        errors.push(`Deprecated spec ${s.specId} missing deprecatedBy`);
      }
    });
    if (errors.length) {
      console.log(`${RED}✗ Validation failed:${RESET}`);
      errors.forEach(e => console.log(`  ${RED}✗${RESET} ${e}`));
    } else {
      console.log(`${GREEN}✓ Validation passed — ${cleanForRegistry.length} spec(s) OK${RESET}\n`);
    }
  }
}

// ── Watch mode ────────────────────────────────────────────────────────────────
if (WATCH) {
  console.log(`${CYAN}Watching specs/ for changes...${RESET} (Ctrl+C to stop)\n`);
  sync();

  // Simple polling watch — avoids fs.watch quirks across platforms
  let lastMtimes = {};
  setInterval(() => {
    const files = walkSpecs(SPECS_DIR);
    let changed = false;

    for (const f of files) {
      const mtime = fs.statSync(f).mtime.getTime();
      if (lastMtimes[f] !== mtime) {
        lastMtimes[f] = mtime;
        changed = true;
      }
    }

    // Check for deletions
    for (const f of Object.keys(lastMtimes)) {
      if (!fs.existsSync(f)) {
        delete lastMtimes[f];
        changed = true;
      }
    }

    if (changed) sync();
  }, 1500);
} else {
  sync();
}
