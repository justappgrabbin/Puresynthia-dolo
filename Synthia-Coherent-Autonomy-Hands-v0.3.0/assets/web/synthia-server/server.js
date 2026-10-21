// SYNTHIA ADMIN SERVER v1.0
// Private control cockpit. Not pretty. Clear.
// Flashlight in the server basement.

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const os = require('os');
const { spawn, execFileSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files
app.use(express.static('public', { index: false }));
app.use('/apps-static', express.static(path.join(__dirname, 'apps')));
app.use('/tools-static', express.static(path.join(__dirname, 'tools')));
app.use('/bundles-static', express.static(path.join(__dirname, 'bundles')));
app.use('/studio', express.static(path.join(__dirname, 'apps', 'synthia-sovereign-studio', 'dist', 'public')));
app.use('/autoload-static', express.static(path.join(__dirname, 'public', 'autoload')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/terminal' });

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'system-state.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.SYNTHIA_ADMIN_TOKEN || null;
const TRIDENT_TOKEN = process.env.TRIDENT_TOKEN || process.env.TRIDENT_API_KEY || null;
const DEFAULT_TRIDENT_URL = process.env.TRIDENT_URL || 'http://127.0.0.1:8787';
const CATALOG_FILE = path.join(__dirname, 'apps', 'catalog.json');
const SYNTHIA_RULES_FILE = path.join(__dirname, 'config', 'synthia-rules.json');
const WATCH_DIR = process.env.SYNTHIA_WATCH_DIR || path.join(__dirname, 'watch-inbox');
const SANDBOX_DIR = process.env.SYNTHIA_SANDBOX_DIR || path.join(__dirname, 'builder-sandbox');
const AUTOLOAD_DIR = process.env.SYNTHIA_AUTOLOAD_DIR || path.join(__dirname, 'public', 'autoload');
const BUILDER_PROJECTS_DIR = path.join(SANDBOX_DIR, 'projects');
const BUILDER_REPORTS_DIR = path.join(SANDBOX_DIR, 'reports');
const BUILDER_UPDATES_DIR = path.join(SANDBOX_DIR, 'updates');
const BUILDER_ROLLBACKS_DIR = path.join(SANDBOX_DIR, 'rollbacks');
const CODE_ROLLBACKS_DIR = path.join(BUILDER_ROLLBACKS_DIR, 'code');
const GITHUB_APPROVAL_DIR = path.join(SANDBOX_DIR, 'github-approval');
const BUILDER_POLL_MS = parseInt(process.env.SYNTHIA_BUILDER_POLL_MS || '5000', 10);
const PHONE_INBOX_DIR = process.env.SYNTHIA_PHONE_INBOX || path.join(os.homedir(), 'storage', 'downloads', 'SynthiaInbox');
const PHONE_SYNC_CONFIG_FILE = process.env.SYNTHIA_PHONE_SYNC_CONFIG || path.join(__dirname, 'config', 'phone-sync.json');
const SYNC_STATE_FILE = path.join(DATA_DIR, 'phone-sync-state.json');
const SYNC_INBOX_DIR = process.env.SYNTHIA_SYNC_INBOX || path.join(DATA_DIR, 'sync-inbox');
const SYNC_POLL_MS = Math.max(15000, parseInt(process.env.SYNTHIA_SYNC_POLL_MS || '30000', 10));


// Pure Synthia v0.4 autonomata residence — separate from MCP/build server.
const PURE_SYNTHIA_DIR = process.env.PURE_SYNTHIA_DIR || path.join(__dirname, 'pure-synthia');
const PURE_SYNTHIA_DAEMON = path.join(PURE_SYNTHIA_DIR, 'runtime', 'daemon.mjs');
const PURE_SYNTHIA_STATE_DIR = process.env.SYNTHIA_STATE_DIR || path.join(DATA_DIR, 'pure-synthia');
let pureSynthiaDaemon = null;
let pureSynthiaStopping = false;
let pureSynthiaRestartTimer = null;

function pureSynthiaStatus(){
  const statusFile = path.join(PURE_SYNTHIA_STATE_DIR, 'daemon-status.json');
  let daemonStatus = null;
  try { daemonStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8')); } catch (_) {}
  return {
    available: fs.existsSync(PURE_SYNTHIA_DAEMON),
    running: Boolean(pureSynthiaDaemon && pureSynthiaDaemon.exitCode === null),
    pid: pureSynthiaDaemon?.pid || null,
    state_dir: PURE_SYNTHIA_STATE_DIR,
    daemon: daemonStatus
  };
}

function startPureSynthiaDaemon(){
  if (pureSynthiaStopping || pureSynthiaDaemon || !fs.existsSync(PURE_SYNTHIA_DAEMON)) return;
  ensureDir(PURE_SYNTHIA_STATE_DIR);
  pureSynthiaDaemon = spawn(process.execPath, [PURE_SYNTHIA_DAEMON], {
    cwd: PURE_SYNTHIA_DIR,
    env: { ...process.env, SYNTHIA_STATE_DIR: PURE_SYNTHIA_STATE_DIR },
    stdio: ['ignore', 'inherit', 'inherit']
  });
  console.log(`   Pure Synthia daemon: pid ${pureSynthiaDaemon.pid}`);
  pureSynthiaDaemon.on('exit', (code, signal) => {
    console.log(`   Pure Synthia daemon exited: code=${code} signal=${signal || ''}`);
    pureSynthiaDaemon = null;
    if (!pureSynthiaStopping) {
      clearTimeout(pureSynthiaRestartTimer);
      pureSynthiaRestartTimer = setTimeout(startPureSynthiaDaemon, 3000);
    }
  });
}

function stopPureSynthiaDaemon(){
  pureSynthiaStopping = true;
  clearTimeout(pureSynthiaRestartTimer);
  if (pureSynthiaDaemon && pureSynthiaDaemon.exitCode === null) pureSynthiaDaemon.kill('SIGTERM');
}



function ensureDataDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
function persistState() { try { ensureDataDir(); fs.writeFileSync(STATE_FILE, JSON.stringify(SYSTEM, null, 2)); } catch (err) { console.error('Persist failed:', err.message); } }
function loadState() { try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (err) { console.error('Load state failed:', err.message); } return null; }
function loadCatalog() { try { if (fs.existsSync(CATALOG_FILE)) return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')); } catch (err) { console.error('Catalog load failed:', err.message); } return { apps: [] }; }
function loadSynthiaRules() { try { if (fs.existsSync(SYNTHIA_RULES_FILE)) return JSON.parse(fs.readFileSync(SYNTHIA_RULES_FILE, 'utf8')); } catch (err) { console.error('Rules load failed:', err.message); } return { policy: {}, routes: [] }; }
function loadJsonFile(file, fallback = null) { try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { console.error('JSON load failed:', file, err.message); } return fallback; }
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function joinUrl(base, suffix) {
  return `${String(base || '').replace(/\/+$/, '')}/${String(suffix || '').replace(/^\/+/, '')}`;
}
function tridentHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...(TRIDENT_TOKEN ? { Authorization: `Bearer ${TRIDENT_TOKEN}`, 'x-trident-token': TRIDENT_TOKEN } : {}),
    ...extra
  };
}
async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}
function safeRelativePath(input) {
  const cleaned = String(input || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..') || path.isAbsolute(cleaned)) return null;
  return cleaned;
}
function resolveInside(root, rel) {
  const safe = safeRelativePath(rel);
  if (!safe) return null;
  const resolved = path.resolve(root, safe);
  const rootResolved = path.resolve(root);
  return resolved === rootResolved || resolved.startsWith(rootResolved + path.sep) ? resolved : null;
}
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return next();
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '') || req.query.admin_token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'admin token required' });
  next();
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM STATE — The truth of what's happening
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_SYSTEM = {
  synthia: { status: 'online', since: Date.now(), last_pulse: Date.now() },
  render: { status: 'unknown', url: process.env.RENDER_EXTERNAL_URL || null, last_check: null },
  trident: { status: 'unknown', endpoint: DEFAULT_TRIDENT_URL, last_check: null, last_response: null },
  mcp: { status: 'offline', server: null, port: 3001, since: null },
  supabase: { status: 'unknown', url: process.env.SUPABASE_URL || null, last_check: null },
  agents: {
    kimi: { status: 'unknown', type: 'ai', registered: false, last_seen: null, api_key: null },
    chatgpt: { status: 'unknown', type: 'ai', registered: false, last_seen: null, api_key: null }
  },
  bodies: {
    alexis: { status: 'offline', identity: 'adaya', last_seen: null, device: null },
    joe: { status: 'offline', identity: 'joe', last_seen: null, device: null }
  },
  events: [],
  artifacts: [],
  inboxes: { kimi: [], chatgpt: [], alexis: [], joe: [], cynthia: [] },
  implementations: [],
  mobile_captures: [],
  bridge: { status: 'offline', last_handoff: null, kimi_to_chatgpt: 0, chatgpt_to_kimi: 0 },
  builder: {
    status: 'idle',
    watcher: 'stopped',
    watch_dir: WATCH_DIR,
    sandbox_dir: SANDBOX_DIR,
    autoload_dir: AUTOLOAD_DIR,
    latest_promoted: null,
    jobs: [],
    seen: {},
    last_scan: null,
    last_error: null
  },
  last_error: null,
  last_routed_message: null
};
const SYSTEM = Object.assign(DEFAULT_SYSTEM, loadState() || {});
SYSTEM.synthia.status = 'online';
SYSTEM.synthia.last_pulse = Date.now();
SYSTEM.builder ||= DEFAULT_SYSTEM.builder;
SYSTEM.builder.watch_dir = WATCH_DIR;
SYSTEM.builder.sandbox_dir = SANDBOX_DIR;
SYSTEM.builder.autoload_dir = AUTOLOAD_DIR;
SYSTEM.builder.jobs ||= [];
SYSTEM.builder.seen ||= {};

// ═══════════════════════════════════════════════════════════════════
// EVENT LOG — Everything that happens
// ═══════════════════════════════════════════════════════════════════

function logEvent(type, source, message, detail = null) {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    type,      // 'system', 'mcp', 'trident', 'agent', 'route', 'error', 'user'
    source,    // who did it
    message,   // what happened
    detail     // extra data
  };
  SYSTEM.events.unshift(event);
  if (SYSTEM.events.length > 500) SYSTEM.events.pop(); // Keep last 500

  // Broadcast to all terminal clients
  broadcastTerminal({ type: 'event', event });

  if (type === 'error') {
    SYSTEM.last_error = event;
  }
  persistState();
}


function ensureQueues() {
  SYSTEM.artifacts ||= [];
  SYSTEM.inboxes ||= { kimi: [], chatgpt: [], alexis: [], joe: [], cynthia: [] };
  SYSTEM.implementations ||= [];
  SYSTEM.mobile_captures ||= [];
  SYSTEM.bridge ||= { status: 'offline', last_handoff: null, kimi_to_chatgpt: 0, chatgpt_to_kimi: 0 };
  for (const key of ['kimi','chatgpt','alexis','joe','cynthia']) SYSTEM.inboxes[key] ||= [];
}

function enqueue(endpoint, item) {
  ensureQueues();
  const key = String(endpoint || 'cynthia').toLowerCase();
  SYSTEM.inboxes[key] ||= [];
  SYSTEM.inboxes[key].unshift(item);
  if (SYSTEM.inboxes[key].length > 200) SYSTEM.inboxes[key].pop();
}

