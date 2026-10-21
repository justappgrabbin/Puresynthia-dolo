/**
 * Synthia Kiosk Server — Express + WebSocket + MCP
 * Serves the Trident Kiosk UI, handles chat, executes intents
 */
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { join, dirname } from 'path';
import { fileURLToPathPath } from 'url';

import { MemoryStore } from './utils/memory.js';
import { IntentParser } from './engine/intent-parser.js';
import { Planner } from './engine/planner.js';
import { Executor } from './engine/executor.js';
import { CoreTermuxTools } from './tools/core-termux.js';
import { DeviceControlTools } from './tools/device-control.js';
import { runShell } from './utils/shell.js';
import { RAGRouter } from './rag/router.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.SYNTHIA_PORT ? parseInt(process.env.SYNTHIA_PORT) : 8765;

// ─── Core Services ───
const memory = new MemoryStore();
await memory.init();

const ragRouter = new RAGRouter();
await ragRouter.init();

const parser = new IntentParser();
const planner = new Planner(memory);
const executor = new Executor(memory);
const coreTermux = new CoreTermuxTools();
const deviceControl = new DeviceControlTools();

// Wire executor logs to broadcast
const clients = new Set<WebSocket>();
function broadcast(type: string, payload: any) {
  const msg = JSON.stringify({ type, payload, timestamp: Date.now() });
  clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
}

executor.onLog = (msg, type) => {
  broadcast('log', { message: msg, level: type, time: new Date().toISOString() });
};

// ─── Express App ───
const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Health check
app.get('/api/status', async (req, res) => {
  const stats = await memory.getStats();
  const coreVer = await coreTermux.getVersion().catch(() => 'not installed');
  const deviceState = await deviceControl.getDeviceState().catch(() => null);
  res.json({
    running: true,
    port: PORT,
    coreTermux: coreVer,
    memory: stats,
    device: deviceState,
    uptime: process.uptime(),
  });
});

// Execute intent via HTTP
app.post('/api/intent', async (req, res) => {
  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: 'intent required' });

  const parsed = parser.parse(intent);
  const plan = await planner.buildPlan(parsed);

  broadcast('plan', { planId: plan.id, intent, steps: plan.steps.length });

  const result = await executor.execute(plan);

  // Save to chat history
  await memory.addChatMessage({
    id: `msg_${Date.now()}`,
    role: 'user',
    content: intent,
    timestamp: Date.now(),
  });
  await memory.addChatMessage({
    id: `msg_${Date.now()}_reply`,
    role: 'agent',
    content: result.success ? result.output : `Failed: ${result.output}`,
    timestamp: Date.now(),
    plan,
    outcome: result,
  });

  res.json({ success: result.success, output: result.output, learnings: result.learnings, planId: plan.id });
});

// Shell execution via HTTP
app.post('/api/shell', async (req, res) => {
  const { command, cwd, timeout } = req.body;
  const result = await runShell(command, { cwd, timeout: timeout || 60000 });
  res.json(result);
});

// Chat history
app.get('/api/chat', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = await memory.getChatHistory(limit);
  res.json(history);
});

// Device control endpoints
app.get('/api/device/state', async (req, res) => {
  const state = await deviceControl.getDeviceState();
  res.json(state);
});

app.post('/api/device/screenshot', async (req, res) => {
  const path = await deviceControl.takeScreenshot(req.body.path);
  res.json({ path });
});

app.post('/api/device/tap', async (req, res) => {
  const { x, y } = req.body;
  const result = await deviceControl.tap(x, y);
  res.json({ result });
});

app.post('/api/device/swipe', async (req, res) => {
  const { x1, y1, x2, y2, duration } = req.body;
  const result = await deviceControl.swipe(x1, y1, x2, y2, duration);
  res.json({ result });
});

app.get('/api/device/apps', async (req, res) => {
  const apps = await deviceControl.listApps();
  res.json(apps.slice(0, 50));
});

