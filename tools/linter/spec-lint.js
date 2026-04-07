#!/usr/bin/env node
/**
 * spec-lint — validates a spec markdown file against the correct spec-type schema
 *
 * Supports two spec types:
 *   - pattern (default): ds/ and fw/ layer specs with full section schema
 *   - composition: domain/ layer-3 delta specs with column/filter/state schema
 *
 * Spec type is auto-detected from **spec-type:** frontmatter, or inferred from
 * the presence of composition-specific markers (base-pattern, persona, entitlement).
 *
 * Usage:
 *   node spec-lint.js <path-to-spec.md>
 *   node spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md
 *   node spec-lint.js specs/domain/patterns/ag-grid-datatable/coverage-banker.spec.md
 */

const fs = require('fs');
const path = require('path');

const [,, specPath] = process.argv;
if (!specPath) {
  console.error('Usage: spec-lint.js <path-to-spec.md>');
  process.exit(1);
}

const content = fs.readFileSync(path.resolve(specPath), 'utf-8');
const lines = content.split('\n');

const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// ── Spec-type detection ──────────────────────────────────────────────────────
// 1. Explicit: **spec-type:** `composition`
// 2. Inferred: has **base-pattern:** AND **persona:** AND **entitlement:**
// 3. Inferred: file is a .persona.md or .entitlement.md (skip full validation)
// 4. Default: pattern

function detectSpecType() {
  const explicitMatch = content.match(/\*\*spec-type:\*\*\s*`([^`]+)`/);
  if (explicitMatch) return explicitMatch[1];

  const hasBasePattern = /\*\*base-pattern:\*\*/.test(content);
  const hasPersona = /\*\*persona:\*\*/.test(content);
  const hasEntitlement = /\*\*entitlement:\*\*/.test(content);

  if (hasBasePattern && hasPersona && hasEntitlement) return 'composition';

  if (specPath.endsWith('.persona.md')) return 'persona';
  if (specPath.endsWith('.entitlement.md')) return 'entitlement';

  // Infer from spec-id namespace
  const idMatch = content.match(/\*\*spec-id:\*\*\s*`([^`]+)`/);
  if (idMatch) {
    const id = idMatch[1];
    if (id.startsWith('ds/tokens/'))     return 'token';
    if (id.startsWith('ds/components/')) return 'component';
    if (id.startsWith('fw/'))           return 'framework';
  }

  // Infer from path
  if (specPath.includes('/ds/tokens/'))     return 'token';
  if (specPath.includes('/ds/components/')) return 'component';
  if (specPath.includes('/fw/'))           return 'framework';

  return 'pattern';
}

const specType = detectSpecType();

// ── Shared frontmatter fields ────────────────────────────────────────────────
const SHARED_FIELDS = ['spec-id', 'version', 'status', 'owner', 'last-reviewed'];

const PATTERN_FIELDS = [...SHARED_FIELDS, 'applies-to'];

const COMPOSITION_FIELDS = [
  ...SHARED_FIELDS,
  'layer',
  'base-pattern',
  'persona',
  'entitlement',
];

const LIGHTWEIGHT_FIELDS = ['spec-id', 'version', 'status', 'owner', 'last-reviewed'];

// Token, component, and framework specs use the same frontmatter as patterns
const TOKEN_FIELDS = [...SHARED_FIELDS, 'applies-to'];
const COMPONENT_FIELDS = [...SHARED_FIELDS, 'applies-to'];
const FRAMEWORK_FIELDS = [...SHARED_FIELDS, 'applies-to'];

function getRequiredFields() {
  switch (specType) {
    case 'composition': return COMPOSITION_FIELDS;
    case 'persona':     return LIGHTWEIGHT_FIELDS;
    case 'entitlement': return LIGHTWEIGHT_FIELDS;
    case 'token':       return TOKEN_FIELDS;
    case 'component':   return COMPONENT_FIELDS;
    case 'framework':   return FRAMEWORK_FIELDS;
    default:            return PATTERN_FIELDS;
  }
}

getRequiredFields().forEach(field => {
  const pattern = new RegExp(`\\*\\*${field}:\\*\\*`);
  if (!pattern.test(content)) err(`Missing required frontmatter field: **${field}:**`);
});