function normalizeArtifact(input, sourceKind = 'artifact') {
  ensureQueues();
  const id = input.id || `${sourceKind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const artifact = {
    id,
    source_kind: sourceKind,
    from_agent: input.from_agent || input.from || input.source || 'unknown',
    created_by: input.created_by || input.identity || input.user || 'unknown',
    target_agent: input.target_agent || input.to || 'chatgpt',
    artifact_type: input.artifact_type || input.type || sourceKind,
    target_area: input.target_area || 'unclassified',
    title: input.title || `${sourceKind} from ${input.from_agent || input.from || input.source || 'unknown'}`,
    content: input.content || input.text || input.message || '',
    instructions: input.instructions || input.instruction || null,
    capture: input.capture || null,
    status: 'queued_for_chatgpt',
    created_at: Date.now(),
    updated_at: Date.now()
  };
  SYSTEM.artifacts.unshift(artifact);
  if (SYSTEM.artifacts.length > 500) SYSTEM.artifacts.pop();
  enqueue(artifact.target_agent, { kind: 'artifact', artifact_id: artifact.id, status: artifact.status, title: artifact.title, from: artifact.from_agent, created_at: artifact.created_at });
  SYSTEM.bridge.status = 'online';
  SYSTEM.bridge.last_handoff = artifact;
  if (artifact.from_agent === 'kimi' && artifact.target_agent === 'chatgpt') SYSTEM.bridge.kimi_to_chatgpt += 1;
  if (artifact.from_agent === 'chatgpt' && artifact.target_agent === 'kimi') SYSTEM.bridge.chatgpt_to_kimi += 1;
  persistState();
  return artifact;
}

// ═══════════════════════════════════════════════════════════════════
// TERMINAL — WebSocket for real-time command output
// ═══════════════════════════════════════════════════════════════════

const terminalClients = new Set();

function broadcastTerminal(payload) {
  const msg = JSON.stringify(payload);
  terminalClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  terminalClients.add(ws);
  logEvent('system', 'terminal', 'Admin terminal connected');

  // Send current state
  ws.send(JSON.stringify({
    type: 'init',
    system: SYSTEM,
    events: SYSTEM.events.slice(0, 50)
  }));

  ws.on('message', (data) => {
    try {
      const cmd = JSON.parse(data);
      if (cmd.type === 'exec') {
        executeTerminalCommand(cmd.command, ws);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    terminalClients.delete(ws);
    logEvent('system', 'terminal', 'Admin terminal disconnected');
  });
});

function executeTerminalCommand(command, ws) {
  logEvent('user', 'terminal', `> ${command}`);

  // Built-in commands
  if (command === 'status') {
    ws.send(JSON.stringify({ type: 'output', output: formatStatus() }));
  } else if (command === 'wake mcp') {
    wakeMCP();
    ws.send(JSON.stringify({ type: 'output', output: 'MCP wake initiated...' }));
  } else if (command === 'check trident') {
    checkTrident();
    ws.send(JSON.stringify({ type: 'output', output: 'Checking Trident...' }));
  } else if (command === 'agents') {
    ws.send(JSON.stringify({ type: 'output', output: formatAgents() }));
  } else if (command === 'bodies') {
    ws.send(JSON.stringify({ type: 'output', output: formatBodies() }));
  } else if (command === 'events') {
    ws.send(JSON.stringify({ type: 'output', output: formatEvents() }));
  } else if (command === 'help') {
    ws.send(JSON.stringify({ type: 'output', output: formatHelp() }));
  } else if (command === 'clear') {
    ws.send(JSON.stringify({ type: 'clear' }));
  } else if (command === 'kill mcp') {
    killMCP();
    ws.send(JSON.stringify({ type: 'output', output: 'MCP stopped.' }));
  } else {
    ws.send(JSON.stringify({ type: 'error', output: 'Shell execution is disabled on the admin cockpit. Use built-in commands only.' }));
  }
}

// ═══════════════════════════════════════════════════════════════════
// MCP SERVER — Bootstrap and manage
// ═══════════════════════════════════════════════════════════════════

let mcpProcess = null;

function wakeMCP() {
  if (SYSTEM.mcp.status === 'online') return { status: 'already_running', mcp: SYSTEM.mcp };
  SYSTEM.mcp.status = 'online';
  SYSTEM.mcp.server = 'in-process-message-bus';
  SYSTEM.mcp.since = Date.now();
  logEvent('mcp', 'system', 'Local MCP message bus online', { transport: 'http+websocket', role: 'message-passer' });
  broadcastTerminal({ type: 'mcp_status', status: 'online' });
  persistState();
  return { status: 'online', mcp: SYSTEM.mcp };
}

function killMCP() {
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
  }
  SYSTEM.mcp.status = 'offline';
  SYSTEM.mcp.since = null;
  logEvent('mcp', 'system', 'MCP server stopped');
  persistState();
}

// ═══════════════════════════════════════════════════════════════════
// TRIDENT — Check connection
// ═══════════════════════════════════════════════════════════════════

async function checkTrident() {
  SYSTEM.trident.last_check = Date.now();
  SYSTEM.trident.endpoint ||= DEFAULT_TRIDENT_URL;

  if (!SYSTEM.trident.endpoint) {
    SYSTEM.trident.status = 'no_endpoint';
    logEvent('trident', 'system', 'No Trident endpoint configured');
    persistState();
    return SYSTEM.trident;
  }

  try {
    const result = await fetchJson(joinUrl(SYSTEM.trident.endpoint, '/health'), { headers: tridentHeaders(), timeoutMs: 5000 });
    SYSTEM.trident.status = result.ok ? 'connected' : 'error';
    SYSTEM.trident.last_response = result;
    logEvent(result.ok ? 'trident' : 'error', 'system', result.ok ? 'Trident connected' : `Trident health returned ${result.status}`, { endpoint: SYSTEM.trident.endpoint, result });
  } catch (err) {
    SYSTEM.trident.status = 'disconnected';
    SYSTEM.trident.last_response = { error: err.message };
    logEvent('error', 'trident', `Trident check failed: ${err.message}`, { endpoint: SYSTEM.trident.endpoint });
  }
  persistState();
  return SYSTEM.trident;
}

async function callTrident(pathname, payload = {}) {
  SYSTEM.trident.endpoint ||= DEFAULT_TRIDENT_URL;
  if (!SYSTEM.trident.endpoint) throw new Error('TRIDENT_URL not configured');
  const result = await fetchJson(joinUrl(SYSTEM.trident.endpoint, pathname), {
    method: 'POST',
    headers: tridentHeaders(),
    body: JSON.stringify(payload),
    timeoutMs: 30000
  });
  if (!result.ok) throw new Error(`Trident ${pathname} failed: ${result.status} ${JSON.stringify(result.body)}`);
  SYSTEM.trident.status = 'connected';
  SYSTEM.trident.last_check = Date.now();
  SYSTEM.trident.last_response = result;
  persistState();
  return result.body;
}

// ═══════════════════════════════════════════════════════════════════
// AGENT REGISTRY
// ═══════════════════════════════════════════════════════════════════

function registerAgent(name, config) {
  const agent = SYSTEM.agents[name.toLowerCase()];
  if (!agent) {
    logEvent('error', 'admin', `Unknown agent: ${name}`);
    return { error: 'Unknown agent' };
  }

  agent.registered = true;
  agent.status = 'registered';
  agent.api_key = config.api_key || null;
  agent.last_seen = Date.now();

  logEvent('agent', 'admin', `${name} registered`, { name });
  persistState();
  return { success: true, agent };
}

// ═══════════════════════════════════════════════════════════════════
// FORMATTERS — Human-readable output
// ═══════════════════════════════════════════════════════════════════

function formatStatus() {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Synthia Server: ${SYSTEM.synthia.status} (${timeSince(SYSTEM.synthia.since)})
  Render:         ${SYSTEM.render.status}
  Trident:          ${SYSTEM.trident.status}
  MCP:              ${SYSTEM.mcp.status} ${SYSTEM.mcp.since ? '(' + timeSince(SYSTEM.mcp.since) + ')' : ''}
  Supabase:         ${SYSTEM.supabase.status}

  AGENTS:
    Kimi:     ${SYSTEM.agents.kimi.status} ${SYSTEM.agents.kimi.registered ? '(registered)' : '(unregistered)'}
    ChatGPT:  ${SYSTEM.agents.chatgpt.status} ${SYSTEM.agents.chatgpt.registered ? '(registered)' : '(unregistered)'}

  BODIES:
    Alexis:   ${SYSTEM.bodies.alexis.status} ${SYSTEM.bodies.alexis.last_seen ? '(' + timeSince(SYSTEM.bodies.alexis.last_seen) + ')' : ''}
    Joe:      ${SYSTEM.bodies.joe.status} ${SYSTEM.bodies.joe.last_seen ? '(' + timeSince(SYSTEM.bodies.joe.last_seen) + ')' : ''}

  Last Error:       ${SYSTEM.last_error ? SYSTEM.last_error.message : 'none'}
  Last Message:     ${SYSTEM.last_routed_message ? SYSTEM.last_routed_message.substring(0, 50) + '...' : 'none'}
  Events:           ${SYSTEM.events.length} total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatAgents() {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AGENT REGISTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${Object.entries(SYSTEM.agents).map(([name, a]) => 
    `${name.padEnd(10)} ${a.status.padEnd(12)} ${a.registered ? 'registered' : 'unregistered'}`
  ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatBodies() {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BODY REGISTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${Object.entries(SYSTEM.bodies).map(([name, b]) => 
    `${name.padEnd(10)} ${b.status.padEnd(12)} identity=${b.identity}`
  ).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatEvents(limit = 20) {
  const recent = SYSTEM.events.slice(0, limit);
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RECENT EVENTS (${SYSTEM.events.length} total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${recent.map(e => 
    `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.type.padEnd(8)} ${e.source.padEnd(10)} ${e.message}`
  ).join('\n') || 'No events'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatHelp() {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TERMINAL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  status          Show full system status
  wake mcp        Start MCP server
  kill mcp        Stop MCP server
  check trident   Verify Trident connection
  agents          List registered agents
  bodies          List connected bodies
  events          Show recent events
  clear           Clear terminal
  help            Show this help

  Shell execution is disabled; use the listed Synthia commands.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function timeSince(timestamp) {
  if (!timestamp) return 'never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

// ═══════════════════════════════════════════════════════════════════
// AUTONOMOUS BUILDER — watched ingest + sandbox promotion
// ═══════════════════════════════════════════════════════════════════

let builderTimer = null;
const builderQueue = [];
let builderBusy = false;

function ensureBuilderDirs() {
  [WATCH_DIR, SANDBOX_DIR, AUTOLOAD_DIR, BUILDER_PROJECTS_DIR, BUILDER_REPORTS_DIR, BUILDER_UPDATES_DIR, BUILDER_ROLLBACKS_DIR, CODE_ROLLBACKS_DIR, GITHUB_APPROVAL_DIR].forEach(ensureDir);
  const indexPath = path.join(AUTOLOAD_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthia Autoload</title></head><body style="font-family:sans-serif;padding:24px;background:#060709;color:#edf2f7"><h1>Synthia Autoload</h1><p>No promoted build yet. Drop code into watch-inbox or use the builder admin panel.</p></body></html>');
  }
}

function allowedCodeTarget(rel) {
  const safe = safeRelativePath(rel);
  if (!safe) return null;
  const blocked = /(^|\/)(node_modules|\.git|data|logs|bundles|vendor-repos)(\/|$)/;
  if (blocked.test(safe)) return null;
  const ext = path.extname(safe).toLowerCase();
  const allowed = new Set(['.js', '.json', '.html', '.css', '.md', '.sh', '.py', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.txt', '.yml', '.yaml', '.xml', '.gradle', '.java', '.kt', '.toml', '.env', '.properties']);
  return allowed.has(ext) ? safe : null;
}

function extractJsonObject(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  const raw = String(text);
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
  }
  return null;
}

function normalizeFileChanges(payload) {
  const files = Array.isArray(payload?.files) ? payload.files : [];
  return files.map(file => ({
    path: allowedCodeTarget(file.path || file.file || file.name),
    content: String(file.content ?? file.body ?? ''),
    mode: file.mode === 'delete' ? 'delete' : 'write'
  })).filter(file => file.path);
}

function applyCodeChanges({ files, reason = 'manual', live = false }) {
  ensureBuilderDirs();
  if (!files.length) throw new Error('no valid file changes supplied');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const patchId = `code-change-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
  const backupDir = path.join(CODE_ROLLBACKS_DIR, patchId);
  const targetRoot = live ? __dirname : path.join(BUILDER_UPDATES_DIR, patchId);
  ensureDir(backupDir);
  ensureDir(targetRoot);
  const applied = [];

  for (const file of files) {
    const target = resolveInside(targetRoot, file.path);
    if (!target) throw new Error(`invalid target path: ${file.path}`);
    const backup = resolveInside(backupDir, file.path);
    if (!backup) throw new Error(`invalid backup path: ${file.path}`);
    if (fs.existsSync(target)) {
      ensureDir(path.dirname(backup));
      fs.cpSync(target, backup, { recursive: fs.statSync(target).isDirectory() });
    }
    if (file.mode === 'delete') {
      if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
    } else {
      ensureDir(path.dirname(target));
      fs.writeFileSync(target, file.content);
    }
    applied.push({ path: file.path, mode: file.mode, backup: fs.existsSync(backup) ? backup : null, target });
  }

  const manifest = { id: patchId, reason, live, target_root: targetRoot, backup_dir: backupDir, applied, created_at: Date.now() };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

