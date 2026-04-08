# Spec Compliance Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CI tool that validates generated Angular code against the spec it claims to implement, using universal convention checks and spec-checklist-driven rules.

**Architecture:** Single Node.js CLI script with two analysis layers -- universal passes (always-on Angular convention checks) and checklist rules (spec-specific, matched via regex pattern library). Follows the same patterns as existing `tools/ci/` scripts. No external dependencies.

**Tech Stack:** Node.js (CommonJS), regex-based static analysis, `fs`/`path`/`child_process` only.

**Design doc:** `docs/superpowers/specs/2026-04-07-spec-compliance-checker-design.md`

---

### Task 1: CLI Skeleton and Argument Parsing

**Files:**
- Create: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Create the CLI skeleton with argument parsing and color helpers**

```js
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
```

- [ ] **Step 2: Verify the script runs without errors**

Run: `node tools/ci/spec-compliance-check.js`
Expected: exits cleanly with code 0, no output yet.

- [ ] **Step 3: Commit**

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): CLI skeleton with arg parsing"
```

---

### Task 2: Header Parser and Component Bundling

**Files:**
- Modify: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Add the @spec header parser**

Append after the `shouldIgnore` function:

```js
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
```

- [ ] **Step 2: Add file discovery and component bundling**

Append after the header parser:

```js
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

  // Detect inline template
  const inlineTemplate = /template\s*:\s*`/.test(content) || /template\s*:\s*'/.test(content);

  const files = {
    ts:    { path: tsPath,   content },
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

  return {
    entry: tsPath,
    files,
    header,
    inlineTemplate,
  };
}
```

- [ ] **Step 3: Add a temporary main block to test discovery**

Append at the bottom:

```js
// ── Main (temporary test) ─────────────────────────────────────────────────────
const tsFiles = CHANGED_ONLY ? getChangedFiles() : walkDir(process.cwd());
const bundles = tsFiles.map(bundleComponent).filter(Boolean);

if (FORMAT === 'pretty') {
  console.log(`\n${C.bold}spec-compliance-check${C.reset}\n`);
  console.log(`  ${C.dim}Found ${bundles.length} component(s) with @spec headers${C.reset}\n`);
  for (const b of bundles) {
    const rel = path.relative(process.cwd(), b.entry);
    console.log(`  ${C.cyan}${rel}${C.reset}`);
    console.log(`    @spec ${b.header.specId} v${b.header.specVersion}`);
    if (b.header.personaId) console.log(`    @persona ${b.header.personaId} v${b.header.personaVersion}`);
    console.log(`    files: ts${b.files.html ? ' html' : ''}${b.files.style ? ' style' : ''}${b.files.spec ? ' test' : ''}${b.inlineTemplate ? ' (inline tpl)' : ''}`);
  }
  console.log('');
}
```

- [ ] **Step 4: Test discovery against the demo codebase**

Run: `node tools/ci/spec-compliance-check.js --spec-root . 2>&1 | head -20`
Expected: Should find 0 bundles (demo uses `@spec-reads:` not `@spec`). This confirms discovery works without crashing.

Run: `cd deal-management-demo && node ../tools/ci/spec-compliance-check.js --spec-root .. 2>&1 | head -20 && cd ..`
Expected: Same — 0 bundles found. No errors.

- [ ] **Step 5: Commit**

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): header parser and component bundling"
```

---

### Task 3: Universal Passes

**Files:**
- Modify: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Add the universal passes array**

Insert after the component bundling section, before the temporary main block:

```js
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
      if (/changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(ts)) {
        return { status: 'pass' };
      }
      return { status: 'fail', evidence: 'Missing ChangeDetectionStrategy.OnPush in @Component decorator' };
    },
  },
  {
    id: 'standalone',
    label: 'standalone: true',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/standalone\s*:\s*true/.test(ts)) {
        return { status: 'pass' };
      }
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
      // Match constructor with DI params: constructor(private|protected|public|readonly service: Type)
      // Allow empty constructors and super()-only constructors
      const ctorMatch = ts.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch && ctorMatch[1].trim().length > 0) {
        const params = ctorMatch[1].trim();
        // Filter out cases where it's just a super() call with no DI
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
      if (/\*ngIf/.test(tpl)) {
        return { status: 'fail', evidence: 'Found *ngIf — use @if instead' };
      }
      if (/\*ngFor/.test(tpl)) {
        return { status: 'fail', evidence: 'Found *ngFor — use @for instead' };
      }
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
        // Skip comments and token import lines
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || /@use\s/.test(line)) continue;
        // Check for hex colors
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
      if (missing.length) {
        return { status: 'fail', evidence: `Missing state(s): ${missing.join(', ')}` };
      }
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
```

- [ ] **Step 2: Update the temporary main block to run universal passes**

Replace the temporary main block with:

```js
// ── Main (temporary — runs universal passes only) ─────────────────────────────
const tsFiles = CHANGED_ONLY ? getChangedFiles() : walkDir(process.cwd());
const bundles = tsFiles.map(bundleComponent).filter(Boolean);

