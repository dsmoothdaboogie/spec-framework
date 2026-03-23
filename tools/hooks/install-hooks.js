#!/usr/bin/env node
/**
 * install-hooks.js
 * Installs the spec framework git hooks into .git/hooks/
 *
 * Usage: node tools/hooks/install-hooks.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '../..');
const HOOKS_SRC = path.join(__dirname);
const HOOKS_DST = path.join(ROOT, '.git/hooks');

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

console.log(`\n${BOLD}install-hooks${RESET}\n`);

if (!fs.existsSync(HOOKS_DST)) {
  console.error(`${RED}✗ .git/hooks not found — are you in the repo root?${RESET}\n`);
  process.exit(1);
}

const hooks = fs.readdirSync(HOOKS_SRC).filter(f => !f.endsWith('.js'));

if (!hooks.length) {
  console.log(`${DIM}No hook files found in tools/hooks/${RESET}\n`);
  process.exit(0);
}

for (const hook of hooks) {
  const src = path.join(HOOKS_SRC, hook);
  const dst = path.join(HOOKS_DST, hook);

  if (fs.existsSync(dst)) {
    const existing = fs.readFileSync(dst, 'utf-8');
    if (existing.includes('SPEC FRAMEWORK')) {
      console.log(`  ${DIM}~ ${hook} already installed${RESET}`);
      continue;
    }
    // Append to existing hook rather than overwrite
    const content = fs.readFileSync(src, 'utf-8');
    const appended = existing.trimEnd() + '\n\n# SPEC FRAMEWORK\n' + content.split('\n').slice(3).join('\n');
    fs.writeFileSync(dst, appended);
    fs.chmodSync(dst, '755');
    console.log(`  ${GREEN}+ ${hook} appended to existing hook${RESET}`);
  } else {
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, '755');
    console.log(`  ${GREEN}+ ${hook} installed${RESET}`);
  }
}

console.log(`\n${GREEN}✓ Hooks installed${RESET}\n`);
console.log(`${DIM}Registry will auto-sync whenever spec files are committed.${RESET}\n`);