function listCodeRollbacks() {
  ensureBuilderDirs();
  return fs.readdirSync(CODE_ROLLBACKS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const dir = path.join(CODE_ROLLBACKS_DIR, entry.name);
      const manifestPath = path.join(dir, 'manifest.json');
      let manifest = { id: entry.name, backup_dir: dir };
      try { if (fs.existsSync(manifestPath)) manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch {}
      return { ...manifest, mtime: fs.statSync(dir).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function rollbackCodeChange(id = null) {
  const chosen = id ? listCodeRollbacks().find(item => item.id === id) : listCodeRollbacks()[0];
  if (!chosen) return null;
  const targetRoot = chosen.live ? __dirname : chosen.target_root;
  for (const item of chosen.applied || []) {
    const target = resolveInside(targetRoot, item.path);
    if (!target) continue;
    if (item.backup && fs.existsSync(item.backup)) {
      ensureDir(path.dirname(target));
      fs.cpSync(item.backup, target, { recursive: fs.statSync(item.backup).isDirectory() });
    } else if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
  return chosen;
}

function saveAutoloadRollback(reason = 'manual') {
  ensureBuilderDirs();
  const currentDir = path.join(AUTOLOAD_DIR, 'current');
  if (!fs.existsSync(currentDir)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BUILDER_ROLLBACKS_DIR, `${stamp}_${String(reason).replace(/[^A-Za-z0-9._-]/g, '_')}`);
  fs.cpSync(currentDir, target, { recursive: true });
  return { path: target, name: path.basename(target), created_at: Date.now(), reason };
}

function listRollbacks() {
  ensureBuilderDirs();
  return fs.readdirSync(BUILDER_ROLLBACKS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const full = path.join(BUILDER_ROLLBACKS_DIR, entry.name);
      return { name: entry.name, path: full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function rollbackAutoload(name = null) {
  const rollbacks = listRollbacks();
  const chosen = name ? rollbacks.find(item => item.name === name) : rollbacks[0];
  if (!chosen) return null;
  const currentDir = path.join(AUTOLOAD_DIR, 'current');
  if (fs.existsSync(currentDir)) fs.rmSync(currentDir, { recursive: true, force: true });
  fs.cpSync(chosen.path, currentDir, { recursive: true });
  const indexPath = path.join(currentDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.writeFileSync(path.join(AUTOLOAD_DIR, 'index.html'), '<!doctype html><meta http-equiv="refresh" content="0; url=/autoload-static/current/index.html"><a href="/autoload-static/current/index.html">Open rolled back build</a>');
  }
  SYSTEM.builder.latest_promoted = { job_id: `rollback_${Date.now()}`, source: chosen.name, promoted_at: Date.now(), url: '/autoload', rollback: true };
  persistState();
  return chosen;
}

function runGit(args) {
  return execFileSync('git', args, { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function pythonInvocation(script, args = []) {
  if (process.env.PYTHON) return { cmd: process.env.PYTHON, args: [script, ...args] };
  if (process.platform === 'win32') return { cmd: 'py', args: ['-3', script, ...args] };
  return { cmd: 'python3', args: [script, ...args] };
}

function callLcm(payload = {}) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, 'tools', 'lcm_bridge.py');
    if (!fs.existsSync(script)) return reject(new Error('LCM bridge not found'));
    const py = pythonInvocation(script, []);
    const child = spawn(py.cmd, py.args, { cwd: __dirname, shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += String(data); });
    child.stderr.on('data', data => { stderr += String(data); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || stdout || `LCM exited ${code}`));
      try { resolve(JSON.parse(stdout)); }
      catch (err) { reject(new Error(`LCM returned invalid JSON: ${err.message}`)); }
    });
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function routeBySynthiaRules(message) {
  const rules = loadSynthiaRules();
  const text = String(message || '').toLowerCase();
  for (const rule of rules.routes || []) {
    const all = rule.all || [];
    const any = rule.what || rule.any || [];
    const allMatch = all.every(term => text.includes(String(term).toLowerCase()));
    const anyMatch = any.length === 0 || any.some(term => text.includes(String(term).toLowerCase()));
    if (allMatch && anyMatch) return { rule, policy: rules.policy || {} };
  }
  return { rule: { id: 'chat_request', action: 'chat', reply: 'I am here. Tell me what you want to build, fix, or check.' }, policy: rules.policy || {}, voice: rules.voice || {} };
}

function plainEnglishInstruction() {
  return [
    'Use plain everyday English.',
    'Do not use Human Design language, gates, solar plexus terms, archetypes, dimensional math, occult framing, or internal system jargon.',
    'Do not mention LCM, WH dimensions, Klein, Diseminer, Autoling, organs, or Trident unless the admin directly asks about backend internals.',
    'When code work is needed, say what can be changed, what needs admin approval, and what button or panel to use.'
  ].join(' ');
}

function plainEnglishFromBody(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body.text === 'string') return body.text;
  if (typeof body.reply === 'string') return body.reply;
  if (typeof body.message === 'string') return body.message;
  if (typeof body.output === 'string') return body.output;
  if (typeof body.result === 'string') return body.result;
  return '';
}

function localSynthiaReply(message, lcm, routed = null) {
  const response = lcm?.result?.response || '';
  const route = routed || routeBySynthiaRules(message);
  if (route.rule?.reply) {
    return route.rule.reply;
  }
  if (response) return response;
  return 'I am here. Tell me what you want to build, fix, upload, or check.';
}

function gitSyncStatus() {
  try {
    if (!fs.existsSync(path.join(__dirname, '.git'))) return { enabled: false, message: 'This install is not connected to a GitHub repo yet.' };
    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    let remote = '';
    try { remote = runGit(['config', '--get', 'remote.origin.url']); } catch {}
    let incoming = 'unknown';
    try {
      incoming = runGit(['rev-list', '--count', `HEAD..origin/${branch}`]) || '0';
    } catch {}
    return {
      enabled: true,
      branch,
      remote,
      incoming: Number(incoming) || 0,
      dirty: !!runGit(['status', '--porcelain']),
      approvals_dir: GITHUB_APPROVAL_DIR,
      auto_pull: process.env.SYNTHIA_GITHUB_AUTO_PULL === '1'
    };
  } catch (err) {
    return { enabled: false, error: err.message };
  }
}

function pushBuilderJob(job) {
  SYSTEM.builder.jobs.unshift(job);
  if (SYSTEM.builder.jobs.length > 100) SYSTEM.builder.jobs.pop();
  persistState();
}

function listWatchCandidates(dir = WATCH_DIR) {
  ensureBuilderDirs();
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => !entry.name.startsWith('.'))
    .map(entry => {
      const full = path.join(dir, entry.name);
      const stat = fs.statSync(full);
      return { name: entry.name, path: full, isDirectory: entry.isDirectory(), mtimeMs: stat.mtimeMs, size: stat.size };
    });
}

function detectCodeKind(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.zip') return 'zip';
  if (['.html', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.css', '.json', '.py', '.md'].includes(ext)) return 'code-file';
  return 'unknown';
}

function scanWatchInbox() {
  ensureBuilderDirs();
  SYSTEM.builder.last_scan = Date.now();
  for (const item of listWatchCandidates()) {
    const key = `${item.path}:${item.mtimeMs}:${item.size}`;
    if (SYSTEM.builder.seen[key]) continue;
    const kind = item.isDirectory ? 'folder' : detectCodeKind(item.name);
    if (kind === 'unknown') continue;
    SYSTEM.builder.seen[key] = true;
    builderQueue.push({ source: item.path, name: item.name, kind, queued_at: Date.now() });
    logEvent('builder', 'watcher', `Queued ${kind}: ${item.name}`);
  }
  persistState();
  runNextBuilderJob();
}

function runNextBuilderJob() {
  if (builderBusy || builderQueue.length === 0) return;
  builderBusy = true;
  const queued = builderQueue.shift();
  const job = {
    id: `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'running',
    source: queued.name,
    kind: queued.kind,
    started_at: Date.now(),
    sandbox_path: null,
    report_path: null,
    promoted_url: null,
    log: []
  };
  SYSTEM.builder.status = 'running';
  pushBuilderJob(job);

  try {
    const targetName = `${job.id}_${queued.name.replace(/[^A-Za-z0-9._-]/g, '_')}`;
    const sandboxTarget = path.join(BUILDER_UPDATES_DIR, targetName);
    job.sandbox_path = sandboxTarget;
    if (queued.kind === 'folder') fs.cpSync(queued.source, sandboxTarget, { recursive: true });
    else {
      ensureDir(sandboxTarget);
      fs.copyFileSync(queued.source, path.join(sandboxTarget, queued.name));
    }

    if (queued.kind === 'zip' || queued.kind === 'folder') {
      runAutobuilder(job, queued.source, () => finishBuilderJob(job, sandboxTarget));
    } else {
      promoteSandbox(job, sandboxTarget);
      finishBuilderJob(job, sandboxTarget);
    }
  } catch (err) {
    job.status = 'failed';
    job.error = err.message;
    SYSTEM.builder.last_error = err.message;
    SYSTEM.builder.status = 'idle';
    logEvent('error', 'builder', `Builder failed: ${err.message}`, job);
    persistState();
    builderBusy = false;
    runNextBuilderJob();
  }
}

function runAutobuilder(job, source, done) {
  const script = path.join(__dirname, 'tools', 'autobuilder', 'autobuilder.py');
  const py = pythonInvocation(script, ['ingest', source, '--projects', BUILDER_PROJECTS_DIR, '--reports', BUILDER_REPORTS_DIR]);
  const child = spawn(py.cmd, py.args, { cwd: __dirname, shell: false });
  child.stdout.on('data', data => job.log.push(String(data).slice(-4000)));
  child.stderr.on('data', data => job.log.push(String(data).slice(-4000)));
  child.on('close', code => {
    job.autobuilder_exit_code = code;
    const reports = fs.existsSync(BUILDER_REPORTS_DIR)
      ? fs.readdirSync(BUILDER_REPORTS_DIR).map(name => path.join(BUILDER_REPORTS_DIR, name)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
      : [];
    job.report_path = reports[0] || null;
    done();
  });
}

async function runSelfWriter(prompt) {
  ensureBuilderDirs();
  const job = {
    id: `selfwrite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'probabilistic-prepass',
    source: 'Synthia AutoWriter',
    kind: 'selfwrite',
    prompt,
    started_at: Date.now(),
    sandbox_path: null,
    report_path: null,
    promoted_url: null,
    log: []
  };
  SYSTEM.builder.status = 'writing';
  pushBuilderJob(job);

  let llmNote = '';
  try {
    const result = await callTrident('/generate', {
      prompt: `${plainEnglishInstruction()}

You are Synthia's private code writer. Return ONLY JSON, no markdown, in this shape:
{
  "files": [
    {"path": "index.html", "content": "full file content"},
    {"path": "style.css", "content": "full file content"},
    {"path": "main.js", "content": "full file content"}
  ],
  "notes": "short plain English note"
}

Build a phone-first frontend app that directly satisfies this request. Make it usable, not just a placeholder. Keep it dependency-free unless the request truly needs dependencies.

User request:
${prompt}`,
      head: 'code',
      max_tokens: 2200,
      temperature: 0.65,
      rag_query: 'Synthia autonomous builder phone app write repair loop'
    });
    llmNote = JSON.stringify(result.body || result, null, 2).slice(0, 6000);
    job.trident_prepass = 'connected';
  } catch (err) {
    llmNote = `Trident pre-pass unavailable: ${err.message}`;
    job.trident_prepass = 'unavailable';
  }

  const script = path.join(__dirname, 'tools', 'autowriter', 'synthia_autowriter.py');
  const py = pythonInvocation(script, ['--prompt', prompt, '--out', BUILDER_UPDATES_DIR, '--reports', BUILDER_REPORTS_DIR, '--llm-note', llmNote, '--max-rounds', '3']);
  const result = await new Promise(resolve => {
    const child = spawn(py.cmd, py.args, { cwd: __dirname, shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += String(data); job.log.push(String(data).slice(-4000)); });
    child.stderr.on('data', data => { stderr += String(data); job.log.push(String(data).slice(-4000)); });
    child.on('close', code => resolve({ code, stdout, stderr }));
  });

  job.autowriter_exit_code = result.code;
  let parsed = null;
  try { parsed = JSON.parse(result.stdout.slice(result.stdout.indexOf('{'))); } catch {}
  if (parsed?.project_dir) job.sandbox_path = parsed.project_dir;
  if (parsed?.report_path) job.report_path = parsed.report_path;

  if (result.code === 0 && job.sandbox_path && fs.existsSync(job.sandbox_path)) {
    promoteSandbox(job, job.sandbox_path);
    job.status = parsed?.status === 'ready' ? 'written-promoted' : 'written-needs-review';
  } else {
    job.status = 'write-failed';
    job.error = result.stderr || result.stdout || 'AutoWriter failed';
    SYSTEM.builder.last_error = job.error;
  }
  job.finished_at = Date.now();
  SYSTEM.builder.status = 'idle';
  logEvent('builder', 'autowriter', `Self-write finished: ${job.status}`, job);
  persistState();
  return job;
}

function promoteSandbox(job, sandboxTarget) {
  const currentDir = path.join(AUTOLOAD_DIR, 'current');
  const rollback = saveAutoloadRollback(job.source || 'promote');
  if (rollback) job.rollback_path = rollback.path;
  if (fs.existsSync(currentDir)) fs.rmSync(currentDir, { recursive: true, force: true });
  fs.cpSync(sandboxTarget, currentDir, { recursive: true });
  const indexPath = path.join(currentDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(path.join(AUTOLOAD_DIR, 'index.html'), `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthia Autoload</title></head><body style="font-family:sans-serif;padding:24px;background:#060709;color:#edf2f7"><h1>${job.source}</h1><p>Latest sandbox update is available at <a href="/autoload-static/current/" style="color:#20d6a4">/autoload-static/current/</a>.</p><p>No index.html was found, so this is shown instead.</p></body></html>`);
  } else {
    fs.writeFileSync(path.join(AUTOLOAD_DIR, 'index.html'), `<!doctype html><meta http-equiv="refresh" content="0; url=/autoload-static/current/index.html"><a href="/autoload-static/current/index.html">Open latest build</a>`);
  }
  SYSTEM.builder.latest_promoted = { job_id: job.id, source: job.source, promoted_at: Date.now(), url: '/autoload' };
  job.promoted_url = '/autoload';
}

function finishBuilderJob(job, sandboxTarget) {
  try {
    promoteSandbox(job, sandboxTarget);
    job.status = job.autobuilder_exit_code && job.autobuilder_exit_code !== 0 ? 'sandboxed-with-warnings' : 'promoted';
    job.finished_at = Date.now();
    SYSTEM.builder.status = 'idle';
    logEvent('builder', 'autobuilder', `Processed ${job.source}: ${job.status}`, job);
  } finally {
    persistState();
    builderBusy = false;
    runNextBuilderJob();
  }
}

function startBuilderWatcher() {
  ensureBuilderDirs();
  if (builderTimer) return;
  SYSTEM.builder.watcher = 'running';
  builderTimer = setInterval(scanWatchInbox, BUILDER_POLL_MS);
  scanWatchInbox();
  logEvent('builder', 'watcher', `Watching ${WATCH_DIR}`);
}

function stopBuilderWatcher() {
  if (builderTimer) clearInterval(builderTimer);
  builderTimer = null;
  SYSTEM.builder.watcher = 'stopped';
  persistState();
}

function syncPhoneInbox() {
  ensureBuilderDirs();
  ensureDir(PHONE_INBOX_DIR);
  const copied = [];
  for (const entry of fs.readdirSync(PHONE_INBOX_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const source = path.join(PHONE_INBOX_DIR, entry.name);
    let target = path.join(WATCH_DIR, entry.name);
    if (fs.existsSync(target)) {
      target = path.join(WATCH_DIR, `${Date.now()}-${entry.name}`);
    }
    if (entry.isDirectory()) fs.cpSync(source, target, { recursive: true });
    else fs.copyFileSync(source, target);
    copied.push({ name: entry.name, target });
  }
  if (copied.length) logEvent('builder', 'phone-inbox', `Synced ${copied.length} phone file(s) into watch-inbox`, copied);
  scanWatchInbox();
  return copied;
}

// ═══════════════════════════════════════════════════════════════════
// PHONE SYNC — durable two-way residence bridge
// ═══════════════════════════════════════════════════════════════════
let phoneSyncTimer = null;
let phoneSyncBusy = false;

function loadPhoneSyncConfig() {
  try {
    if (!fs.existsSync(PHONE_SYNC_CONFIG_FILE)) return null;
    const cfg = JSON.parse(fs.readFileSync(PHONE_SYNC_CONFIG_FILE, 'utf8'));
    if (!cfg.endpoint || !cfg.file_endpoint || !cfg.workspace_id || !cfg.participant_ref || !cfg.token) return null;
    return cfg;
  } catch (err) {
    console.error('Phone sync config failed:', err.message);
    return null;
  }
}
function loadPhoneSyncState() {
  try { if (fs.existsSync(SYNC_STATE_FILE)) return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8')); } catch (_) {}
  return { last_seen_version: 0, connected: false, last_poll_at: null, last_success_at: null, last_error: null, installed: [] };
}
const PHONE_SYNC = loadPhoneSyncState();
function savePhoneSyncState() {
  ensureDataDir();
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(PHONE_SYNC, null, 2));
}
async function fileSha256(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}
async function phoneSyncRpc(name, args = {}) {
  const cfg = loadPhoneSyncConfig();
  if (!cfg) throw new Error('phone sync config missing');
  const response = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: { workspace_id: cfg.workspace_id, ...args } } })
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(body.error?.message || body.message || `sync RPC ${name} failed`);
  return body.result?.structuredContent?.result ?? JSON.parse(body.result?.content?.[0]?.text || 'null');
}
async function fetchSyncJson(url) {
  const cfg = loadPhoneSyncConfig();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${cfg.token}` }, cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.error || `sync fetch failed (${response.status})`);
  return body;
}
async function installBinaryEvent(event) {
  const cfg = loadPhoneSyncConfig();
  const packageKey = String(event.payload?.package_key || '').trim();
  const versionLabel = String(event.payload?.version_label || '').trim();
  if (!packageKey || !versionLabel) throw new Error('binary event missing package/version');
  const manifestUrl = `${cfg.file_endpoint}?package=${encodeURIComponent(packageKey)}&version=${encodeURIComponent(versionLabel)}`;
  const manifest = await fetchSyncJson(manifestUrl);
  if (!manifest.ok) throw new Error(manifest.error || 'binary manifest unavailable');

  const safePackage = packageKey.replace(/[^A-Za-z0-9._-]/g, '_');
  const safeVersion = versionLabel.replace(/[^A-Za-z0-9._-]/g, '_');
  const packageDir = path.join(SYNC_INBOX_DIR, `${safePackage}@${safeVersion}`);
  ensureDir(packageDir);

  for (const item of manifest.files || []) {
    const rel = safeRelativePath(item.file_path || item.object_path);
    if (!rel || !item.storage_path) throw new Error('unsafe binary manifest path');
    const target = resolveInside(packageDir, rel);
    if (!target) throw new Error(`unsafe sync target: ${rel}`);
    ensureDir(path.dirname(target));
    const temp = `${target}.part`;
    const response = await fetch(`${cfg.file_endpoint}?path=${encodeURIComponent(item.storage_path)}`, { headers: { Authorization: `Bearer ${cfg.token}` }, cache: 'no-store' });
    if (!response.ok || !response.body) throw new Error(`download failed for ${rel}: ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(temp));
    const actual = await fileSha256(temp);
    if (item.sha256 && actual.toLowerCase() !== String(item.sha256).toLowerCase()) {
      fs.rmSync(temp, { force: true });
      throw new Error(`checksum mismatch for ${rel}`);
    }
    fs.renameSync(temp, target);
  }

  fs.writeFileSync(path.join(packageDir, 'SYNTHIA-SYNC-MANIFEST.json'), JSON.stringify({ ...manifest, event_uuid: event.event_uuid, workspace_version: event.workspace_version }, null, 2));
  ensureDir(WATCH_DIR);
  const watchTarget = path.join(WATCH_DIR, `${safePackage}@${safeVersion}`);
  if (!fs.existsSync(watchTarget)) fs.cpSync(packageDir, watchTarget, { recursive: true });
  scanWatchInbox();
  PHONE_SYNC.installed ||= [];
  PHONE_SYNC.installed.unshift({ package_key: packageKey, version_label: versionLabel, event_uuid: event.event_uuid, installed_at: Date.now(), path: packageDir });
  PHONE_SYNC.installed = PHONE_SYNC.installed.slice(0, 100);
  return { package_key: packageKey, version_label: versionLabel, path: packageDir, files: manifest.file_count || manifest.files?.length || 0 };
}
async function pollPhoneSync() {
  if (phoneSyncBusy) return { ok: true, busy: true, ...PHONE_SYNC };
  phoneSyncBusy = true;
  PHONE_SYNC.last_poll_at = Date.now();
  try {
    const cfg = loadPhoneSyncConfig();
    if (!cfg) throw new Error('phone sync config missing');
    const updates = await phoneSyncRpc('synthia_get_updates', { since_version: Number(PHONE_SYNC.last_seen_version || 0), limit: 100 });
    for (const event of updates || []) {
      let details = { event_type: event.event_type };
      if (event.event_type === 'artifact.binary_ready') details = { ...details, ...(await installBinaryEvent(event)) };
      await phoneSyncRpc('synthia_acknowledge_update', {
        participant_ref: cfg.participant_ref,
        event_uuid: event.event_uuid,
        receipt_status: event.event_type === 'artifact.binary_ready' ? 'applied' : 'seen',
        details
      });
      PHONE_SYNC.last_seen_version = event.workspace_version;
      PHONE_SYNC.last_success_at = Date.now();
      PHONE_SYNC.last_error = null;
      PHONE_SYNC.connected = true;
      savePhoneSyncState();
    }
    if (!(updates || []).length) {
      PHONE_SYNC.connected = true;
      PHONE_SYNC.last_success_at = Date.now();
      PHONE_SYNC.last_error = null;
      savePhoneSyncState();
    }
    return { ok: true, updates: (updates || []).length, ...PHONE_SYNC };
  } catch (err) {
    PHONE_SYNC.connected = false;
    PHONE_SYNC.last_error = err.message;
    savePhoneSyncState();
    logEvent('error', 'phone-sync', `Phone sync failed: ${err.message}`);
    return { ok: false, error: err.message, ...PHONE_SYNC };
  } finally {
    phoneSyncBusy = false;
  }
}
function startPhoneSync() {
  if (phoneSyncTimer) return;
  ensureDir(SYNC_INBOX_DIR);
  phoneSyncTimer = setInterval(() => { pollPhoneSync().catch(() => {}); }, SYNC_POLL_MS);
  setTimeout(() => { pollPhoneSync().catch(() => {}); }, 1200).unref();
}
async function phoneNotifications() {
  const [mine, owner] = await Promise.all([
    phoneSyncRpc('synthia_get_notifications', { recipient_ref: 'synthia', unread_only: true, limit: 100 }),
    phoneSyncRpc('synthia_get_notifications', { recipient_ref: 'adaya', unread_only: true, limit: 100 })
  ]);
  const unique = new Map([...(mine || []), ...(owner || [])].map(n => [n.notification_type + ':' + (n.payload?.request_id || n.payload?.proposal_id || n.notification_id), n]));
  return [...unique.values()].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}
async function markDecisionNotificationsRead(notice) {
  const all = await Promise.all([
    phoneSyncRpc('synthia_get_notifications', { recipient_ref: 'synthia', unread_only: true, limit: 100 }),
    phoneSyncRpc('synthia_get_notifications', { recipient_ref: 'adaya', unread_only: true, limit: 100 })
  ]);
  const key = notice.payload?.request_id || notice.payload?.proposal_id || null;
  const matches = all.flat().filter(n => n.notification_type === notice.notification_type && (key ? (n.payload?.request_id === key || n.payload?.proposal_id === key) : n.notification_id === notice.notification_id));
  await Promise.all(matches.map(n => phoneSyncRpc('synthia_mark_notification_read', { notification_id: n.notification_id })));
}

// ── Synthai2 phone-local compatibility layer ───────────────────────────────
// This exposes the local-capable API surface expected by the current Synthai2
// dashboard without creating a second backend or requiring Python/Linux shell.
const SYN2_ROOT = path.join(DATA_DIR, 'synthai2-local');
const SYN2_WORKSPACE = path.join(SYN2_ROOT, 'workspace');
const SYN2_APPS = path.join(SYN2_ROOT, 'mounted-apps');
const SYN2_MESH_FILE = path.join(SYN2_ROOT, 'mesh-events.json');
fs.mkdirSync(SYN2_WORKSPACE, { recursive: true });
fs.mkdirSync(SYN2_APPS, { recursive: true });

function syn2Safe(root, relative = '.') {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, String(relative || '.'));
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error('path escapes Synthia residence');
  }
  return resolved;
}

function syn2ReadMesh() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SYN2_MESH_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}
function syn2WriteMesh(events) {
  fs.mkdirSync(path.dirname(SYN2_MESH_FILE), { recursive: true });
  const tmp = SYN2_MESH_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(events.slice(-1000), null, 2));
  fs.renameSync(tmp, SYN2_MESH_FILE);
}
function syn2PublishMesh(input = {}) {
  const events = syn2ReadMesh();
  const event = {
    id: input.id || `mesh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: input.source || 'phone-local',
    type: input.type || 'mesh.event',
    topic: input.topic || 'general',
    payload: input.payload || {},
    createdAt: input.createdAt || new Date().toISOString(),
  };
  events.push(event);
  syn2WriteMesh(events);
  return event;
}

function syn2WorkspaceFiles(relative = '.') {
  const base = syn2Safe(SYN2_WORKSPACE, relative);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const walk = (dir, depth = 0) => {
    if (depth > 8) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(SYN2_WORKSPACE, full).split(path.sep).join('/');
      if (entry.isDirectory()) walk(full, depth + 1);
      else {
        const stat = fs.statSync(full);
        out.push({ path: rel, size: stat.size, modifiedAt: stat.mtime.toISOString() });
      }
      if (out.length >= 2000) return;
    }
  };
  const stat = fs.statSync(base);
  if (stat.isDirectory()) walk(base); else out.push({ path: path.relative(SYN2_WORKSPACE, base), size: stat.size, modifiedAt: stat.mtime.toISOString() });
  return out;
}

function syn2MountedApps() {
  const apps = [];
  if (!fs.existsSync(SYN2_APPS)) return apps;
  for (const id of fs.readdirSync(SYN2_APPS)) {
    const manifestPath = path.join(SYN2_APPS, id, 'manifest.json');
    try { apps.push(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))); } catch (_) {}
  }
  return apps.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

app.get('/api/health', (_req, res) => {
  const mesh = syn2ReadMesh();
  res.json({
    status: 'ok',
    service: 'Synthia Phone Residence API',
    mesh: { status: 'online', events: mesh.length, topics: [...new Set(mesh.map(e => e.topic).filter(Boolean))] },
    container: { enabled: true, kind: 'android-embedded-node', shell: false, cwd: DATA_DIR },
    python: { running: false, managed: false, required: false },
    workspace: { root: SYN2_WORKSPACE, exists: fs.existsSync(SYN2_WORKSPACE) },
    apps: { mounted: syn2MountedApps().length },
    local: true,
    persistent: true,
  });
});

app.get('/api/mesh/status', (_req, res) => {
  const events = syn2ReadMesh();
  res.json({ status: 'online', events: events.length, topics: [...new Set(events.map(e => e.topic).filter(Boolean))], persistent: true });
});
app.get('/api/mesh/events', (req, res) => {
  const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 100)));
  res.json({ success: true, events: syn2ReadMesh().slice(-limit).reverse() });
});
app.post('/api/mesh/events', (req, res) => res.json({ success: true, event: syn2PublishMesh(req.body || {}) }));

app.get('/api/workspace/status', (_req, res) => res.json({ root: SYN2_WORKSPACE, exists: true, persistent: true }));
app.get('/api/workspace/files', (req, res) => {
  try { res.json({ success: true, root: SYN2_WORKSPACE, files: syn2WorkspaceFiles(String(req.query.dir || '.')) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
app.get('/api/workspace/files/:path(*)', (req, res) => {
  try {
    const file = syn2Safe(SYN2_WORKSPACE, req.params.path);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.status(404).json({ success: false, error: 'file not found' });
    const bytes = fs.readFileSync(file);
    res.json({ success: true, file: { path: req.params.path, size: bytes.length, content: bytes.toString('utf8'), base64: bytes.toString('base64') } });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
app.post('/api/workspace/files', (req, res) => {
  try {
    const rel = String(req.body?.path || '');
    if (!rel) return res.status(400).json({ success: false, error: 'path required' });
    const file = syn2Safe(SYN2_WORKSPACE, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const bytes = req.body?.base64 !== undefined ? Buffer.from(String(req.body.base64), 'base64') : Buffer.from(String(req.body?.content || ''), 'utf8');
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, bytes);
    fs.renameSync(tmp, file);
    const record = { path: rel, size: bytes.length, modifiedAt: new Date().toISOString() };
    syn2PublishMesh({ source: 'workspace', type: 'workspace.file.written', topic: rel, payload: record });
    res.json({ success: true, file: record });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

app.get('/api/apps', (_req, res) => res.json({ success: true, apps: syn2MountedApps() }));
app.post('/api/apps/mount', (req, res) => {
  try {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];
    if (!files.length) return res.status(400).json({ success: false, error: 'files required' });
    const name = String(req.body?.name || 'mounted-app').slice(0, 120);
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'}-${Date.now()}`;
    const root = path.join(SYN2_APPS, id);
    fs.mkdirSync(root, { recursive: true });
    const written = [];
    for (const item of files) {
      const rel = String(item?.path || '');
      if (!rel) continue;
      const target = syn2Safe(root, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const bytes = item.base64 !== undefined ? Buffer.from(String(item.base64), 'base64') : Buffer.from(String(item.content || ''), 'utf8');
      fs.writeFileSync(target, bytes);
      written.push(rel);
    }
    const appEntry = { id, name, path: root, runCommand: req.body?.runCommand || '', files: written, createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(appEntry, null, 2));
    syn2PublishMesh({ source: 'app-mount', type: 'app.mounted', topic: id, payload: appEntry });
    res.json({ success: true, app: appEntry });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
app.post('/api/apps/:id/run', async (req, res) => {
  const appEntry = syn2MountedApps().find(item => item.id === req.params.id);
  if (!appEntry) return res.status(404).json({ success: false, error: 'mounted app not found' });
  const requested = String(req.body?.command || appEntry.runCommand || '').trim();
  const match = requested.match(/^node\s+([^\s]+)$/);
  if (!match) return res.status(400).json({ success: false, error: 'phone runner accepts only: node <relative-js-file>' });
  let entry;
  try { entry = syn2Safe(appEntry.path, match[1]); } catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  if (!fs.existsSync(entry)) return res.status(404).json({ success: false, error: 'entry file not found' });
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, [entry], { cwd: appEntry.path, env: { ...process.env, DATA_DIR }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', finished = false;
  const cap = text => text.slice(-262144);
  child.stdout.on('data', chunk => { stdout = cap(stdout + chunk.toString()); });
  child.stderr.on('data', chunk => { stderr = cap(stderr + chunk.toString()); });
  const timer = setTimeout(() => { if (!finished) child.kill('SIGKILL'); }, 15000);
  child.on('error', error => { if (finished) return; finished = true; clearTimeout(timer); res.status(500).json({ success: false, run: { command: requested, code: null, stdout, stderr: cap(stderr + error.message) } }); });
  child.on('exit', code => {
    if (finished) return;
    finished = true; clearTimeout(timer);
    const run = { command: requested, code, stdout, stderr };
    syn2PublishMesh({ source: 'app-runner', type: 'app.ran', topic: appEntry.id, payload: { command: requested, code } });
    res.json({ success: code === 0, app: appEntry, run });
  });
});

// Honest compatibility: the phone residence is the container; Python is not a boot dependency.
app.get('/api/container/status', (_req, res) => res.json({ enabled: true, kind: 'android-embedded-node', shell: false, cwd: DATA_DIR }));
app.post('/api/container/exec', (_req, res) => res.status(403).json({ success: false, error: 'arbitrary shell execution is disabled in the phone residence' }));
app.get('/api/python/status', (_req, res) => res.json({ running: false, managed: false, required: false }));
app.get('/api/python/proxy/health', (_req, res) => res.status(503).json({ running: false, required: false, error: 'Python service is not required by Synthia phone runtime' }));

// ═══════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════


app.get('/health', (req, res) => {
  const catalog = loadCatalog();
  res.json({ ok: true, status: 'online', service: 'synthia-admin', integrated_apps: catalog.apps.length, timestamp: Date.now() });
});

// ── /sync ───────────────────────────────────────────────────────
app.get('/sync/status', (req, res) => res.json({ ok: true, configured: !!loadPhoneSyncConfig(), busy: phoneSyncBusy, ...PHONE_SYNC }));
app.post('/sync/poll', async (req, res) => {
  const result = await pollPhoneSync();
  res.status(result.ok ? 200 : 502).json(result);
});
app.get('/sync/notifications', async (req, res) => {
  try { res.json({ ok: true, notifications: await phoneNotifications() }); }
  catch (err) { res.status(502).json({ ok: false, error: err.message }); }
});
app.post('/sync/mark-read', async (req, res) => {
  try {
    const id = Number(req.body?.notification_id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok:false, error:'notification_id required' });
    await phoneSyncRpc('synthia_mark_notification_read', { notification_id: id });
    res.json({ ok: true, notification_id: id });
  } catch (err) { res.status(502).json({ ok:false, error:err.message }); }
});
app.post('/sync/decision', async (req, res) => {
  try {
    const notice = req.body?.notification || {};
    const decision = req.body?.decision;
    if (!['approved','rejected'].includes(decision)) return res.status(400).json({ ok:false,error:'invalid decision' });
    if (notice.notification_type === 'connection.requested' && notice.payload?.request_id) {
      await phoneSyncRpc('synthia_respond_connection', { request_id: notice.payload.request_id, decision });
    } else if (notice.notification_type === 'change.approval_requested' && notice.payload?.proposal_id) {
      await phoneSyncRpc('synthia_respond_change', { proposal_id: notice.payload.proposal_id, decision });
    } else return res.status(400).json({ ok:false,error:'notification is not actionable' });
    await markDecisionNotificationsRead(notice);
    res.json({ ok: true, decision });
  } catch (err) { res.status(502).json({ ok:false,error:err.message }); }
});

// ── /apps ───────────────────────────────────────────────────────
app.get('/apps', (req, res) => {
  res.json({ apps: loadCatalog().apps, timestamp: Date.now() });
});

app.get('/apps/:id', (req, res) => {
  const appInfo = loadCatalog().apps.find(item => item.id === req.params.id);
  if (!appInfo) return res.status(404).json({ error: 'app not found' });
  res.json({ app: appInfo, timestamp: Date.now() });
});

app.get('/wiring-status', (req, res) => {
  const catalog = loadCatalog();
  res.json({
    ready: {
      phone_shell: 'phone/synthia-terminal.sh',
      web_terminal: '/terminal-ui',
      admin_cockpit: '/admin',
      prebuilt_studio: '/studio',
      builder_admin_panel: '/builder-admin',
      user_autoload: '/autoload',
      watched_inbox: WATCH_DIR,
      sandbox: SANDBOX_DIR,
      app_catalog: '/apps',
      ingest: 'phone/ingest-app.sh',
      sync_phone_inbox: 'phone/sync-phone-inbox.sh',
      self_compiler: 'phone/self-compile-termux.sh',
      webview_apk_builder: 'phone/build-webview-apk.sh',
      repo_bootstrap: 'repos/bootstrap-github.sh'
    },
    included_source_reference: catalog.apps
      .filter(item => String(item.status || '').includes('source') || String(item.status || '').includes('reference') || String(item.status || '').includes('needs'))
      .map(item => ({ id: item.id, status: item.status, reason: item.notes })),
    note: 'The self-hosted phone core is wired. Source/reference bundles are intentionally included for building or future integration, not treated as active services.',
    timestamp: Date.now()
  });
});

app.get('/autoload', (req, res) => {
  res.sendFile(path.join(AUTOLOAD_DIR, 'index.html'));
});

// ── Autonomous builder admin API ────────────────────────────────
app.get('/builder/status', requireAdmin, (req, res) => {
  const watch_items = fs.existsSync(WATCH_DIR) ? listWatchCandidates().map(item => ({ name: item.name, kind: item.isDirectory ? 'folder' : detectCodeKind(item.name), size: item.size, mtime: item.mtimeMs })) : [];
  const phone_items = fs.existsSync(PHONE_INBOX_DIR) ? fs.readdirSync(PHONE_INBOX_DIR, { withFileTypes: true }).filter(item => !item.name.startsWith('.')).map(item => ({ name: item.name, directory: item.isDirectory() })) : [];
  res.json({ builder: SYSTEM.builder, queue_depth: builderQueue.length, busy: builderBusy, watch_items, phone_inbox: PHONE_INBOX_DIR, phone_items, timestamp: Date.now() });
});

app.post('/builder/watch/start', requireAdmin, (req, res) => {
  startBuilderWatcher();
  res.json({ started: true, builder: SYSTEM.builder });
});

app.post('/builder/watch/stop', requireAdmin, (req, res) => {
  stopBuilderWatcher();
  res.json({ stopped: true, builder: SYSTEM.builder });
});

app.post('/builder/scan', requireAdmin, (req, res) => {
  scanWatchInbox();
  res.json({ scanned: true, queue_depth: builderQueue.length, builder: SYSTEM.builder });
});

app.post('/builder/sync-phone-inbox', requireAdmin, (req, res) => {
  const copied = syncPhoneInbox();
  res.json({ synced: true, copied, phone_inbox: PHONE_INBOX_DIR, queue_depth: builderQueue.length, builder: SYSTEM.builder });
});

app.post('/builder/seedbox/run', requireAdmin, (req, res) => {
  const script = path.join(__dirname, 'phone', 'run-seedbox-swarm.sh');
  if (!fs.existsSync(script)) return res.status(404).json({ error: 'seedbox script not found' });
  const child = spawn('bash', [script], { cwd: __dirname, detached: true, stdio: 'ignore' });
  child.unref();
  logEvent('builder', 'seedbox', 'Seedbox swarm started from dashboard');
  res.json({ started: true, pid: child.pid });
});

app.post('/builder/ingest', requireAdmin, (req, res) => {
  const { source, name } = req.body;
  if (!source) return res.status(400).json({ error: 'source required' });
  const kind = fs.existsSync(source) && fs.statSync(source).isDirectory() ? 'folder' : detectCodeKind(source);
  if (kind === 'unknown') return res.status(400).json({ error: 'unsupported source type' });
  builderQueue.push({ source, name: name || path.basename(source), kind, queued_at: Date.now() });
  runNextBuilderJob();
  res.json({ queued: true, source, kind, queue_depth: builderQueue.length });
});

app.post('/builder/write', requireAdmin, async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  try {
    const job = await runSelfWriter(prompt);
    res.json({ written: true, job, url: job.promoted_url || null });
  } catch (err) {
    SYSTEM.builder.status = 'idle';
    SYSTEM.builder.last_error = err.message;
    logEvent('error', 'autowriter', err.message);
    persistState();
    res.status(500).json({ error: err.message });
  }
});

async function synthiaChatEnvelope(message, source = 'synthia_chat', publicMode = false) {
  const routed = routeBySynthiaRules(message);
  let lcm = null;
  let trident = null;
  try {
    lcm = await callLcm({ action: 'query', text: message, source });
  } catch (err) {
    lcm = { ok: false, error: err.message };
  }
  const publicAllowed = routed.rule?.public_allowed !== false;
  const canUsePrivateTrident = !publicMode || publicAllowed;
  if (canUsePrivateTrident) {
    try {
      trident = await callTrident('/generate', {
        prompt: `${plainEnglishInstruction()}

You are Synthia inside the phone app. Reply briefly and helpfully. Use backend context silently if useful, but do not expose the internal labels.
Backend context:
${JSON.stringify(lcm).slice(0, 3000)}

User:
${message}`,
        head: routed.rule?.action === 'writer' ? 'code' : 'chat',
        max_tokens: 256,
        temperature: 0.8,
        rag_query: message
      });
    } catch (err) {
      trident = { ok: false, error: err.message };
    }
  }
  const tridentReply = plainEnglishFromBody(trident?.body);
  const reply = trident?.ok && tridentReply ? tridentReply : localSynthiaReply(message, lcm, routed);
  const adminCodeActions = ['admin_apply_change', 'github', 'ingest'];
  const writerAction = routed.rule?.action === 'writer';
  const adminOnly = adminCodeActions.includes(routed.rule?.action);
  const canCode = !publicMode && (writerAction || adminOnly);
  const blockedByPublicBoundary = publicMode && (adminOnly || !publicAllowed);
  return {
    ok: true,
    reply,
    route: routed.rule,
    policy: routed.policy,
    lcm,
    trident: publicMode ? { ok: false, private: true, message: 'Trident is a private backend helper.' } : trident,
    can_code: canCode,
    code_route: canCode ? (adminOnly ? '/builder/apply-change' : '/builder/write') : null,
    public_boundary: {
      public_mode: publicMode,
      blocked_direct_code_change: blockedByPublicBoundary,
      message: blockedByPublicBoundary ? 'Public requests must stay inside Synthia and wait for admin/backend approval.' : 'Request stayed inside Cynthia rules.'
    }
  };
}

app.post('/synthia/chat', requireAdmin, async (req, res) => {
  const message = String(req.body?.message || req.body?.prompt || '').trim();
  if (!message) return res.status(400).json({ error: 'message required' });
  const envelope = await synthiaChatEnvelope(message, 'synthia_chat', false);
  logEvent('synthia', 'chat', message.slice(0, 160), { route: envelope.route?.id, lcm_ok: !!envelope.lcm?.ok, trident_ok: !!envelope.trident?.ok });
  res.json(envelope);
});

app.get('/synthia/chat', requireAdmin, (req, res) => {
  res.redirect('/admin');
});

app.post('/synthia/public', async (req, res) => {
  const message = String(req.body?.message || req.body?.prompt || '').trim();
  if (!message) return res.status(400).json({ error: 'message required' });
  const envelope = await synthiaChatEnvelope(message, 'synthia_public', true);
  logEvent('synthia', 'public-chat', message.slice(0, 160), { route: envelope.route?.id, blocked: envelope.public_boundary?.blocked_direct_code_change });
  res.json(envelope);
});

app.get('/synthia/public', (req, res) => {
  res.redirect('/client');
});

app.get('/lco/status', requireAdmin, (req, res) => {
  function countLocalFiles(dir) {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += countLocalFiles(full);
      else total += 1;
    }
    return total;
  }
  const lcoRoot = path.join(__dirname, 'tools', 'lco');
  const finalInputsFile = path.join(__dirname, 'config', 'final-inputs-manifest.json');
  const organs = fs.existsSync(lcoRoot)
    ? fs.readdirSync(lcoRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => {
          const full = path.join(lcoRoot, entry.name);
          return { name: entry.name, files: countLocalFiles(full) };
        })
    : [];
  res.json({
    ok: true,
    identity: loadSynthiaRules().identity || null,
    wh_order: loadSynthiaRules().wh_order || [],
    final_inputs: loadJsonFile(finalInputsFile, null),
    organs,
    architecture: 'CYNTHIA_LCO_ARCHITECTURE.md',
    placement_rules: 'config/swarm-placement-rules.json'
  });
});

app.get('/synthia/lcm/status', requireAdmin, async (req, res) => {
  try {
    res.json(await callLcm({ action: 'status' }));
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/synthia/lcm/ingest', requireAdmin, async (req, res) => {
  try {
    res.json(await callLcm({ action: 'ingest_file', path: req.body?.path, content: req.body?.content, metadata: req.body?.metadata }));
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/builder/apply-change', requireAdmin, async (req, res) => {
  const request = String(req.body?.request || req.body?.prompt || '').trim();
  const live = req.body?.live === true || req.body?.apply_to_live === true;
  const fiveW = {
    who: req.body?.who || 'admin',
    what: req.body?.what || request || 'code change',
    where: live ? 'synthia-live-backend-or-frontend' : 'builder-sandbox',
    when: 'admin-request',
    why: req.body?.why || 'admin requested controlled front/back end change'
  };
  let changePayload = req.body?.files ? { files: req.body.files } : null;
  let trident = null;

  if (!changePayload && request) {
    try {
      trident = await callTrident('/generate', {
        head: 'code',
        max_tokens: 1200,
        temperature: 0.65,
        rag_query: 'Synthia backend code patch file changes JSON',
        prompt: `Return ONLY JSON in this shape: {"files":[{"path":"relative/path.ext","content":"full file contents"}],"notes":"short note"}.
Create the requested Synthia backend/admin change. Do not include markdown. Keep paths relative to the Synthia project root. Request:
${request}`
      });
      changePayload = extractJsonObject(trident.body?.text || trident.body?.output || trident.body?.result || trident.body || trident);
    } catch (err) {
      trident = { ok: false, error: err.message };
    }
  }

  const files = normalizeFileChanges(changePayload);
  if (!files.length) {
    return res.status(422).json({
      applied: false,
      error: 'no valid file changes found',
      trident,
      hint: 'Send files:[{path,content}] directly, or start Trident and send a request.'
    });
  }

  try {
    const manifest = applyCodeChanges({ files, reason: request || 'direct-file-change', live });
    manifest.five_w = fiveW;
    fs.writeFileSync(path.join(manifest.backup_dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    const job = {
      id: manifest.id,
      status: live ? 'live-code-applied' : 'sandbox-code-applied',
      kind: 'code-change',
      source: 'Trident/Synthia backend',
      request,
      five_w: fiveW,
      manifest,
      promoted_url: live ? null : '/builder-admin',
      started_at: manifest.created_at,
      finished_at: Date.now()
    };
    pushBuilderJob(job);
    logEvent('builder', 'code-change', `Applied ${files.length} code file(s)${live ? ' live' : ' to sandbox'}`, { request, manifest });
    res.json({ applied: true, live, job, trident, files: files.map(file => ({ path: file.path, mode: file.mode })) });
  } catch (err) {
    res.status(500).json({ applied: false, error: err.message, trident });
  }
});

app.get('/builder/code-rollbacks', requireAdmin, (req, res) => {
  res.json({ rollbacks: listCodeRollbacks() });
});

app.post('/builder/code-rollback', requireAdmin, (req, res) => {
  const restored = rollbackCodeChange(req.body?.id || null);
  if (!restored) return res.status(404).json({ error: 'no code rollback available' });
  logEvent('builder', 'code-rollback', `Restored code change ${restored.id}`, restored);
  res.json({ restored: true, rollback: restored });
});

app.get('/builder/files', requireAdmin, (req, res) => {
  const root = req.query.root === 'watch' ? WATCH_DIR : SANDBOX_DIR;
  const rel = safeRelativePath(req.query.path || '.') || '.';
  const base = resolveInside(root, rel);
  if (!base || !fs.existsSync(base)) return res.status(404).json({ error: 'path not found' });
  const stat = fs.statSync(base);
  if (!stat.isDirectory()) return res.json({ path: rel, file: true, size: stat.size, mtime: stat.mtimeMs });
  const entries = fs.readdirSync(base, { withFileTypes: true }).map(entry => {
    const full = path.join(base, entry.name);
    const entryStat = fs.statSync(full);
    return { name: entry.name, path: path.relative(root, full), directory: entry.isDirectory(), size: entryStat.size, mtime: entryStat.mtimeMs };
  });
  res.json({ root: req.query.root === 'watch' ? 'watch' : 'sandbox', path: rel, entries });
});

app.get('/builder/file', requireAdmin, (req, res) => {
  const root = req.query.root === 'watch' ? WATCH_DIR : SANDBOX_DIR;
  const target = resolveInside(root, req.query.path);
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) return res.status(404).json({ error: 'file not found' });
  res.json({ path: req.query.path, content: fs.readFileSync(target, 'utf8') });
});

app.post('/builder/file', requireAdmin, (req, res) => {
  const root = req.body.root === 'watch' ? WATCH_DIR : SANDBOX_DIR;
  const target = resolveInside(root, req.body.path);
  if (!target) return res.status(400).json({ error: 'invalid path' });
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, String(req.body.content || ''));
  logEvent('builder', 'admin', `Edited ${req.body.root || 'sandbox'}:${req.body.path}`);
  res.json({ saved: true, path: req.body.path, root: req.body.root === 'watch' ? 'watch' : 'sandbox' });
});

app.post('/builder/promote', requireAdmin, (req, res) => {
  const target = resolveInside(SANDBOX_DIR, req.body.path || 'updates');
  if (!target || !fs.existsSync(target) || !fs.statSync(target).isDirectory()) return res.status(404).json({ error: 'sandbox folder not found' });
  const job = { id: `manual_${Date.now()}`, source: req.body.path || 'manual', status: 'manual-promote', started_at: Date.now() };
  promoteSandbox(job, target);
  job.finished_at = Date.now();
  pushBuilderJob(job);
  logEvent('builder', 'admin', `Promoted sandbox folder ${req.body.path || 'updates'}`, job);
  res.json({ promoted: true, job, url: '/autoload' });
});

app.get('/builder/rollbacks', requireAdmin, (req, res) => {
  res.json({ rollbacks: listRollbacks(), current: SYSTEM.builder.latest_promoted || null });
});

app.post('/builder/rollback', requireAdmin, (req, res) => {
  const restored = rollbackAutoload(req.body?.name || null);
  if (!restored) return res.status(404).json({ error: 'no rollback is available yet' });
  logEvent('builder', 'rollback', `Restored ${restored.name}`, restored);
  res.json({ restored: true, rollback: restored, url: '/autoload' });
});

app.get('/github/status', requireAdmin, (req, res) => {
  res.json({ github: gitSyncStatus(), timestamp: Date.now() });
});

app.post('/github/pull', requireAdmin, (req, res) => {
  const script = path.join(__dirname, 'phone', 'github-pull-updates.sh');
  if (!fs.existsSync(script)) return res.status(404).json({ error: 'github pull script not found' });
  const child = spawn('bash', [script, '--yes'], { cwd: __dirname, detached: true, stdio: 'ignore' });
  child.unref();
  logEvent('github', 'pull', 'GitHub update pull started from dashboard');
  res.json({ started: true, pid: child.pid });
});

app.post('/github/prepare-commit', requireAdmin, (req, res) => {
  const script = path.join(__dirname, 'phone', 'github-prepare-commit.sh');
  if (!fs.existsSync(script)) return res.status(404).json({ error: 'github prepare script not found' });
  const child = spawn('bash', [script, '--report-only'], { cwd: __dirname, detached: true, stdio: 'ignore' });
  child.unref();
  logEvent('github', 'prepare', 'GitHub approval package started from dashboard');
  res.json({ started: true, pid: child.pid, approvals_dir: GITHUB_APPROVAL_DIR });
});

app.get('/substrate/status', (req, res) => {
  res.json({ substrate: 'online', system: SYSTEM, timestamp: Date.now() });
});

app.get('/substrate/frontpage', (req, res) => {
  res.json({
    public: { title: 'Cynthia Substrate', routes: ['/', '/client', '/admin'] },
    mcp: SYSTEM.mcp,
    agents: SYSTEM.agents,
    bodies: SYSTEM.bodies,
    last_event: SYSTEM.events[0] || null
  });
});

// ── /admin/status ───────────────────────────────────────────────
app.get('/admin/status', requireAdmin, (req, res) => {
  res.json({
    synthia: SYSTEM.synthia,
    render: SYSTEM.render,
    trident: SYSTEM.trident,
    mcp: SYSTEM.mcp,
    supabase: SYSTEM.supabase,
    agents: SYSTEM.agents,
    bodies: SYSTEM.bodies,
    last_error: SYSTEM.last_error,
    last_routed_message: SYSTEM.last_routed_message,
    event_count: SYSTEM.events.length,
    timestamp: Date.now()
  });
});

// ── /mcp/status ─────────────────────────────────────────────────
app.get('/mcp/status', (req, res) => {
  res.json({ mcp: SYSTEM.mcp });
});

// ── /mcp/agents ─────────────────────────────────────────────────
app.get('/mcp/agents', (req, res) => {
  res.json({ agents: SYSTEM.agents });
});

// ── /mcp/bootstrap ──────────────────────────────────────────────
app.post('/mcp/bootstrap', requireAdmin, (req, res) => {
  const result = wakeMCP();
  res.json({ ...result, mcp: SYSTEM.mcp });
});

// ── /mcp/bodies ─────────────────────────────────────────────────
app.get('/mcp/bodies', (req, res) => {
  res.json({ bodies: SYSTEM.bodies, timestamp: Date.now() });
});

// ── /mcp/join ───────────────────────────────────────────────────
app.post('/mcp/join', (req, res) => {
  const { identity, device, goal, role } = req.body;
  const key = String(identity || '').toLowerCase();
  if (!['alexis', 'adaya', 'joe'].includes(key)) return res.status(400).json({ error: 'POC only accepts alexis/adaya or joe' });
  const canonical = key === 'adaya' ? 'alexis' : key;
  SYSTEM.bodies[canonical] = {
    ...(SYSTEM.bodies[canonical] || {}),
    status: 'online',
    identity: canonical === 'alexis' ? 'adaya' : 'joe',
    device: device || 'unknown-device',
    goal: goal || null,
    role: role || (canonical === 'alexis' ? 'owner' : 'participant'),
    mesh_body_id: `${canonical}-${device || 'device'}-${Date.now()}`,
    last_seen: Date.now()
  };
  logEvent('body', canonical, `Joined mesh from ${device || 'unknown-device'}`, SYSTEM.bodies[canonical]);
  res.json({ joined: true, body: SYSTEM.bodies[canonical], bodies: SYSTEM.bodies });
});

// ── /mcp/route ────────────────────────────────────────────────
app.post('/mcp/route', (req, res) => {
  const { from, to, target_agent, message, intent, project } = req.body;
  const target = String(to || target_agent || 'chatgpt').toLowerCase();
  if (!message) return res.status(400).json({ error: 'message required' });
  const item = {
    id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'routed-message',
    from: from || 'unknown',
    to: target,
    message,
    intent: intent || 'message',
    project: project || 'synthia',
    created_at: Date.now()
  };
  enqueue(target, item);
  SYSTEM.last_routed_message = message;
  logEvent('route', item.from, `Routed to ${target}: ${String(message).substring(0, 80)}`, item);
  persistState();
  res.json({ routed: true, message: item, inbox: target, timestamp: Date.now() });
});

// ── /mcp/events ─────────────────────────────────────────────────
app.get('/mcp/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json({
    events: SYSTEM.events.slice(0, limit),
    total: SYSTEM.events.length
  });
});


