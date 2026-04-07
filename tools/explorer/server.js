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

const ROOT    = path.join(__dirname, '../..');
const PORT    = process.env.PORT || 4040;

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

console.log(`\n${BOLD}Spec Explorer${RESET}\n`);

// ── Registry loader ──────────────────────────────────────────────────────────
function loadRegistry() {
  // Try explorer-cache first, fall back to registry.json
  const cachePath    = path.join(ROOT, 'tools/registry/explorer-cache.json');
  const registryPath = path.join(ROOT, 'tools/registry/registry.json');

  if (fs.existsSync(cachePath)) {
    try { return JSON.parse(fs.readFileSync(cachePath, 'utf-8')); } catch (_) {}
  }
  if (fs.existsSync(registryPath)) {
    try { return JSON.parse(fs.readFileSync(registryPath, 'utf-8')); } catch (_) {}
  }
  return { specs: [] };
}

// ── API handlers ─────────────────────────────────────────────────────────────
function getSpecContent(specId) {
  const registry = loadRegistry();
  const entry = registry.specs.find(s => s.specId === specId);
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

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname === '/api/registry') {
    const data = loadRegistry();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
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

  // Serve explorer UI
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
  const registry = loadRegistry();
  console.log(`${GREEN}✓ Explorer running at ${CYAN}http://localhost:${PORT}${RESET}`);
  console.log(`${DIM}Serving ${registry.specs?.length || 0} spec(s)${RESET}\n`);

  const open = process.platform === 'darwin' ? 'open'
             : process.platform === 'win32'  ? 'start'
             : 'xdg-open';
  try {
    require('child_process').execSync(`${open} http://localhost:${PORT}`, { stdio: 'ignore' });
  } catch (_) {}
});