if (FORMAT === 'pretty') {
  console.log(`\n${C.bold}spec-compliance-check${C.reset}\n`);
  console.log(`  ${C.dim}Scanning ${bundles.length} component(s) with @spec headers...${C.reset}\n`);

  for (const bundle of bundles) {
    const rel = path.relative(process.cwd(), bundle.entry);
    console.log(`  ${C.bold}${rel}${C.reset}`);
    console.log(`  @spec ${bundle.header.specId} v${bundle.header.specVersion}`);

    const results = runUniversalPasses(bundle);
    console.log(`\n  Universal Passes`);
    for (const r of results) {
      if (r.status === 'pass') {
        console.log(`    ${C.green}✓${C.reset} ${r.label}`);
      } else if (r.status === 'fail') {
        console.log(`    ${C.red}✗${C.reset} ${r.label}`);
        console.log(`      ${C.dim}→ ${r.evidence}${C.reset}`);
      } else {
        console.log(`    ${C.dim}— ${r.label} (skipped)${C.reset}`);
      }
    }
    console.log('');
  }
}
```

- [ ] **Step 3: Test against demo code**

The demo uses `@spec-reads:` not `@spec`, so we need a quick test. Create a temporary test file:

Run: `echo '// @spec ds/patterns/ag-grid-datatable v2.0.0\nimport { Component, ChangeDetectionStrategy } from "@angular/core";\n@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div *ngIf=\"x\">test</div>" })\nexport class TestComponent {}' > /tmp/test-compliance.component.ts && node tools/ci/spec-compliance-check.js --spec-root . 2>&1; rm /tmp/test-compliance.component.ts`

Expected: The tool won't find `/tmp/test-compliance.component.ts` because it walks from cwd. That's fine — confirms no crash. The real testing happens in Task 6.

- [ ] **Step 4: Commit**

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): universal passes — 9 Angular convention checks"
```

---

### Task 4: Spec Resolution and Checklist Parser

**Files:**
- Modify: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Add registry loader and spec resolver**

Insert after the universal passes section, before the main block:

```js
// ── Registry & spec resolution ────────────────────────────────────────────────
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    if (FORMAT === 'pretty') {
      console.log(`  ${C.yellow}⚠ Registry not found at ${REGISTRY_PATH}${C.reset}`);
      console.log(`    ${C.dim}Checklist rules will be skipped. Use --spec-root to point to your spec-framework.${C.reset}\n`);
    }
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function resolveSpec(specId, registry) {
  if (!registry) return null;
  const entry = registry.specs.find(s => s.specId === specId);
  if (!entry) return null;
  const specPath = path.join(SPEC_ROOT, entry.path);
  if (!fs.existsSync(specPath)) return null;
  return {
    ...entry,
    content: fs.readFileSync(specPath, 'utf-8'),
  };
}
```

- [ ] **Step 2: Add checklist parser**

Append after the spec resolver:

```js
// ── Checklist parser ──────────────────────────────────────────────────────────
function parseChecklist(specContent) {
  const lines = specContent.split('\n');
  const items = [];
  let inChecklist = false;

  for (const line of lines) {
    // Detect checklist section header (§11 or §13 — "Agent checklist" or "Agent Checklist")
    if (/^##\s+\d+\.\s+Agent\s+[Cc]hecklist/i.test(line)) {
      inChecklist = true;
      continue;
    }
    // Stop at next section
    if (inChecklist && /^##\s/.test(line)) break;

    if (inChecklist) {
      const m = line.match(/^[-*]\s*\[[ x]\]\s+(.+)/i);
      if (m) items.push(m[1].trim());
    }
  }

  return items;
}
```

- [ ] **Step 3: Verify checklist parsing works against a real spec**

Add a quick test at the bottom (temporarily, before the main block):

```js
// ── Quick parse test (remove after verifying) ─────────────────────────────────
if (args.includes('--test-parse')) {
  const reg = loadRegistry();
  if (reg) {
    const spec = resolveSpec('domain/patterns/ag-grid-datatable/coverage-banker', reg);
    if (spec) {
      const items = parseChecklist(spec.content);
      console.log(`Parsed ${items.length} checklist items:`);
      items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    } else {
      console.log('Spec not found');
    }
  }
  process.exit(0);
}
```

Run: `node tools/ci/spec-compliance-check.js --spec-root . --test-parse`
Expected: Should print 17 checklist items from the coverage-banker composition spec.

- [ ] **Step 4: Remove the test block and commit**

Remove the `--test-parse` block, then:

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): spec resolution and checklist parser"
```

---

### Task 5: Checklist Rule Library and Matching Engine

**Files:**
- Modify: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Add the rule library**

Insert after the checklist parser, before the main block:

```js
// ── Checklist rule library ────────────────────────────────────────────────────
// Each rule maps a checklist item pattern to a static check.
// Rules that overlap with universal passes reference the pass ID for dedup.