// ── /mcp/agents/join ───────────────────────────────────────────
app.post('/mcp/agents/join', (req, res) => {
  const { name, agent, capabilities, endpoint } = req.body;
  const agentName = String(name || agent || '').toLowerCase();
  if (!agentName) return res.status(400).json({ error: 'name or agent required' });
  SYSTEM.agents[agentName] ||= { status: 'unknown', type: 'ai', registered: false, last_seen: null };
  SYSTEM.agents[agentName] = { ...SYSTEM.agents[agentName], status: 'registered', registered: true, capabilities: capabilities || SYSTEM.agents[agentName].capabilities || [], endpoint: endpoint || SYSTEM.agents[agentName].endpoint || null, last_seen: Date.now() };
  logEvent('agent', agentName, `${agentName} joined MCP messenger`, SYSTEM.agents[agentName]);
  res.json({ joined: true, agent: SYSTEM.agents[agentName], agents: SYSTEM.agents });
});

// ── /mcp/message ────────────────────────────────────────────────
app.post('/mcp/message', (req, res) => {
  const { from, to, message, text, type, project, visibility } = req.body;
  const body = message || text;
  if (!from || !to || !body) return res.status(400).json({ error: 'from, to, and message/text required' });
  const item = { id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, kind: 'message', from, to, message: body, type: type || 'message', project: project || 'cynthia-poc', visibility: visibility || 'scoped', created_at: Date.now() };
  enqueue(to, item);
  SYSTEM.last_routed_message = body;
  logEvent('message', from, `Message to ${to}: ${String(body).substring(0, 80)}`, item);
  res.json({ sent: true, message: item, inbox: to });
});