// Status must be valid
const statusMatch = content.match(/\*\*status:\*\*\s*`([^`]+)`/);
if (statusMatch && !['draft', 'active', 'deprecated'].includes(statusMatch[1])) {
  err(`Invalid status: "${statusMatch[1]}" — must be draft | active | deprecated`);
}

// Version must be semver
const versionMatch = content.match(/\*\*version:\*\*\s*`([^`]+)`/);
if (versionMatch && !versionMatch[1].match(/^\d+\.\d+\.\d+$/)) {
  err(`Invalid version format: "${versionMatch[1]}" — must be semver (e.g. 1.0.0)`);
}

// spec-id format — composition specs allow deeper nesting (4 segments)
const specIdMatch = content.match(/\*\*spec-id:\*\*\s*`([^`]+)`/);
if (specIdMatch) {
  const id = specIdMatch[1];
  const patternId = /^[a-z]+\/[a-z]+\/[a-z0-9-]+$/;
  const compositionId = /^[a-z]+\/[a-z]+\/[a-z0-9-]+(\/[a-z0-9-]+)?$/;
  const targetPattern = specType === 'composition' ? compositionId : patternId;
  if (!targetPattern.test(id)) {
    err(`Invalid spec-id format: "${id}" — must be namespace/category/pattern-name${specType === 'composition' ? '[/variant]' : ''}`);
  }
}

// ── Compliance signoff check ─────────────────────────────────────────────────
// If any column is tagged fee-sensitive, revenue-sensitive, or mnpi-sensitive,
// the spec must have a compliance-signoff field
if (specType === 'composition') {
  const hasSensitiveColumns = /\b(fee-sensitive|revenue-sensitive|mnpi-sensitive)\b/.test(content)
    && /\*\*true\*\*|true\s*\|/.test(content);

  if (hasSensitiveColumns) {
    const hasSignoff = /\*\*compliance-signoff:\*\*/.test(content);
    if (!hasSignoff) {
      err('Spec contains sensitivity-tagged columns but missing **compliance-signoff:** field');
    } else {
      // Check it's not a placeholder
      const signoffMatch = content.match(/\*\*compliance-signoff:\*\*\s*`([^`]*)`/);
      if (signoffMatch && (!signoffMatch[1] || signoffMatch[1].includes('[') || signoffMatch[1].trim() === '')) {
        warn('**compliance-signoff:** appears to be a placeholder — must name the approver before status: active');
      }
    }
  }
}

// ── Required sections — pattern specs ────────────────────────────────────────
const PATTERN_SECTIONS_REQUIRED = [
  { heading: '## 1. Intent',                   key: 'intent' },
  { heading: '## 2. Scope',                    key: 'scope' },
  { heading: '### In scope',                   key: 'in-scope' },
  { heading: '### Out of scope',               key: 'out-of-scope' },
];

// These are recommended for UI component pattern specs but not all patterns
// (e.g., calculation/utility specs don't have a component structure)
const PATTERN_SECTIONS_RECOMMENDED = [
  { heading: '## 3. Design System Tokens',     key: 'tokens' },
  { heading: '## 4. Component Structure',      key: 'structure' },
  { heading: '### 4.1 File layout',            key: 'file-layout' },
  { heading: '### 4.2 Required inputs',        key: 'inputs-outputs' },
];

// ── Required sections — composition specs ────────────────────────────────────
const COMPOSITION_SECTIONS = [
  { heading: '## 1. Intent',            key: 'intent' },
  { heading: '## 2. Columns',           key: 'columns' },
  { heading: '## 3. Filters',           key: 'filters' },
  { heading: '## 4. Row actions',       key: 'row-actions',   alt: '## 4. Row Actions' },
  { heading: '## 5. Bulk actions',      key: 'bulk-actions',  alt: '## 5. Bulk Actions' },
  { heading: '## 6. Behavioral variant', key: 'variant',      alt: '## 6. Behavioral Variant' },
];