app.post('/api/device/launch', async (req, res) => {
  const result = await deviceControl.launchApp(req.body.packageName);
  res.json({ result });
});

app.post('/api/device/press', async (req, res) => {
  const result = await deviceControl.pressButton(req.body.button);
  res.json({ result });
});

// Trident component data
app.get('/api/trident/components', (req, res) => {
  res.json(COMPONENTS);
});

app.get('/api/trident/slots', (req, res) => {
  res.json(SLOTS);
});

app.get('/api/trident/presets', (req, res) => {
  res.json(PRESETS);
});

// ─── WebSocket Server ───
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WS] Client connected');
  ws.send(JSON.stringify({ type: 'connected', payload: { message: 'Connected to Synthia Kiosk' } }));

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'rag_query': {
          const { text, domain, sources } = msg.payload;
          broadcast('log', { message: `RAG query: ${text}`, level: 'info', time: new Date().toISOString() });
          try {
            const result = await ragRouter.query(text, { domain, sources });
            ws.send(JSON.stringify({
              type: 'rag_result',
              payload: { text, result: result.synthesized, sources: result.sources, confidence: result.confidence }
            }));
          } catch (err: any) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: err.message } }));
          }
          break;
        }
        case 'chat': {
          const { text } = msg.payload;
          await memory.addChatMessage({ id: `msg_${Date.now()}`, role: 'user', content: text, timestamp: Date.now() });

          // Check if it's an intent
          const parsed = parser.parse(text);
          if (parsed.confidence > 0.3) {
            const plan = await planner.buildPlan(parsed);
            broadcast('plan', { planId: plan.id, intent: text, steps: plan.steps.length });

            const result = await executor.execute(plan);

            await memory.addChatMessage({
              id: `msg_${Date.now()}_reply`,
              role: 'agent',
              content: result.success 
                ? `✅ Done! ${result.output.substring(0, 500)}${result.output.length > 500 ? '...' : ''}`
                : `❌ Issue: ${result.output.substring(0, 500)}`,
              timestamp: Date.now(),
              plan,
              outcome: result,
            });

            ws.send(JSON.stringify({
              type: 'chat',
              payload: {
                role: 'agent',
                content: result.success ? 'Task completed successfully.' : 'Task failed. Check logs for details.',
                planId: plan.id,
                success: result.success,
              }
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'chat',
              payload: { role: 'agent', content: `I understood: "${text}". How can I help?` }
            }));
          }
          break;
        }

        case 'intent': {
          const { intent } = msg.payload;
          const parsed = parser.parse(intent);
          const plan = await planner.buildPlan(parsed);
          broadcast('plan', { planId: plan.id, intent, steps: plan.steps.length });
          const result = await executor.execute(plan);
          ws.send(JSON.stringify({
            type: 'intent_result',
            payload: { planId: plan.id, success: result.success, output: result.output, learnings: result.learnings }
          }));
          break;
        }

        case 'shell': {
          const { command } = msg.payload;
          const result = await runShell(command, { timeout: 60000 });
          ws.send(JSON.stringify({ type: 'shell_result', payload: result }));
          break;
        }

        case 'build': {
          const { assembly } = msg.payload;
          broadcast('build', { status: 'started', assembly });
          // Simulate build steps
          const steps = ['Fetching', 'Resolving', 'Assembling', 'Configuring', 'Building', 'Packaging'];
          for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
            broadcast('build', { status: 'progress', step: steps[i], pct: Math.round(((i + 1) / steps.length) * 100) });
          }
          broadcast('build', { status: 'complete', message: 'Build successful' });
          break;
        }

        case 'deploy': {
          const { assembly } = msg.payload;
          broadcast('deploy', { status: 'started', assembly });
          const steps = ['Initializing', 'Packaging', 'Writing configs', 'Preparing network', 'Configuring MCP', 'Building bundle', 'Health checks'];
          for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
            broadcast('deploy', { status: 'progress', step: steps[i], pct: Math.round(((i + 1) / steps.length) * 100) });
          }
          broadcast('deploy', { status: 'complete', message: 'Deployment successful' });
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', payload: { time: Date.now() } }));
          break;
        }
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: err.message } }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WS] Client disconnected');
  });
});