// ── /mcp/artifact ───────────────────────────────────────────────
app.post('/mcp/artifact', (req, res) => {
  const artifact = normalizeArtifact(req.body, 'artifact');
  logEvent('artifact', artifact.from_agent, `Artifact queued for ${artifact.target_agent}: ${artifact.title}`, artifact);
  res.json({ received: true, artifact, inbox: artifact.target_agent });
});

// ── /mcp/capture ────────────────────────────────────────────────
app.post('/mcp/capture', (req, res) => {
  const { source_surface, app, screenshot, elements, extracted_text, device, identity, target_agent } = req.body;
  const capture = { id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, source_surface: source_surface || app || 'mobile-screen', device: device || 'unknown-device', identity: identity || 'unknown', screenshot_present: !!screenshot, elements: elements || [], extracted_text: extracted_text || '', created_at: Date.now() };
  SYSTEM.mobile_captures.unshift(capture);
  if (SYSTEM.mobile_captures.length > 200) SYSTEM.mobile_captures.pop();
  const artifact = normalizeArtifact({ from_agent: 'mobile-mcp', created_by: identity || 'unknown', target_agent: target_agent || 'chatgpt', artifact_type: 'mobile_capture', target_area: app || source_surface || 'unknown_surface', title: `Mobile MCP capture: ${app || source_surface || 'screen'}`, content: extracted_text || JSON.stringify({ elements: elements || [] }).slice(0, 10000), instructions: 'Classify this captured screen/context and place it where it belongs.', capture }, 'capture');
  logEvent('capture', 'mobile-mcp', `Captured ${capture.source_surface} and queued for ${artifact.target_agent}`, { capture, artifact_id: artifact.id });
  res.json({ captured: true, capture, artifact, inbox: artifact.target_agent });
});

