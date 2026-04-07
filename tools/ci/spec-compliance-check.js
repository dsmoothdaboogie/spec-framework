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

  const inlineTemplate = /template\s*:\s*`/.test(content) || /template\s*:\s*'/.test(content);

  const files = {
    ts:    { path: tsPath, content },
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

  return { entry: tsPath, files, header, inlineTemplate };
}

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
      if (/changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(ts)) return { status: 'pass' };
      return { status: 'fail', evidence: 'Missing ChangeDetectionStrategy.OnPush in @Component decorator' };
    },
  },
  {
    id: 'standalone',
    label: 'standalone: true',
    run(bundle) {
      const ts = bundle.files.ts.content;
      if (/standalone\s*:\s*true/.test(ts)) return { status: 'pass' };
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
      const ctorMatch = ts.match(/constructor\s*\(([^)]*)\)/);
      if (ctorMatch && ctorMatch[1].trim().length > 0) {
        const params = ctorMatch[1].trim();
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
      if (/\*ngIf/.test(tpl)) return { status: 'fail', evidence: 'Found *ngIf — use @if instead' };
      if (/\*ngFor/.test(tpl)) return { status: 'fail', evidence: 'Found *ngFor — use @for instead' };
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
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || /@use\s/.test(line)) continue;
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
      if (missing.length) return { status: 'fail', evidence: `Missing state(s): ${missing.join(', ')}` };
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

// ── Checklist parser ──────────────────────────────────────────────────────────
function parseChecklist(specContent) {
  const lines = specContent.split('\n');
  const items = [];
  let inChecklist = false;

  for (const line of lines) {
    if (/^##\s+\d+\.\s+Agent\s+[Cc]hecklist/i.test(line)) {
      inChecklist = true;
      continue;
    }
    if (inChecklist && /^##\s/.test(line)) break;

    if (inChecklist) {
      const m = line.match(/^[-*]\s*\[[ x]\]\s+(.+)/i);
      if (m) items.push(m[1].trim());
    }
  }

  return items;
}

// ── Checklist rule library ────────────────────────────────────────────────────

const CHECKLIST_RULES = [
  // ── Angular conventions (dedup with universal passes) ───────────────────────
  { id: 'onpush', pattern: /ChangeDetectionStrategy\.OnPush/i, universalPassId: 'onpush' },
  { id: 'standalone-component', pattern: /standalone\s+component/i, universalPassId: 'standalone' },
  { id: 'no-input-decorator', pattern: /no\s+`?@Input`?|input\(\)\s*\/\s*input\.required/i, universalPassId: 'signal-inputs' },
  { id: 'no-output-decorator', pattern: /no\s+`?@Output`?|output\(\)/i, universalPassId: 'signal-outputs' },
  { id: 'inject-fn', pattern: /inject\(\)|no\s+constructor\s+(injection|DI)/i, universalPassId: 'inject-pattern' },
  { id: 'control-flow-syntax', pattern: /`?@if`?\s*\/\s*`?@for`?|no\s+\*ng(If|For)|structural\s+directive/i, universalPassId: 'control-flow' },

  // ── Import restrictions ─────────────────────────────────────────────────────
  { id: 'no-material-imports', pattern: /no\s+direct\s+Material|DS\s+components?\s+only|no\s+.*@angular\/material/i, universalPassId: 'ds-imports' },
  {
    id: 'no-new-renderer',
    pattern: /pre-?built\s+renderer|no\s+new\s+renderer/i,
    check(bundle) {
      const ts = bundle.files.ts.content;
      if (/@Component[\s\S]*?CellRenderer|cellRenderer.*?Component.*?=.*?class/i.test(ts)) {
        return { status: 'fail', evidence: 'Appears to define a new cell renderer — use pre-built renderers' };
      }
      return { status: 'pass' };
    },
  },

  // ── Token / styling ─────────────────────────────────────────────────────────
  { id: 'no-hex-colors', pattern: /no\s+hardcoded|zero\s+hardcoded|semantic\s+token/i, universalPassId: 'token-usage' },
  {
    id: 'ds-tokens-used',
    pattern: /all\s+DS\s+tokens\s+used|DS\s+tokens/i,
    check(bundle) {
      if (!bundle.files.style) return { status: 'skip', evidence: 'No style file' };
      const style = bundle.files.style.content;
      if (/@use\s+['"].*token/i.test(style) || /var\(--/.test(style)) return { status: 'pass' };
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
    pattern: /null.*render|null.*[\u2014\u2013-]|dash\s+placeholder/i,
    check(bundle) {
      const all = bundle.files.ts.content + '\n' + getTemplateContent(bundle);
      if (/['\u0060"\u2018]\u2014['\u0060"\u2019]|['\u0060"]\u2014['\u0060"]|\?\?\s*['"\u0060][\u2014\u2013-]/.test(all) || /\u2014/.test(all)) {
        return { status: 'pass' };
      }
      return { status: 'fail', evidence: 'No null\u2192dash placeholder pattern found' };
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
      if (bundle.files.html || bundle.inlineTemplate) return { status: 'pass' };
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

// ── Checklist matching engine ─────────────────────────────────────────────────
function runChecklistRules(bundle, checklistItems, universalResults) {
  const universalMap = {};
  for (const r of universalResults) {
    universalMap[r.passId] = r;
  }

  return checklistItems.map(item => {
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

// ── Reporters ─────────────────────────────────────────────────────────────────
function reportPretty(allResults) {
  console.log(`\n${C.bold}spec-compliance-check${C.reset}\n`);
  console.log(`  ${C.dim}Scanning ${allResults.length} component(s) with @spec headers...${C.reset}\n`);

  let totalPass = 0, totalFail = 0, totalManual = 0;
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

    console.log(`\n  ${C.bold}Universal Passes${C.reset}`);
    for (const r of result.universal) {
      if (r.status === 'pass') { console.log(`    ${C.green}\u2713${C.reset} ${r.label}`); totalPass++; }
      else if (r.status === 'fail') { console.log(`    ${C.red}\u2717${C.reset} ${r.label}`); console.log(`      ${C.dim}\u2192 ${r.evidence}${C.reset}`); totalFail++; }
      else { console.log(`    ${C.dim}\u2014 ${r.label} (skipped)${C.reset}`); }
    }

    if (result.checklist.length) {
      console.log(`\n  ${C.bold}Spec Checklist (${result.checklist.length} items)${C.reset}`);
      for (const r of result.checklist) {
        if (r.status === 'pass') { console.log(`    ${C.green}\u2713${C.reset} ${r.item}`); totalPass++; }
        else if (r.status === 'fail') { console.log(`    ${C.red}\u2717${C.reset} ${r.item}`); console.log(`      ${C.dim}\u2192 ${r.evidence}${C.reset}`); totalFail++; }
        else { console.log(`    ${C.yellow}\u25CC${C.reset} ${r.item}`); console.log(`      ${C.dim}\u2192 manual review needed${C.reset}`); totalManual++; }
      }
    } else if (result.specNotFound) {
      console.log(`\n  ${C.yellow}\u26A0 Spec "${result.header.specId}" not found \u2014 checklist rules skipped${C.reset}`);
      console.log(`    ${C.dim}Use --spec-root to point to your spec-framework directory${C.reset}`);
    }

    const p = result.universal.filter(r => r.status === 'pass').length + result.checklist.filter(r => r.status === 'pass').length;
    const f = result.universal.filter(r => r.status === 'fail').length + result.checklist.filter(r => r.status === 'fail').length;
    const m = result.checklist.filter(r => r.status === 'manual').length;
    console.log(`\n  ${C.dim}${p} pass \u00B7 ${f} fail \u00B7 ${m} manual${C.reset}\n`);
  }

  console.log(`${C.bold}Summary:${C.reset} ${allResults.length} file(s) scanned`);
  if (filesWithFailures) console.log(`  ${C.red}\u2717 ${filesWithFailures} file(s) with failures${C.reset}`);
  const clean = allResults.length - filesWithFailures;
  if (clean) console.log(`  ${C.green}\u2713 ${clean} file(s) fully compliant${C.reset}`);
  if (totalManual) console.log(`  ${C.yellow}\u25CC ${totalManual} item(s) need manual review${C.reset}`);
  console.log('');

  return { totalFail, totalManual };
}

function reportGitHub(allResults) {
  let totalFail = 0, totalManual = 0;

  for (const result of allResults) {
    const rel = path.relative(process.cwd(), result.entry);
    let fileManual = 0;

    for (const r of result.universal) {
      if (r.status === 'fail') { console.log(`::error file=${rel},title=Spec Compliance [${r.passId}]::${r.evidence}`); totalFail++; }
    }
    for (const r of result.checklist) {
      if (r.status === 'fail') { console.log(`::error file=${rel},title=Spec Compliance [${r.ruleId}]::${r.evidence}`); totalFail++; }
      else if (r.status === 'manual') { fileManual++; totalManual++; }
    }
    if (fileManual) console.log(`::notice file=${rel},title=Spec Compliance [manual]::${fileManual} checklist item(s) require manual review`);
  }

  const totalPass = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'pass').length + r.checklist.filter(x => x.status === 'pass').length, 0);

  if (totalFail) console.log(`::error title=Spec Compliance Summary::${totalFail} failure(s) across ${allResults.length} file(s)`);
  else console.log(`::notice title=Spec Compliance Summary::All ${totalPass} checks passed across ${allResults.length} file(s)`);

  return { totalFail, totalManual };
}

function reportJson(allResults) {
  const totalPass = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'pass').length + r.checklist.filter(x => x.status === 'pass').length, 0);
  const totalFail = allResults.reduce((sum, r) =>
    sum + r.universal.filter(x => x.status === 'fail').length + r.checklist.filter(x => x.status === 'fail').length, 0);
  const totalManual = allResults.reduce((sum, r) =>
    sum + r.checklist.filter(x => x.status === 'manual').length, 0);

  const output = {
    summary: { files: allResults.length, pass: totalPass, fail: totalFail, manual: totalManual, totalChecks: totalPass + totalFail + totalManual },
    files: allResults.map(r => ({
      file: path.relative(process.cwd(), r.entry),
      spec: r.header.specId,
      version: r.header.specVersion,
      persona: r.header.personaId || null,
      universal: r.universal.map(u => ({ passId: u.passId, status: u.status, ...(u.evidence ? { evidence: u.evidence } : {}) })),
      checklist: r.checklist.map(c => ({ item: c.item, status: c.status, ...(c.ruleId ? { ruleId: c.ruleId } : {}), ...(c.evidence ? { evidence: c.evidence } : {}) })),
    })),
  };

  console.log(JSON.stringify(output, null, 2));
  return { totalFail, totalManual };
}

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
    let checklist = [];
    let specNotFound = false;

    const spec = resolveSpec(bundle.header.specId, registry);
    if (spec) {
      const items = parseChecklist(spec.content);
      checklist = runChecklistRules(bundle, items, universal);
    } else {
      specNotFound = true;
    }

    return { entry: bundle.entry, header: bundle.header, universal, checklist, specNotFound };
  });

  const { totalFail, totalManual } = FORMAT === 'github' ? reportGitHub(allResults)
                                   : FORMAT === 'json'   ? reportJson(allResults)
                                   : reportPretty(allResults);

  const shouldFail = FAIL_ON === 'error'   ? totalFail > 0
                   : FAIL_ON === 'warning' ? (totalFail + totalManual) > 0
                   : false;

  process.exit(shouldFail ? 1 : 0);
}

main();