// ─── MCP Server (Stdio) ───
const mcpServer = new McpServer(
  { name: 'synthia-kiosk', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'synthia_intent', description: 'Execute natural language intent', inputSchema: { type: 'object', properties: { intent: { type: 'string' }, context: { type: 'object' } }, required: ['intent'] } },
    { name: 'synthia_shell', description: 'Run shell command', inputSchema: { type: 'object', properties: { command: { type: 'string' }, cwd: { type: 'string' }, timeout: { type: 'number' } }, required: ['command'] } },
    { name: 'synthia_core_install', description: 'Install core-termux module', inputSchema: { type: 'object', properties: { module: { type: 'string' }, tools: { type: 'array', items: { type: 'string' } } }, required: ['module'] } },
    { name: 'synthia_core_init', description: 'Initialize project', inputSchema: { type: 'object', properties: { template: { type: 'string' }, cwd: { type: 'string' } }, required: ['template'] } },
    { name: 'synthia_core_pg', description: 'PostgreSQL management', inputSchema: { type: 'object', properties: { command: { type: 'string' }, arg: { type: 'string' } }, required: ['command'] } },
    { name: 'synthia_device_state', description: 'Get device state', inputSchema: { type: 'object', properties: {} } },
    { name: 'synthia_device_screenshot', description: 'Take screenshot', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
    { name: 'synthia_device_tap', description: 'Tap screen', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
    { name: 'synthia_device_swipe', description: 'Swipe screen', inputSchema: { type: 'object', properties: { x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' }, duration: { type: 'number' } }, required: ['x1', 'y1', 'x2', 'y2'] } },
    { name: 'synthia_device_list_apps', description: 'List apps', inputSchema: { type: 'object', properties: {} } },
    { name: 'synthia_device_launch_app', description: 'Launch app', inputSchema: { type: 'object', properties: { packageName: { type: 'string' } }, required: ['packageName'] } },
    { name: 'synthia_device_press_button', description: 'Press button', inputSchema: { type: 'object', properties: { button: { type: 'string' } }, required: ['button'] } },
    { name: 'synthia_brain_search', description: 'Search brain', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'synthia_memory_stats', description: 'Memory stats', inputSchema: { type: 'object', properties: {} } },
    { name: 'synthia_status', description: 'Full status', inputSchema: { type: 'object', properties: {} } },
  ]
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'synthia_intent': {
        const parsed = parser.parse(args.intent as string);
        const plan = await planner.buildPlan(parsed);
        const result = await executor.execute(plan);
        return { content: [{ type: 'text', text: `${result.success ? '✅' : '❌'} ${args.intent}\n\n${result.output}` }] };
      }
      case 'synthia_shell': {
        const result = await runShell(args.command as string, { cwd: args.cwd as string, timeout: args.timeout as number });
        return { content: [{ type: 'text', text: `${result.exitCode === 0 ? '✅' : '❌'} ${args.command}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}` }] };
      }
      case 'synthia_core_install': {
        const out = await coreTermux.install(args.module as string, args.tools as string[]);
        return { content: [{ type: 'text', text: `✅ Installed ${args.module}\n\n${out}` }] };
      }
      case 'synthia_core_init': {
        const out = await coreTermux.initProject(args.template as string, args.cwd as string);
        return { content: [{ type: 'text', text: `✅ Initialized ${args.template}\n\n${out}` }] };
      }
      case 'synthia_core_pg': {
        const out = await coreTermux.pg(args.command as string, args.arg as string);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_device_state': {
        const state = await deviceControl.getDeviceState();
        return { content: [{ type: 'text', text: JSON.stringify(state, null, 2) }] };
      }
      case 'synthia_device_screenshot': {
        const path = await deviceControl.takeScreenshot(args.path as string);
        return { content: [{ type: 'text', text: `📸 ${path}` }] };
      }
      case 'synthia_device_tap': {
        const out = await deviceControl.tap(args.x as number, args.y as number);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_device_swipe': {
        const out = await deviceControl.swipe(args.x1 as number, args.y1 as number, args.x2 as number, args.y2 as number, args.duration as number);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_device_list_apps': {
        const apps = await deviceControl.listApps();
        return { content: [{ type: 'text', text: apps.slice(0, 30).map(a => `${a.package} — ${a.name}`).join('\n') }] };
      }
      case 'synthia_device_launch_app': {
        const out = await deviceControl.launchApp(args.packageName as string);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_device_press_button': {
        const out = await deviceControl.pressButton(args.button as string);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_brain_search': {
        const out = await coreTermux.brainSearch(args.query as string);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'synthia_memory_stats': {
        const stats = await memory.getStats();
        return { content: [{ type: 'text', text: `Outcomes: ${stats.outcomes}\nMemories: ${stats.memories}\nMessages: ${stats.messages}` }] };
      }
      case 'synthia_rag_query': {
        const result = await ragRouter.query(args.text as string, {
          domain: args.domain as any,
          topK: args.topK as number,
          sources: args.sources as string[],
          fusion: args.fusion as any,
        });
        return { content: [{ type: 'text', text: result.synthesized }] };
      }
      case 'synthia_rag_sources': {
        const stats = await ragRouter.getAllStats();
        const lines = ['📚 RAG Sources'];
        for (const [name, stat] of Object.entries(stats)) {
          lines.push(`${name}: ${stat.documents} docs, ${stat.available ? '✅' : '❌'}`);
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'synthia_status': {
        const lines = ['🧠 Synthia Kiosk Status'];
        try { lines.push(`Core: ${await coreTermux.getVersion()}`); } catch { lines.push('Core: not installed'); }
        try { const s = await deviceControl.getDeviceState(); lines.push(`Device: ${s.orientation}, battery ${s.batteryLevel}%`); } catch (e: any) { lines.push(`Device: ${e.message}`); }
        const stats = await memory.getStats();
        lines.push(`Memory: ${stats.outcomes} outcomes, ${stats.memories} memories, ${stats.messages} messages`);
        lines.push(`Server: http://localhost:${PORT}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      default: throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true };
  }
});

// ─── Trident Data ───
const COMPONENTS = [
  { id: 'model', name: 'model.py', badge: 'core', badgeClass: 'badge-core', desc: '1M param transformer with 3 specialist heads: Code, Math, Research.', size: '~45KB', deps: ['torch', 'numpy'], config: { head_mode: { type: 'select', options: ['auto', 'code', 'math', 'research'], default: 'auto', label: 'Head Mode' }, temperature: { type: 'number', default: 0.7, min: 0.1, max: 2.0, step: 0.1, label: 'Temperature' }, max_tokens: { type: 'number', default: 512, min: 64, max: 2048, step: 64, label: 'Max Tokens' }, use_rag: { type: 'checkbox', default: true, label: 'Enable RAG' } } },
  { id: 'rag', name: 'rag.py', badge: 'rag', badgeClass: 'badge-rag', desc: 'Python chunk store + P2P RAG node. Local embedding storage with aiortc WebRTC.', size: '~32KB', deps: ['aiortc', 'numpy', 'sentence-transformers'], config: { chunk_size: { type: 'number', default: 512, min: 128, max: 2048, step: 128, label: 'Chunk Size' }, top_k: { type: 'number', default: 5, min: 1, max: 20, step: 1, label: 'Top-K' }, embedding_model: { type: 'select', options: ['all-MiniLM-L6-v2', 'all-mpnet-base-v2'], default: 'all-MiniLM-L6-v2', label: 'Embed Model' }, p2p_enabled: { type: 'checkbox', default: true, label: 'P2P Mode' } } },
  { id: 'rag_client', name: 'rag_client.js', badge: 'client', badgeClass: 'badge-client', desc: 'Browser P2P RAG client. WebRTC DataChannel for connecting to Trident nodes.', size: '~18KB', deps: ['webrtc-adapter'], config: { signaling_url: { type: 'text', default: 'ws://localhost:8765', label: 'Signaling URL' }, stun_server: { type: 'text', default: 'stun:stun.l.google.com:19302', label: 'STUN Server' }, auto_connect: { type: 'checkbox', default: false, label: 'Auto-Connect' } } },
  { id: 'signal_server', name: 'signal_server.py', badge: 'signal', badgeClass: 'badge-signal', desc: 'Minimal WebSocket signaling server. Handshake-only (~50 lines).', size: '~3KB', deps: ['websockets'], config: { host: { type: 'text', default: '0.0.0.0', label: 'Host' }, port: { type: 'number', default: 8765, min: 1000, max: 65535, step: 1, label: 'Port' }, cors_origins: { type: 'text', default: '*', label: 'CORS Origins' } } },
  { id: 'mcp_server', name: 'mcp_server.py', badge: 'mcp', badgeClass: 'badge-mcp', desc: 'FastMCP server exposing all Trident tools to Claude Desktop / any MCP client.', size: '~28KB', deps: ['fastmcp', 'mcp'], config: { transport: { type: 'select', options: ['stdio', 'sse', 'http'], default: 'stdio', label: 'Transport' }, port: { type: 'number', default: 3000, min: 1000, max: 65535, step: 1, label: 'Port' }, log_level: { type: 'select', options: ['debug', 'info', 'warn', 'error'], default: 'info', label: 'Log Level' } } },
  { id: 'train', name: 'train.py', badge: 'train', badgeClass: 'badge-train', desc: 'Training loop — toy data to real data. CPU-friendly. Fine-tune all 3 heads.', size: '~22KB', deps: ['torch', 'datasets'], config: { epochs: { type: 'number', default: 3, min: 1, max: 100, step: 1, label: 'Epochs' }, batch_size: { type: 'number', default: 4, min: 1, max: 32, step: 1, label: 'Batch Size' }, learning_rate: { type: 'number', default: 0.001, min: 0.0001, max: 0.01, step: 0.0001, label: 'LR' }, dataset: { type: 'select', options: ['toy', 'codeparrot', 'math_qa', 'custom'], default: 'toy', label: 'Dataset' } } },
];

const SLOTS = [
  { id: 'core', label: 'Core Engine', icon: '🧠', accepts: ['model'] },
  { id: 'knowledge', label: 'Knowledge Layer', icon: '📚', accepts: ['rag'] },
  { id: 'client', label: 'Client Interface', icon: '🌐', accepts: ['rag_client'] },
  { id: 'network', label: 'Network Layer', icon: '🔌', accepts: ['signal_server'] },
  { id: 'integration', label: 'Integration', icon: '🔧', accepts: ['mcp_server'] },
  { id: 'training', label: 'Training', icon: '🎓', accepts: ['train'] },
];

const PRESETS = {
  minimal: { name: 'Minimal', icon: '⚡', desc: 'Core model only', comps: ['model'] },
  full: { name: 'Full Stack', icon: '🔱', desc: 'All 6 modules', comps: ['model', 'rag', 'rag_client', 'signal_server', 'mcp_server', 'train'] },
  p2p: { name: 'P2P Node', icon: '🌐', desc: 'Model + RAG + P2P', comps: ['model', 'rag', 'rag_client', 'signal_server'] },
  mcp: { name: 'MCP Server', icon: '🔧', desc: 'Model + RAG + MCP', comps: ['model', 'rag', 'mcp_server'] },
};

// ─── Start ───
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🧠 Synthia Kiosk Server running on http://0.0.0.0:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`   MCP: stdio (for Claude/Cursor/Cline)`);
});

// Start MCP stdio transport in parallel
const mcpTransport = new StdioServerTransport();
mcpServer.connect(mcpTransport).then(() => {
  console.log('   MCP stdio transport connected');
});