// ── /mcp/artifacts ──────────────────────────────────────────────
app.get('/mcp/artifacts', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json({ artifacts: (SYSTEM.artifacts || []).slice(0, limit), total: (SYSTEM.artifacts || []).length });
});

// ── /mcp/artifacts/:id ─────────────────────────────────────────
app.get('/mcp/artifacts/:id', (req, res) => {
  const artifact = (SYSTEM.artifacts || []).find(a => a.id === req.params.id);
  if (!artifact) return res.status(404).json({ error: 'artifact not found' });
  res.json({ artifact });
});

// ── /mcp/inbox/:agent ──────────────────────────────────────────
app.get('/mcp/inbox/:agent', (req, res) => {
  ensureQueues();
  const agent = String(req.params.agent || '').toLowerCase();
  res.json({ endpoint: agent, inbox: SYSTEM.inboxes[agent] || [], count: (SYSTEM.inboxes[agent] || []).length });
});

// ── /mcp/implement ──────────────────────────────────────────────
app.post('/mcp/implement', (req, res) => {
  const { artifact_id, implemented_by, status, files_changed, notes, blocked_reason } = req.body;
  if (!artifact_id) return res.status(400).json({ error: 'artifact_id required' });
  const artifact = (SYSTEM.artifacts || []).find(a => a.id === artifact_id);
  const implementation = { id: `impl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, artifact_id, implemented_by: implemented_by || 'chatgpt', status: status || 'reported', files_changed: files_changed || [], notes: notes || null, blocked_reason: blocked_reason || null, created_at: Date.now() };
  SYSTEM.implementations.unshift(implementation);
  if (artifact) { artifact.status = implementation.status; artifact.updated_at = Date.now(); }
  logEvent('implementation', implementation.implemented_by, `Implementation ${implementation.status} for ${artifact_id}`, implementation);
  persistState();
  res.json({ recorded: true, implementation, artifact: artifact || null });
});

// ── /mcp/bridge/status ─────────────────────────────────────────
app.get('/mcp/bridge/status', (req, res) => {
  ensureQueues();
  res.json({ bridge: SYSTEM.bridge, inbox_counts: Object.fromEntries(Object.entries(SYSTEM.inboxes).map(([k,v]) => [k, v.length])), artifact_count: SYSTEM.artifacts.length, capture_count: SYSTEM.mobile_captures.length });
});

app.post('/mcp/bridge/kimi-to-chatgpt', (req, res) => {
  const artifact = normalizeArtifact({ ...req.body, from_agent: 'kimi', target_agent: 'chatgpt' }, 'artifact');
  logEvent('bridge', 'kimi', `Kimi → ChatGPT handoff: ${artifact.title}`, artifact);
  res.json({ bridged: true, direction: 'kimi-to-chatgpt', artifact });
});

app.post('/mcp/bridge/chatgpt-to-kimi', (req, res) => {
  const artifact = normalizeArtifact({ ...req.body, from_agent: 'chatgpt', target_agent: 'kimi' }, 'artifact');
  logEvent('bridge', 'chatgpt', `ChatGPT → Kimi handoff: ${artifact.title}`, artifact);
  res.json({ bridged: true, direction: 'chatgpt-to-kimi', artifact });
});

// ── /render/status ──────────────────────────────────────────────
app.get('/render/status', (req, res) => {
  SYSTEM.render.status = process.env.RENDER ? 'connected' : (process.env.RENDER_EXTERNAL_URL ? 'connected' : 'local_or_unknown');
  SYSTEM.render.last_check = Date.now();
  res.json({ render: SYSTEM.render });
});

// ── /trident/status ─────────────────────────────────────────────
app.get('/trident/status', async (req, res) => {
  const trident = req.query.check === '1' ? await checkTrident() : SYSTEM.trident;
  res.json({ trident });
});

app.post('/trident/check', requireAdmin, async (req, res) => {
  const trident = await checkTrident();
  res.json({ checked: true, trident });
});

// ── /trident/register ───────────────────────────────────────────
app.post('/trident/register', requireAdmin, (req, res) => {
  const { endpoint } = req.body;
  SYSTEM.trident.endpoint = endpoint || DEFAULT_TRIDENT_URL;
  SYSTEM.trident.status = 'registered';
  logEvent('trident', 'admin', `Trident endpoint registered: ${SYSTEM.trident.endpoint}`);
  persistState();
  res.json({ trident: SYSTEM.trident });
});

app.post('/trident/generate', requireAdmin, async (req, res) => {
  try {
    const result = await callTrident('/generate', req.body);
    logEvent('trident', 'generate', `Generated with head=${req.body.head || 'auto'}`, { prompt: String(req.body.prompt || '').slice(0, 120), result });
    res.json({ ok: true, result });
  } catch (err) {
    logEvent('error', 'trident', err.message);
    res.status(502).json({ ok: false, error: err.message, trident: SYSTEM.trident });
  }
});

app.post('/trident/rag/add', requireAdmin, async (req, res) => {
  try {
    const result = await callTrident('/rag/add', req.body);
    logEvent('trident', 'rag', `Added RAG chunk: ${String(req.body.source || 'synthia')}`, result);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/trident/rag/search', requireAdmin, async (req, res) => {
  try {
    const result = await callTrident('/rag/search', req.body);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/trident/router', requireAdmin, async (req, res) => {
  try {
    const result = await callTrident('/router', req.body);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/trident/builder/handoff', requireAdmin, async (req, res) => {
  try {
    const latest = SYSTEM.builder.jobs[0] || null;
    const payload = req.body.prompt ? req.body : {
      prompt: `Review this Synthia builder job and suggest next code/build action:\n${JSON.stringify(latest || SYSTEM.builder, null, 2).slice(0, 6000)}`,
      head: 'code',
      max_tokens: 128,
      rag_query: 'Synthia builder self compile Termux Android'
    };
    const result = await callTrident('/generate', payload);
    logEvent('trident', 'builder', 'Builder job handed to Trident', { latest_job: latest?.id || null, result });
    res.json({ ok: true, latest_job: latest, result });
  } catch (err) {
    logEvent('error', 'trident', err.message);
    res.status(502).json({ ok: false, error: err.message });
  }
});

// ── /admin/agents/register ──────────────────────────────────────
app.post('/admin/agents/register', requireAdmin, (req, res) => {
  const { name, api_key } = req.body;
  const result = registerAgent(name, { api_key });
  res.json(result);
});

// ── /admin/bodies/status ────────────────────────────────────────
app.post('/admin/bodies/status', requireAdmin, (req, res) => {
  const { name, status, device } = req.body;
  const body = SYSTEM.bodies[name.toLowerCase()];
  if (body) {
    body.status = status;
    body.last_seen = Date.now();
    if (device) body.device = device;
    logEvent('body', name, `Status: ${status}`, { device });
  }
  res.json({ bodies: SYSTEM.bodies });
});

// ── /admin/test-message ─────────────────────────────────────────
app.post('/admin/test-message', requireAdmin, (req, res) => {
  const { text } = req.body;
  SYSTEM.last_routed_message = text;
  logEvent('route', 'test', `Test message: ${text}`);
  res.json({ sent: true, text, timestamp: Date.now() });
});

// ═══════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/terminal-ui', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal', 'index.html'));
});

app.get('/builder-admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'builder-admin', 'index.html'));
});

app.get('/cynthia-organism', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps', 'cynthia-organism-browser', 'index.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client', 'index.html'));
});


// Status only: MCP remains a message passer; Pure Synthia is a separate organism process.
app.get('/mcp/synthia/status', (req, res) => {
  res.json(pureSynthiaStatus());
});

// ═══════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('🜁 SYNTHIA ADMIN SERVER v1.0');
  console.log(`   Port: ${PORT}`);
  console.log(`   Public:  /`);
  console.log(`   Admin:   /admin`);
  console.log(`   Client:  /client`);
  console.log(`   Terminal: ws://localhost:${PORT}/terminal`);
  console.log('');
  ensureQueues();
  console.log('   Auto-starting MCP...');
  registerAgent('kimi', { api_key: process.env.KIMI_API_KEY ? 'configured' : null });
  registerAgent('chatgpt', { api_key: process.env.OPENAI_API_KEY ? 'configured' : null });
  wakeMCP();
  checkTrident();
  startBuilderWatcher();
  startPureSynthiaDaemon();
  startPhoneSync();
  console.log('   Phone sync: ' + (loadPhoneSyncConfig() ? 'configured' : 'not configured'));
  console.log('   Ready.');
});


function shutdownResidence(signal){
  console.log(`Residence shutdown: ${signal}`);
  stopPureSynthiaDaemon();
  if (phoneSyncTimer) clearInterval(phoneSyncTimer);
  phoneSyncTimer = null;
  savePhoneSyncState();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}
process.once('SIGTERM', () => shutdownResidence('SIGTERM'));
process.once('SIGINT', () => shutdownResidence('SIGINT'));