// Sections required by CLAUDE.md — all three states
const COMPOSITION_STATE_SECTIONS = [
  { heading: 'Loading state',  key: 'loading-state',  pattern: /##\s+\d+\.\s+Loading [Ss]tate/ },
  { heading: 'Empty state',    key: 'empty-state',    pattern: /##\s+\d+\.\s+Empty [Ss]tate/ },
  { heading: 'Error state',    key: 'error-state',    pattern: /##\s+\d+\.\s+Error [Ss]tate/ },
];

// Sections that strengthen enterprise readiness
const COMPOSITION_RECOMMENDED_SECTIONS = [
  { heading: 'Null / zero value rendering rules', key: 'null-rules',  pattern: /##\s+\d+\.\s+Null/i },
  { heading: 'Acceptance criteria',                key: 'acceptance',  pattern: /##\s+\d+\.\s+Acceptance [Cc]riteria/ },
];

// ── Required sections — token specs ──────────────────────────────────────────
const TOKEN_SECTIONS = [
  { heading: '## 1. Intent', key: 'intent' },
];

// ── Required sections — component specs ──────────────────────────────────────
const COMPONENT_SECTIONS = [
  { heading: '## 1. Intent', key: 'intent' },
];

// ── Required sections — framework specs ──────────────────────────────────────
const FRAMEWORK_SECTIONS = [
  { heading: '## 1. Intent', key: 'intent' },
  { heading: '## 2. Scope',  key: 'scope' },
  { heading: '### In scope', key: 'in-scope' },
  { heading: '### Out of scope', key: 'out-of-scope' },
];

function checkSections() {
  let sectionsToCheck = [];

  switch (specType) {
    case 'pattern':
      sectionsToCheck = PATTERN_SECTIONS_REQUIRED;
      // Check recommended sections (warn, not error)
      PATTERN_SECTIONS_RECOMMENDED.forEach(({ heading }) => {
        if (!content.includes(heading)) {
          warn(`Missing recommended section: "${heading}" — required for UI component specs, optional for utility/calculation specs`);
        }
      });
      break;
    case 'token':
      sectionsToCheck = TOKEN_SECTIONS;
      break;
    case 'component':
      sectionsToCheck = COMPONENT_SECTIONS;
      break;
    case 'framework':
      sectionsToCheck = FRAMEWORK_SECTIONS;
      break;
    case 'composition':
      // Composition sections validated separately below
      break;
    case 'persona':
    case 'entitlement':
      // Lightweight specs — no required heading structure
      break;
  }

  sectionsToCheck.forEach(({ heading }) => {
    if (!content.includes(heading)) {
      err(`Missing required section: "${heading}"`);
    }
  });

  if (specType === 'composition') {
    COMPOSITION_SECTIONS.forEach(({ heading, alt }) => {
      if (!content.includes(heading) && !(alt && content.includes(alt))) {
        err(`Missing required section: "${heading}"`);
      }
    });

    COMPOSITION_STATE_SECTIONS.forEach(({ heading, pattern }) => {
      if (!pattern.test(content)) {
        err(`Missing required state section: "${heading}" — CLAUDE.md requires loading, empty, and error states`);
      }
    });

    COMPOSITION_RECOMMENDED_SECTIONS.forEach(({ heading, pattern }) => {
      if (!pattern.test(content)) {
        warn(`Missing recommended section: "${heading}" — strengthens testability and enterprise readiness`);
      }
    });
  }
}

checkSections();

// ── Agent checklist section ────────────────────────────────────────────────���──
// Required for pattern, composition, framework specs.
// Token and component specs may use "DS swap checklist" as their validation section.
// Persona and entitlement specs are lightweight — checklist is recommended, not required.
const hasChecklist = content.match(/##\s+\d+\.\s+(Agent [Cc]hecklist|DS [Ss]wap [Cc]hecklist)/);

if (specType === 'persona' || specType === 'entitlement') {
  if (!hasChecklist) {
    warn('Missing recommended section: Agent Checklist — helps agents validate their work');
  }
} else {
  if (!hasChecklist) {
    err('Missing required section: Agent Checklist (or DS swap checklist for adapter specs)');
  }
}

// ── Change log section (both types) ──────────────────────────────────────────
if (!content.match(/##\s+\d+\.\s+Versioning/)) {
  err('Missing required section: Versioning & Change Log');
}

// ── Agent instruction anchors ────────────────────────────────────────────────
const agentInstructions = content.match(/>\s+\*\*Agent instruction:\*\*/g) || [];
if (specType === 'pattern' || specType === 'token' || specType === 'component') {
  if (agentInstructions.length === 0) {
    err('No agent instructions found — at minimum, §1 Intent must have one');
  } else if (agentInstructions.length < 2 && specType === 'pattern') {
    warn('Only 1 agent instruction found — consider adding instructions to token and checklist sections');
  }
} else if (specType === 'composition') {
  if (agentInstructions.length === 0) {
    err('No agent instructions found — §1 Intent must have the spec reading order');
  }
} else if (specType === 'framework') {
  if (agentInstructions.length === 0) {
    warn('No agent instructions found — consider adding one to §1 Intent');
  }
}

// ── Hardcoded values check ───────────────────────────────────────────────────
const hexPattern = /#[0-9a-fA-F]{3,6}(?![a-fA-F0-9])/g;
const nonCodeContent = content.replace(/```[\s\S]*?```/g, '');

const hexInProse = nonCodeContent.match(hexPattern);
if (hexInProse) {
  warn(`Possible hardcoded hex color(s) outside code blocks: ${hexInProse.slice(0,3).join(', ')}`);
}

// ── Checklist items ──────────────────────────────────────────────────────────
const checklistItems = content.match(/- \[ \] /g) || [];
if (specType === 'pattern' && checklistItems.length < 5) {
  warn(`Agent checklist has only ${checklistItems.length} item(s) — consider adding more coverage`);
}
if (specType === 'composition' && checklistItems.length < 8) {
  warn(`Agent checklist has only ${checklistItems.length} item(s) — composition specs should verify columns, states, actions, and acceptance criteria`);
}

// ── Related specs ────────────────────────────────────────────────────────────
if (!content.match(/##\s+\d+\.\s+Related/)) {
  warn('No Related Specs section — helps agents route out-of-scope requests');
}

// ── Out of scope redirects (pattern specs only) ──────────────────────────────
if (specType === 'pattern') {
  const outOfScopeSection = content.match(/### Out of scope([\s\S]*?)###/);
  if (outOfScopeSection) {
    const hasRedirects = outOfScopeSection[1].includes('→') || outOfScopeSection[1].includes('->');
    if (!hasRedirects) {
      warn('Out of scope section has no redirects (→ spec-id) — agents may improvise without them');
    }
  }
}

// ── Composition: base-pattern version pinned ─────────────────────────────────
if (specType === 'composition') {
  const basePatternMatch = content.match(/\*\*base-pattern:\*\*\s*`([^`]+)`\s*v([\d.]+)/);
  if (!basePatternMatch) {
    warn('**base-pattern:** should include a pinned version (e.g., `ds/patterns/ag-grid-datatable` v2.0.0)');
  }
}

// ── Composition: checklist section count accuracy ────────────────────────────
if (specType === 'composition') {
  const sectionCountMatch = content.match(/All (\d+) spec sections read/);
  const actualSections = content.match(/^## \d+\./gm) || [];
  if (sectionCountMatch && actualSections.length > 0) {
    const claimed = parseInt(sectionCountMatch[1], 10);
    if (claimed !== actualSections.length) {
      warn(`Checklist claims "All ${claimed} spec sections" but spec has ${actualSections.length} numbered sections`);
    }
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
const specId = specIdMatch ? specIdMatch[1] : path.basename(specPath);
const typeLabel = specType.charAt(0).toUpperCase() + specType.slice(1);
console.log(`\n${BOLD}spec-lint${RESET} ${CYAN}[${typeLabel}]${RESET} — ${DIM}${specId}${RESET}\n`);

if (errors.length) {
  console.log(`${RED}${BOLD}✗ Errors (${errors.length})${RESET}`);
  errors.forEach(e => console.log(`  ${RED}✗${RESET} ${e}`));
  console.log('');
}

if (warnings.length) {
  console.log(`${YELLOW}${BOLD}⚠ Warnings (${warnings.length})${RESET}`);
  warnings.forEach(w => console.log(`  ${YELLOW}⚠${RESET} ${w}`));
  console.log('');
}

if (!errors.length && !warnings.length) {
  console.log(`${GREEN}${BOLD}✓ Spec passed all checks${RESET}\n`);
} else if (!errors.length) {
  console.log(`${GREEN}✓ No errors${RESET} — ${warnings.length} warning(s) to review\n`);
} else {
  console.log(`${RED}✗ Spec has ${errors.length} error(s) — fix before merging to active\n${RESET}`);
  process.exit(1);
}