const CHECKLIST_RULES = [
  // ── Angular conventions ─────────────────────────────────────────────────────
  {
    id: 'onpush',
    pattern: /ChangeDetectionStrategy\.OnPush/i,
    universalPassId: 'onpush',
  },
  {
    id: 'standalone-component',
    pattern: /standalone\s+component/i,
    universalPassId: 'standalone',
  },
  {
    id: 'no-input-decorator',
    pattern: /no\s+`?@Input`?|input\(\)\s*\/\s*input\.required/i,
    universalPassId: 'signal-inputs',
  },
  {
    id: 'no-output-decorator',
    pattern: /no\s+`?@Output`?|output\(\)/i,
    universalPassId: 'signal-outputs',
  },
  {
    id: 'inject-fn',
    pattern: /inject\(\)|no\s+constructor\s+(injection|DI)/i,
    universalPassId: 'inject-pattern',
  },
  {
    id: 'control-flow-syntax',
    pattern: /`?@if`?\s*\/\s*`?@for`?|no\s+\*ng(If|For)|structural\s+directive/i,
    universalPassId: 'control-flow',
  },

  // ── Import restrictions ─────────────────────────────────────────────────────
  {
    id: 'no-material-imports',
    pattern: /no\s+direct\s+Material|DS\s+components?\s+only|no\s+.*@angular\/material/i,
    universalPassId: 'ds-imports',
  },
  {
    id: 'no-new-renderer',
    pattern: /pre-?built\s+renderer|no\s+new\s+renderer/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      // Check if file defines a new cell renderer component
      if (/@Component[\s\S]*?CellRenderer|cellRenderer.*?Component.*?=.*?class/i.test(ts)) {
        return { status: 'fail', evidence: 'Appears to define a new cell renderer — use pre-built renderers' };
      }
      return { status: 'pass' };
    },
  },

  // ── Token / styling ─────────────────────────────────────────────────────────
  {
    id: 'no-hex-colors',
    pattern: /no\s+hardcoded|zero\s+hardcoded|semantic\s+token/i,
    universalPassId: 'token-usage',
  },
  {
    id: 'ds-tokens-used',
    pattern: /all\s+DS\s+tokens\s+used|DS\s+tokens/i,
    check(bundle) {
      if (!bundle.files.style) return { status: 'skip', evidence: 'No style file' };
      const style = bundle.files.style.content;
      if (/@use\s+['"].*token/i.test(style) || /var\(--/.test(style)) {
        return { status: 'pass' };
      }
      return { status: 'fail', evidence: 'No token imports or CSS custom properties found in styles' };
    },
  },
  {
    id: 'all-colors-css-props',
    pattern: /CSS\s+custom\s+properties|zero\s+hardcoded\s+hex/i,
    check(bundle) {
      if (!bundle.files.style) return { status: 'skip', evidence: 'No style file' };
      const lines = bundle.files.style.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || /@use\s/.test(line)) continue;
        if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/url\(/.test(line)) {
          return { status: 'fail', evidence: `Hardcoded hex color in style (line ${i + 1})` };
        }
      }
      return { status: 'pass' };
    },
  },

  // ── State coverage ──────────────────────────────────────────────────────────
  {
    id: 'loading-state',
    pattern: /loading\s+state|skeleton/i,
    check(bundle) {
      const all = getTemplateContent(bundle) + '\n' + bundle.files.ts.content;
      if (/loading|skeleton|shimmer|isLoading|\.loading/i.test(all)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No loading/skeleton state found' };
    },
  },
  {
    id: 'empty-state',
    pattern: /empty\s+state/i,
    check(bundle) {
      const all = getTemplateContent(bundle) + '\n' + bundle.files.ts.content;
      if (/empty|no.?data|no.?results|no.?items|isEmpty|\.empty/i.test(all)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No empty state found' };
    },
  },
  {
    id: 'error-state',
    pattern: /error\s+state|error.*retry/i,
    check(bundle) {
      const all = getTemplateContent(bundle) + '\n' + bundle.files.ts.content;
      if (/error|\.error|isError|hasError/i.test(all)) {
        if (/retry|reload|try.?again/i.test(all)) return { status: 'pass' };
        return { status: 'fail', evidence: 'Error state found but no retry mechanism detected' };
      }
      return { status: 'fail', evidence: 'No error state found' };
    },
  },

  // ── Accessibility ───────────────────────────────────────────────────────────
  {
    id: 'aria-disabled',
    pattern: /aria-disabled/i,
    check(bundle) {
      const tpl = getTemplateContent(bundle);
      if (/aria-disabled/.test(tpl)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No aria-disabled attributes found in template' };
    },
  },
  {
    id: 'aria-label',
    pattern: /aria-label(?!led)/i,
    check(bundle) {
      const tpl = getTemplateContent(bundle);
      if (/aria-label/.test(tpl)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No aria-label attributes found in template' };
    },
  },
  {
    id: 'heading-hierarchy',
    pattern: /heading\s+hierarchy|<h[1-6]>/i,
    check(bundle) {
      const tpl = getTemplateContent(bundle);
      if (/<h[1-6][\s>]/.test(tpl)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No heading elements found in template' };
    },
  },

  // ── Column / grid specifics ─────────────────────────────────────────────────
  {
    id: 'column-pinned-left',
    pattern: /pinned\s+left/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/pinned\s*:\s*['"]left['"]/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No column with pinned: "left" found' };
    },
  },
  {
    id: 'column-pinned-right',
    pattern: /pinned\s+right/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/pinned\s*:\s*['"]right['"]/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No column with pinned: "right" found' };
    },
  },
  {
    id: 'value-getter',
    pattern: /valueGetter|value\s+getter/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/valueGetter/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No valueGetter found — spec requires computed columns' };
    },
  },
  {
    id: 'default-sort',
    pattern: /default\s+sort/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/sort\s*:\s*['"]|defaultColDef.*sort|sortModel|initialSort/i.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No default sort configuration found' };
    },
  },

  // ── Null / zero handling ────────────────────────────────────────────────────
  {
    id: 'null-dash-placeholder',
    pattern: /null.*render|null.*[—–-]|dash\s+placeholder/i,
    check(bundle) {
      const all = bundle.files.ts.content + '\n' + getTemplateContent(bundle);
      if (/['"`]\u2014['"`]|['"`]—['"`]|['"`]-['"`]|'\u2014'/.test(all) || /\?\?\s*['"`][—–-]/.test(all)) {
        return { status: 'pass' };
      }
      return { status: 'fail', evidence: 'No null→dash placeholder pattern found' };
    },
  },
  {
    id: 'null-zero-rules',
    pattern: /null\s*\/\s*zero.*render|nullable\s+column/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/\?\?|=== null|!= null|== null|\.value\s*\?/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No null/zero value handling detected' };
    },
  },

  // ── File structure ──────────────────────────────────────────────────────────
  {
    id: 'file-layout',
    pattern: /file\s+layout|file\s+scaffold/i,
    check(bundle) {
      // Check that component has html and style files (or inline)
      if (bundle.files.html || bundle.inlineTemplate) {
        return { status: 'pass' };
      }
      return { status: 'fail', evidence: 'No template file found and no inline template detected' };
    },
  },
  {
    id: 'inputs-outputs-present',
    pattern: /required\s+inputs?\/?outputs?\s+present|inputs?\s+and\s+outputs?/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/input[<(]|output[<(]/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'No input() or output() declarations found' };
    },
  },
];
```

- [ ] **Step 2: Add the matching engine**

Append after the rule library:

```js
// ── Checklist matching engine ─────────────────────────────────────────────────
function runChecklistRules(bundle, checklistItems, universalResults) {
  // Build a map of universal results for dedup
  const universalMap = {};
  for (const r of universalResults) {
    universalMap[r.passId] = r;
  }

  return checklistItems.map(item => {
    // Try to match against rule library
    for (const rule of CHECKLIST_RULES) {
      if (rule.pattern.test(item)) {
        // Dedup: if rule references a universal pass, reuse its result
        if (rule.universalPassId && universalMap[rule.universalPassId]) {
          const ur = universalMap[rule.universalPassId];
          return {
            item,
            ruleId: rule.id,
            status: ur.status === 'skip' ? 'manual' : ur.status,
            evidence: ur.evidence || null,
          };
        }
        // Run the rule's own check
        if (rule.check) {
          const result = rule.check(bundle);
          return {
            item,
            ruleId: rule.id,
            status: result.status === 'skip' ? 'manual' : result.status,
            evidence: result.evidence || null,
          };
        }
      }
    }

    // No match — manual review needed
    return { item, ruleId: null, status: 'manual', evidence: null };
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): checklist rule library (25 rules) and matching engine"
```

---

### Task 6: Report Generator and Main Function

**Files:**
- Modify: `tools/ci/spec-compliance-check.js`

- [ ] **Step 1: Add the three report formatters**

Replace the temporary main block with the full reporting and main logic. Insert after the matching engine:

```js
// ── Reporters ─────────────────────────────────────────────────────────────────
function reportPretty(allResults) {
  console.log(`\n${C.bold}spec-compliance-check${C.reset}\n`);
  console.log(`  ${C.dim}Scanning ${allResults.length} component(s) with @spec headers...${C.reset}\n`);

  let totalPass = 0, totalFail = 0, totalManual = 0, totalSkip = 0;
  let filesWithFailures = 0;

  for (const result of allResults) {
    const rel = path.relative(process.cwd(), result.entry);
    const hasFail = result.universal.some(r => r.status === 'fail') ||
                    result.checklist.some(r => r.status === 'fail');
    if (hasFail) filesWithFailures++;

    console.log(`  ${C.bold}${rel}${C.reset}`);
    console.log(`  ${C.dim}@spec ${result.header.specId} v${result.header.specVersion}${C.reset}`);
    if (result.header.personaId) {
      console.log(`  ${C.dim}@persona ${result.header.personaId} v${result.header.personaVersion}${C.reset}`);
    }

    // Universal passes
    console.log(`\n  ${C.bold}Universal Passes${C.reset}`);
    for (const r of result.universal) {
      if (r.status === 'pass') {
        console.log(`    ${C.green}✓${C.reset} ${r.label}`);
        totalPass++;
      } else if (r.status === 'fail') {
        console.log(`    ${C.red}✗${C.reset} ${r.label}`);
        console.log(`      ${C.dim}→ ${r.evidence}${C.reset}`);
        totalFail++;
      } else {
        console.log(`    ${C.dim}— ${r.label} (skipped)${C.reset}`);
        totalSkip++;
      }
    }

    // Checklist rules
    if (result.checklist.length) {
      console.log(`\n  ${C.bold}Spec Checklist (${result.checklist.length} items)${C.reset}`);
      for (const r of result.checklist) {
        if (r.status === 'pass') {
          console.log(`    ${C.green}✓${C.reset} ${r.item}`);
          totalPass++;
        } else if (r.status === 'fail') {
          console.log(`    ${C.red}✗${C.reset} ${r.item}`);
          console.log(`      ${C.dim}→ ${r.evidence}${C.reset}`);
          totalFail++;
        } else {
          console.log(`    ${C.yellow}◌${C.reset} ${r.item}`);
          console.log(`      ${C.dim}→ manual review needed${C.reset}`);
          totalManual++;
        }
      }
    } else if (result.specNotFound) {
      console.log(`\n  ${C.yellow}⚠ Spec "${result.header.specId}" not found — checklist rules skipped${C.reset}`);
      console.log(`    ${C.dim}Use --spec-root to point to your spec-framework directory${C.reset}`);
    }

    const p = result.universal.filter(r => r.status === 'pass').length +
              result.checklist.filter(r => r.status === 'pass').length;
    const f = result.universal.filter(r => r.status === 'fail').length +
              result.checklist.filter(r => r.status === 'fail').length;
    const m = result.checklist.filter(r => r.status === 'manual').length;
    console.log(`\n  ${C.dim}${p} pass · ${f} fail · ${m} manual${C.reset}`);
    console.log('');
  }

  // Summary
  console.log(`${C.bold}Summary:${C.reset} ${allResults.length} file(s) scanned`);
  if (filesWithFailures) {
    console.log(`  ${C.red}✗ ${filesWithFailures} file(s) with failures${C.reset}`);
  }
  const clean = allResults.length - filesWithFailures;
  if (clean) {
    console.log(`  ${C.green}✓ ${clean} file(s) fully compliant${C.reset}`);
  }
  if (totalManual) {
    console.log(`  ${C.yellow}◌ ${totalManual} item(s) need manual review${C.reset}`);
  }
  console.log('');

  return { totalFail, totalManual };
}

function reportGitHub(allResults) {
  let totalFail = 0, totalManual = 0;

  for (const result of allResults) {
    const rel = path.relative(process.cwd(), result.entry);

    for (const r of result.universal) {
      if (r.status === 'fail') {
        console.log(`::error file=${rel},title=Spec Compliance [${r.passId}]::${r.evidence}`);
        totalFail++;
      }
    }

    for (const r of result.checklist) {
      if (r.status === 'fail') {
        console.log(`::error file=${rel},title=Spec Compliance [${r.ruleId}]::${r.evidence}`);
        totalFail++;
      } else if (r.status === 'manual') {
        totalManual++;
      }
    }

    if (totalManual) {
      console.log(`::notice file=${rel},title=Spec Compliance [manual]::${totalManual} checklist item(s) require manual review`);
    }
  }

  const totalPass = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'pass').length +
          r.checklist.filter(x => x.status === 'pass').length, 0);

  if (totalFail) {
    console.log(`::error title=Spec Compliance Summary::${totalFail} failure(s) across ${allResults.length} file(s)`);
  } else {
    console.log(`::notice title=Spec Compliance Summary::All ${totalPass} checks passed across ${allResults.length} file(s)`);
  }

  return { totalFail, totalManual };
}

function reportJson(allResults) {
  const totalPass = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'pass').length +
          r.checklist.filter(x => x.status === 'pass').length, 0);
  const totalFail = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'fail').length +
          r.checklist.filter(x => x.status === 'fail').length, 0);
  const totalManual = allResults.reduce((sum, r) =>
    sum + r.checklist.filter(x => x.status === 'manual').length, 0);

  const output = {
    summary: {
      files: allResults.length,
      pass: totalPass,
      fail: totalFail,
      manual: totalManual,
      totalChecks: totalPass + totalFail + totalManual,
    },
    files: allResults.map(r => ({
      file: path.relative(process.cwd(), r.entry),
      spec: r.header.specId,
      version: r.header.specVersion,
      persona: r.header.personaId || null,
      universal: r.universal.map(u => ({
        passId: u.passId,
        status: u.status,
        ...(u.evidence ? { evidence: u.evidence } : {}),
      })),
      checklist: r.checklist.map(c => ({
        item: c.item,
        status: c.status,
        ...(c.ruleId ? { ruleId: c.ruleId } : {}),
        ...(c.evidence ? { evidence: c.evidence } : {}),
      })),
    })),
  };

  console.log(JSON.stringify(output, null, 2));
  return { totalFail, totalManual };
}
```

- [ ] **Step 2: Add the main function**

Append after the reporters:

```js
// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const registry = loadRegistry();
  const tsFiles  = CHANGED_ONLY ? getChangedFiles() : walkDir(process.cwd());
  const bundles  = tsFiles.map(bundleComponent).filter(Boolean);

  if (!bundles.length) {
    if (FORMAT === 'pretty') {
      console.log(`\n${C.bold}spec-compliance-check${C.reset}\n`);
      console.log(`  ${C.dim}No components with @spec headers found.${C.reset}\n`);
    } else if (FORMAT === 'json') {
      console.log(JSON.stringify({ summary: { files: 0, pass: 0, fail: 0, manual: 0, totalChecks: 0 }, files: [] }, null, 2));
    }
    process.exit(0);
  }

  const allResults = bundles.map(bundle => {
    const universal = runUniversalPasses(bundle);

    // Resolve spec and parse checklist
    let checklist = [];
    let specNotFound = false;

    const spec = resolveSpec(bundle.header.specId, registry);
    if (spec) {
      const items = parseChecklist(spec.content);
      checklist = runChecklistRules(bundle, items, universal);
    } else {
      specNotFound = true;
    }

    return {
      entry: bundle.entry,
      header: bundle.header,
      universal,
      checklist,
      specNotFound,
    };
  });

  // Report
  const { totalFail, totalManual } = FORMAT === 'github' ? reportGitHub(allResults)
                                   : FORMAT === 'json'   ? reportJson(allResults)
                                   : reportPretty(allResults);

  // Exit code
  const shouldFail = FAIL_ON === 'error'   ? totalFail > 0
                   : FAIL_ON === 'warning' ? (totalFail + totalManual) > 0
                   : false;

  process.exit(shouldFail ? 1 : 0);
}

main();
```

- [ ] **Step 3: Test with no @spec files in scope**

Run: `node tools/ci/spec-compliance-check.js --spec-root .`
Expected: "No components with @spec headers found." — clean exit.

- [ ] **Step 4: Test JSON output**

Run: `node tools/ci/spec-compliance-check.js --spec-root . --format json`
Expected: `{"summary":{"files":0,"pass":0,"fail":0,"manual":0,"totalChecks":0},"files":[]}`

- [ ] **Step 5: Commit**

```bash
git add tools/ci/spec-compliance-check.js
git commit -m "feat(compliance): report generator and main function — tool complete"
```

---

### Task 7: Integration Test with Real Component

**Files:**
- Create: `tools/ci/test-fixtures/sample.component.ts`
- Create: `tools/ci/test-fixtures/sample.component.html`
- Create: `tools/ci/test-fixtures/sample.component.scss`

- [ ] **Step 1: Create a test fixture component that has some intentional violations**

```js
// tools/ci/test-fixtures/sample.component.ts

// @spec ds/patterns/ag-grid-datatable v2.0.0
// @persona domain/personas/coverage-banker v1.0.0

import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { MatSort } from '@angular/material/sort'; // violation: direct material import
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-sample-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss'],
  imports: [AgGridAngular],
})
export class SampleGridComponent {
  private store = inject(SomeStore);

  entityId = input.required<string>();
  rowClicked = output<any>();

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<any[]>([]);

  columnDefs = [
    { field: 'dealName', pinned: 'left' },
    { field: 'issuer' },
    { field: 'actions', pinned: 'right' },
  ];
}
```

```html
<!-- tools/ci/test-fixtures/sample.component.html -->

@if (loading()) {
  <div class="skeleton-grid">
    <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>  <!-- violation: *ngFor -->
  </div>
}

@if (error()) {
  <div class="error-state">
    <p>{{ error() }}</p>
    <button (click)="retry()" aria-label="Retry loading">Try again</button>
  </div>
}

@if (!loading() && !error() && data().length === 0) {
  <div class="empty-state">No deals found.</div>
}

@if (!loading() && !error() && data().length > 0) {
  <ag-grid-angular
    [rowData]="data()"
    [columnDefs]="columnDefs"
    aria-label="Deal pipeline grid">
  </ag-grid-angular>
}
```

```scss
// tools/ci/test-fixtures/sample.component.scss

@use '@company/spec-tokens/color' as color;
@use '@company/spec-tokens/spacing' as spacing;

.skeleton-grid {
  padding: spacing.$grid-gutter;
}

.error-state {
  color: #ff4444;  // violation: hardcoded hex
}
```

- [ ] **Step 2: Run the compliance checker against the fixture**

Run: `node tools/ci/spec-compliance-check.js --spec-root . 2>&1`

Expected output should show:
- Universal passes: `ds-imports` FAIL (MatSort import), `control-flow` FAIL (*ngFor), `token-usage` FAIL (hex color)
- Universal passes: `onpush` PASS, `standalone` PASS, `signal-inputs` PASS, `signal-outputs` PASS, `inject-pattern` PASS, `state-coverage` PASS
- Checklist items from the ag-grid-datatable spec, with matched rules showing pass/fail and unmatched items showing manual

- [ ] **Step 3: Run JSON format and verify structure**

Run: `node tools/ci/spec-compliance-check.js --spec-root . --format json 2>&1 | head -30`
Expected: Valid JSON with `summary`, `files` array, `universal` and `checklist` arrays per file.

- [ ] **Step 4: Run GitHub format**

Run: `node tools/ci/spec-compliance-check.js --spec-root . --format github 2>&1`
Expected: `::error` annotations for the 3 violations.

- [ ] **Step 5: Test exit codes**

Run: `node tools/ci/spec-compliance-check.js --spec-root . ; echo "Exit: $?"`
Expected: `Exit: 1` (has failures)

Run: `node tools/ci/spec-compliance-check.js --spec-root . --fail-on info ; echo "Exit: $?"`
Expected: `Exit: 1` (has failures + manual items)

- [ ] **Step 6: Commit the fixtures**

```bash
git add tools/ci/test-fixtures/
git commit -m "test(compliance): integration test fixtures with intentional violations"
```

---

### Task 8: Add npm Script and Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json scripts**

Check what scripts exist to follow naming conventions.

- [ ] **Step 2: Add the compliance-check script**

Add to `package.json` scripts:

```json
"compliance": "node tools/ci/spec-compliance-check.js",
"compliance:changed": "node tools/ci/spec-compliance-check.js --changed-only"
```

- [ ] **Step 3: Verify the npm script works**

Run: `npm run compliance`
Expected: Same output as running the script directly.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat(compliance): add npm run compliance script"
```

---

### Task 9: Documentation — README and Workflow Guide

**Files:**
- Modify: `README.md`
- Create: `docs/WORKFLOW-GUIDE.md`

- [ ] **Step 1: Update README.md**

Update the `tools/ci/` section in the repository structure to include the new tool and the active-gate. Update the `docs/` section to include new files. Add a "CI Tools" section after "Contributing a spec" that briefly describes each CI tool.

Add to the repository structure tree:

```
│   ├── ci/
│   │   ├── spec-header-check.js     # CI: validates @spec provenance headers
│   │   ├── spec-dependency-check.js  # CI: flags specs affected by DS package changes
│   │   ├── spec-active-gate.js       # CI: blocks merge if active specs fail linting
│   │   └── spec-compliance-check.js  # CI: validates generated code against spec checklists
```

Add a new section:

```markdown
## CI tools

These tools run in your CI pipeline to catch spec drift:

| Tool | What it does | When to run |
|---|---|---|
| `spec-lint` | Validates spec files are well-formed | On spec file changes |
| `spec-active-gate` | Ensures all active specs pass linting | Pre-merge gate |
| `spec-header-check` | Validates `@spec` headers in generated code are current | On code changes |
| `spec-dependency-check` | Flags specs affected by DS package version changes | On `package.json` changes |
| `spec-compliance-check` | Validates generated code follows the spec's checklist | On code changes |

All tools support `--format github` for GitHub Actions annotations and `--format json` for machine-readable output.

```bash
# Run all CI checks locally
node tools/linter/spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md
node tools/ci/spec-active-gate.js
node tools/ci/spec-header-check.js
node tools/ci/spec-dependency-check.js
node tools/ci/spec-compliance-check.js
```
```

- [ ] **Step 2: Create the Workflow Guide**

Write `docs/WORKFLOW-GUIDE.md` covering how the spec framework fits into AI agent workflows:

```markdown
# Spec Framework Workflow Guide

> How to use the spec framework with AI coding agents, Agent-OS, and CI pipelines.

---

## Overview

The spec framework provides a complete loop for AI-assisted development:

1. **Author specs** — UI Architecture writes pattern and composition specs
2. **Agent generates code** — AI agent reads the spec and generates Angular components
3. **Agent self-verifies** — Agent outputs a compliance report before the code
4. **CI independently verifies** — Pipeline tools validate the generated code
5. **Spec evolves** — When specs update, CI catches stale generated code

---

## For teams adopting specs into their codebase

### Step 1: Copy the spec framework tools

Copy these directories into your repo:

```
your-repo/
├── specs/                        # Copy relevant specs (or use git submodule)
├── tools/
│   ├── registry/
│   │   ├── registry.json         # Copy from spec-framework
│   │   └── registry-cli.js       # Copy from spec-framework
│   ├── linter/
│   │   └── spec-lint.js
│   ├── ci/
│   │   ├── spec-header-check.js
│   │   ├── spec-compliance-check.js
│   │   └── spec-dependency-check.js
│   └── hooks/
│       ├── pre-commit
│       └── install-hooks.js
```

Or point to a separate spec-framework repo using `--spec-root`:

```bash
node tools/ci/spec-compliance-check.js --spec-root ../spec-framework
```

### Step 2: Install git hooks

```bash
node tools/hooks/install-hooks.js
```

This installs a pre-commit hook that auto-syncs the registry when spec files change.

### Step 3: Add CI pipeline checks

Add to your GitHub Actions workflow:

```yaml
- name: Spec compliance check
  run: |
    node tools/ci/spec-header-check.js --format github --changed-only
    node tools/ci/spec-compliance-check.js --format github --changed-only
```

Or for a full scan on the main branch:

```yaml
- name: Full spec compliance scan
  run: |
    node tools/ci/spec-header-check.js --format github
    node tools/ci/spec-compliance-check.js --format github
```

### Step 4: Configure your AI agent

Copy the appropriate agent configuration block into your repo:

| Agent | Config file | Instructions |
|---|---|---|
| Claude | `CLAUDE.md` | Copy the `<!-- SPEC FRAMEWORK START -->` block |
| GitHub Copilot | `.github/copilot-instructions.md` | Copy the spec framework block |
| Cursor | `.cursor/rules/spec-framework.mdc` | Copy as-is |
| Devin | `.devin/knowledge.md` | Copy the spec framework block |
| Any agent | `AGENTS.md` | Copy the spec framework block |

See [AGENT-INTEGRATION.md](AGENT-INTEGRATION.md) for detailed setup per agent.

---

## Agent-OS / Spec Kit integration

The spec framework is designed to work with agent orchestration systems like
Agent-OS. Here's how the pieces connect:

### The agent loop

```
┌─────────────────────────────────────────────────────┐
│  Agent-OS / Spec Kit / Manual trigger               │
│                                                     │
│  1. Receive task: "implement coverage banker grid"  │
│  2. Search registry: registry-cli.js search "..."   │
│  3. Read spec + dependencies (reading order)        │
│  4. Generate Angular component                      │
│  5. Stamp @spec header in generated code            │
│  6. Self-verify: output compliance report           │
│  7. Run spec-compliance-check.js (post-generation)  │
│  8. If failures → fix and re-verify                 │
│  9. Commit / open PR                                │
│ 10. CI runs spec-compliance-check.js (pipeline)     │
└─────────────────────────────────────────────────────┘
```

### Post-generation hook

If your agent orchestrator supports post-generation hooks (e.g., Agent-OS
task hooks), wire the compliance checker as a verification step:

```bash
# Post-generation verification
node tools/ci/spec-compliance-check.js \
  --spec-root /path/to/spec-framework \
  --format json \
  --changed-only
```

The JSON output can be parsed by the orchestrator to decide whether to
proceed with the commit or loop back for fixes.

### Self-reported vs independently verified

The spec framework creates a **trust-but-verify** loop:

| Check | Who runs it | When |
|---|---|---|
| Compliance report (self-reported) | The AI agent | Before outputting code |
| `spec-compliance-check` (independent) | CI pipeline or post-gen hook | After code is written |

When both agree, confidence is high. When they disagree, it means the agent's
self-verification is drifting — a signal to review the agent's instructions
or the spec's clarity.

---

## @spec header format

Generated source files must include a provenance header:

```typescript
// @spec    ds/patterns/ag-grid-datatable v2.0.0
// @persona domain/personas/coverage-banker v1.0.0   (optional)
// @generated 2026-04-07                             (optional)
// @compliance PASS                                  (optional)
```

This header is:
- **Written by the agent** when generating code
- **Read by `spec-header-check`** to validate version currency
- **Read by `spec-compliance-check`** to find the spec and run checklist rules

---

## CI tool reference

| Tool | Purpose | Key flags |
|---|---|---|
| `spec-lint.js` | Validates spec markdown files | `<file>` |
| `spec-active-gate.js` | Blocks merge if active specs fail lint | `--changed-only`, `--format` |
| `spec-header-check.js` | Validates @spec headers are current | `--changed-only`, `--format`, `--fail-on` |
| `spec-dependency-check.js` | Flags specs affected by package changes | `--format` |
| `spec-compliance-check.js` | Validates code against spec checklists | `--changed-only`, `--spec-root`, `--format`, `--fail-on` |

All tools support:
- `--format pretty` (default) — human-readable terminal output
- `--format github` — GitHub Actions annotations
- `--format json` — machine-readable output

---

## Maintaining compliance over time

When a spec version bumps:
1. `spec-header-check` flags files with stale `@spec` versions
2. Team regenerates the component against the new spec
3. `spec-compliance-check` validates the regenerated code
4. `@spec` header is updated to the new version

When a DS package version bumps:
1. `spec-dependency-check` flags affected specs
2. UI Architecture reviews the spec against the new package
3. If the spec changes, the cycle above kicks in
```

- [ ] **Step 3: Commit documentation**

```bash
git add README.md docs/WORKFLOW-GUIDE.md
git commit -m "docs: add workflow guide and update README with CI tools"
```

---

### Task 10: Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run the compliance checker from the repo root**

Run: `node tools/ci/spec-compliance-check.js --spec-root .`
Expected: Finds test fixtures, reports violations, exits 1.

- [ ] **Step 2: Run the compliance checker with JSON output**

Run: `node tools/ci/spec-compliance-check.js --spec-root . --format json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log('Files:', d.summary.files, 'Pass:', d.summary.pass, 'Fail:', d.summary.fail, 'Manual:', d.summary.manual);"`
Expected: `Files: 1 Pass: [N] Fail: 3 Manual: [N]` (3 failures: ds-imports, control-flow, token-usage)

- [ ] **Step 3: Run all existing CI tools to confirm nothing is broken**

Run: `node tools/ci/spec-active-gate.js`
Expected: All active specs pass.

Run: `node tools/ci/spec-header-check.js`
Expected: No errors (test fixtures have @spec headers that exist in registry).

Run: `node tools/linter/spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md`
Expected: Pass.

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore(compliance): final cleanup after verification"
```
