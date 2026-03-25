#!/usr/bin/env node
/**
 * spec-lint — validates a spec markdown file against the meta-spec template
 * Usage:
 *   node spec-lint.js <path-to-spec.md>
 *   node spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md
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
const RESET = '\x1b[0m';

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// ── Frontmatter fields ────────────────────────────────────────────────────────
const REQUIRED_FIELDS = ['spec-id', 'version', 'status', 'owner', 'last-reviewed', 'applies-to'];
REQUIRED_FIELDS.forEach(field => {
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

// spec-id must be namespaced
const specIdMatch = content.match(/\*\*spec-id:\*\*\s*`([^`]+)`/);
if (specIdMatch && !specIdMatch[1].match(/^[a-z]+\/[a-z]+\/[a-z0-9-]+$/)) {
  err(`Invalid spec-id format: "${specIdMatch[1]}" — must be namespace/category/pattern-name`);
}

// ── Required sections ─────────────────────────────────────────────────────────
const REQUIRED_SECTIONS = [
  { heading: '## 1. Intent',                   key: 'intent' },
  { heading: '## 2. Scope',                    key: 'scope' },
  { heading: '### In scope',                   key: 'in-scope' },
  { heading: '### Out of scope',               key: 'out-of-scope' },
  { heading: '## 3. Design System Tokens',     key: 'tokens' },
  { heading: '## 4. Component Structure',      key: 'structure' },
  { heading: '### 4.1 File layout',            key: 'file-layout' },
  { heading: '### 4.2 Required inputs',        key: 'inputs-outputs' },
];

REQUIRED_SECTIONS.forEach(({ heading, key }) => {
  if (!content.includes(heading)) {
    err(`Missing required section: "${heading}"`);
  }
});

// Agent checklist section
if (!content.includes('## ') || !content.match(/##\s+\d+\.\s+Agent Checklist/)) {
  err('Missing required section: Agent Checklist');
}

// Change log section
if (!content.match(/##\s+\d+\.\s+Versioning/)) {
  err('Missing required section: Versioning & Change Log');
}

// ── Agent instruction anchors ─────────────────────────────────────────────────
const agentInstructions = content.match(/>\s+\*\*Agent instruction:\*\*/g) || [];
if (agentInstructions.length === 0) {
  err('No agent instructions found — at minimum, §1 Intent must have one');
} else if (agentInstructions.length < 2) {
  warn('Only 1 agent instruction found — consider adding instructions to token and checklist sections');
}

// ── Hardcoded values check ────────────────────────────────────────────────────
const hexPattern = /#[0-9a-fA-F]{3,6}(?![a-fA-F0-9])/g;
const rawPxPattern = /:\s*\d+px/g;

const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
const codeContent = codeBlocks.join('\n');
const nonCodeContent = content.replace(/```[\s\S]*?```/g, '');

// Only flag hardcoded values outside of code examples
const hexInProse = nonCodeContent.match(hexPattern);
if (hexInProse) {
  warn(`Possible hardcoded hex color(s) outside code blocks: ${hexInProse.slice(0,3).join(', ')}`);
}

// ── Checklist items ────────────────────────────────────────────────────────────
const checklistItems = content.match(/- \[ \] /g) || [];
if (checklistItems.length < 5) {
  warn(`Agent checklist has only ${checklistItems.length} item(s) — consider adding more coverage`);
}

// ── Related specs ─────────────────────────────────────────────────────────────
if (!content.match(/##\s+\d+\.\s+Related/)) {
  warn('No Related Specs section — helps agents route out-of-scope requests');
}

// ── Out of scope redirects ────────────────────────────────────────────────────
const outOfScopeSection = content.match(/### Out of scope([\s\S]*?)###/);
if (outOfScopeSection) {
  const hasRedirects = outOfScopeSection[1].includes('→') || outOfScopeSection[1].includes('->');
  if (!hasRedirects) {
    warn('Out of scope section has no redirects (→ spec-id) — agents may improvise without them');
  }
}

// ── Output ─────────────────────────────────────────────────────────────────────
const specId = specIdMatch ? specIdMatch[1] : path.basename(specPath);
console.log(`\n${BOLD}spec-lint${RESET} — ${DIM}${specId}${RESET}\n`);

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
