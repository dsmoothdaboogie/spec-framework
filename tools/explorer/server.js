#!/usr/bin/env node
/**
 * Spec Explorer — local dev server
 * Serves the explorer UI and provides a JSON API over the spec registry.
 *
 * Usage: node tools/explorer/server.js
 *    or: npm run explore
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT    = path.join(__dirname, '../..');
const PORT    = process.env.PORT || 4040;

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

// ── Run sync on startup ───────────────────────────────────────────────────────
console.log(`\n${BOLD}Spec Explorer${RESET}\n`);
console.log(`${DIM}Syncing registry...${RESET}`);
try {
  execSync('node tools/registry/registry-sync.js', { cwd: ROOT, stdio: 'pipe' });
  console.log(`${GREEN}✓ Registry synced${RESET}`);
} catch (e) {
  console.warn(`Registry sync warning: ${e.message}`);
}

// ── API handlers ──────────────────────────────────────────────────────────────
function getExplorerCache() {
  const cachePath = path.join(ROOT, 'tools/registry/explorer-cache.json');
  if (!fs.existsSync(cachePath)) return null;
  return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
}

function getSpecContent(specId) {
  const cache = getExplorerCache();
  if (!cache) return null;
  const entry = cache.specs.find(s => s.specId === specId);
  if (!entry) return null;
  const filePath = path.join(ROOT, entry.path);
  if (!fs.existsSync(filePath)) return null;
  return {
    ...entry,
    content: fs.readFileSync(filePath, 'utf-8'),
  };
}

function getAgentBlock(agentId) {
  const agentFiles = {
    'devin':   '.devin/knowledge.md',
    'copilot': '.github/copilot-instructions.md',
    'claude':  'CLAUDE.md',
    'cursor':  '.cursor/rules/spec-framework.mdc',
    'agents':  'AGENTS.md',
  };
  const filePath = agentFiles[agentId];
  if (!filePath) return null;
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath, 'utf-8');
  // Extract just the SPEC FRAMEWORK block
  const startMarker = '<!-- SPEC FRAMEWORK START';
  const endMarker   = '<!-- SPEC FRAMEWORK END';
  const start = content.lastIndexOf(startMarker);
  const end   = content.indexOf(endMarker, start);
  if (start !== -1 && end !== -1) {
    const endClose = content.indexOf('-->', end) + 3;
    return content.substring(start, endClose);
  }
  return content;
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── API routes ──────────────────────────────────────────────────────────────
  if (url.pathname === '/api/registry') {
    const cache = getExplorerCache();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(cache || { specs: [] }));
    return;
  }

  if (url.pathname === '/api/spec') {
    const specId = url.searchParams.get('id');
    const data   = specId ? getSpecContent(specId) : null;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return;
  }

  if (url.pathname === '/api/agent') {
    const agentId = url.searchParams.get('id');
    const block   = agentId ? getAgentBlock(agentId) : null;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ block }));
    return;
  }

  if (url.pathname === '/api/sync') {
    try {
      execSync('node tools/registry/registry-sync.js', { cwd: ROOT, stdio: 'pipe' });
      const cache = getExplorerCache();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, specs: cache?.specs?.length || 0 }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // ── Serve explorer UI ───────────────────────────────────────────────────────
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const uiPath = path.join(__dirname, 'index.html');
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(uiPath, 'utf-8'));
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`${GREEN}✓ Explorer running at ${CYAN}http://localhost:${PORT}${RESET}`);
  console.log(`${DIM}Serving ${getExplorerCache()?.specs?.length || 0} spec(s)${RESET}\n`);

  // Auto-open browser
  const open = process.platform === 'darwin' ? 'open'
             : process.platform === 'win32'  ? 'start'
             : 'xdg-open';
  try {
    execSync(`${open} http://localhost:${PORT}`, { stdio: 'ignore' });
  } catch (_) {}
});
