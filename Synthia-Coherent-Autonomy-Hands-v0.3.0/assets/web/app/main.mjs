import { SynthiaAutonomy } from './autonomy.mjs';
import { BUTTON_ACTIONS } from './button-contract.mjs';

const $ = id => document.getElementById(id);
const runtime = new SynthiaAutonomy({ heartbeatMs:5000 });
globalThis.SYNTHIA_AUTONOMY = runtime;

function safe(value) {
  try { return JSON.stringify(value, null, 2); }
  catch { return String(value); }
}

function output(label, value) {
  const text = `[${new Date().toLocaleTimeString()}] ${label}\n${typeof value === 'string' ? value : safe(value)}\n\n`;
  $('output').textContent = text + $('output').textContent;
}

function refreshStatus() {
  const status = runtime.status();
  $('lifeStatus').innerHTML =
    `<span class="pill ${status.running ? 'good' : 'muted'}">${status.running ? 'WATCHING' : 'STOPPED'}</span>` +
    `<span class="pill">tick ${status.tick}</span>` +
    `<span class="pill">pending ${status.queue.pending}</span>` +
    `<span class="pill">watchers ${status.watchers}</span>`;

  $('shellStatus').textContent = status.shell
    ? 'Termux/native shell bridge available. Manual commands only.'
    : 'No native shell bridge. Cynthia JavaScript execution remains available.';
  $('shellButton').disabled = !status.shell;

  const core = status.coreCapabilities;
  if ($('handsEvidence')) $('handsEvidence').textContent = safe(runtime.handsStatus());
  $('metrics').textContent =
    `UES wiring=${status.wiring.ok ? 'PASS' : 'FAIL'} · ` +
    `StateSpace=${core.stateSpace.length} exports · ATO=${core.ato.length} exports · ` +
    `Klein=${core.klein.length} exports · faculties=${status.hostFaculties.join(', ')}`;
}

async function guard(label, fn) {
  try {
    const value = await fn();
    output(label, value);
    refreshStatus();
    return value;
  } catch (error) {
    output(`${label} ERROR`, String(error?.stack || error?.message || error));
    refreshStatus();
    throw error;
  }
}

const handlers = {
  start: () => guard('START WATCH', async () => ({ started:runtime.start(), status:runtime.status() })),
  stop: () => guard('STOP WATCH', async () => ({ stopped:runtime.stop(), status:runtime.status() })),
  tick: () => guard('TICK', () => runtime.tick()),
  status: () => guard('STATUS', async () => runtime.status()),
  persist: () => guard('PERSIST', async () => runtime.persist()),
  restore: () => guard('RESTORE', async () => ({ restored:runtime.restore(), status:runtime.status() })),
  wiring: () => guard('WIRING AUDIT', async () => runtime.system.wiringAudit()),

  call: () => guard('PURE CALL', () => runtime.call($('synthiaInput').value)),
  chat: () => guard('CHAT', () => runtime.chat($('synthiaInput').value)),

  'watch-add': () => guard('WATCHER ADDED', async () =>
    runtime.addWatcher($('watchInput').value, Number($('watchEvery').value || 1))),
  'watch-clear': () => guard('WATCHERS DISABLED', async () => {
    runtime.clearWatchers();
    return runtime.status();
  }),

  'queue-add': () => guard('TASK QUEUED', async () =>
    runtime.enqueue($('queueKind').value, $('queueInput').value)),
  'queue-next': () => guard('QUEUE NEXT', async () => {
    const task = runtime.queue.find(item =>
      item.status === 'pending' || item.status === 'needs-approval'
    );
    if (!task) return { status:'empty' };
    return runtime.processTask(task.id, { manual:true });
  }),

  'run-js': () => guard('JAVASCRIPT', () => runtime.runJS($('jsInput').value)),
  'run-shell': () => guard('SHELL', () => runtime.runShell($('shellInput').value)),

  'artifact-run': () => guard('ARTIFACT', async () => {
    const file = $('artifactFile').files?.[0];
    if (!file) throw new Error('Choose an artifact first.');
    const content = await file.text();
    return runtime.executeArtifact({ name:file.name, type:file.type, content });
  }),

  'export-state': () => guard('EXPORT STATE', async () => {
    const state = runtime.exportState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `synthia-autonomy-state-${Date.now()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { downloaded:anchor.download };
  }),


  'hands-status': () => guard('HANDS STATUS', async () => {
    const value = runtime.handsStatus();
    $('handsEvidence').textContent = safe(value);
    return value;
  }),

  'hand-notify': () => guard('HAND NOTIFY', () =>
    runtime.useHand('notify', { text:$('handText').value }, { manual:true })),

  'hand-clipboard-read': () => guard('HAND CLIPBOARD READ', async () => {
    const value = await runtime.useHand('clipboard.read', {}, { manual:true });
    $('handText').value = String(value ?? '');
    return value;
  }),

  'hand-clipboard-write': () => guard('HAND CLIPBOARD WRITE', () =>
    runtime.useHand('clipboard.write', { text:$('handText').value }, { manual:true })),

  'hand-open-url': () => guard('HAND OPEN URL', () =>
    runtime.useHand('open.url', { url:$('handText').value }, { manual:true })),

  'hand-share-text': () => guard('HAND SHARE TEXT', () =>
    runtime.useHand('share.text', { text:$('handText').value }, { manual:true })),

  'hand-workspace-read': () => guard('HAND WORKSPACE READ', async () => {
    const value = await runtime.useHand(
      'workspace.read',
      { path:$('handPath').value },
      { manual:true }
    );
    $('handText').value = String(value ?? '');
    return value;
  }),

  'hand-workspace-write': () => guard('HAND WORKSPACE WRITE', () =>
    runtime.useHand(
      'workspace.write',
      { path:$('handPath').value, text:$('handText').value },
      { manual:true }
    )),

  'clear-output': async () => {
    $('output').textContent = '';
    refreshStatus();
  },
};

function buttonSelfTest() {
  const problems = [];
  const seenIds = new Set();

  const buttons = [...document.querySelectorAll('button[data-action]')];
  for (const button of buttons) {
    const action = button.dataset.action;
    if (!BUTTON_ACTIONS.includes(action)) problems.push(`HTML action absent from contract: ${action}`);
    if (typeof handlers[action] !== 'function') problems.push(`No handler for button: ${action}`);
    if (button.id) {
      if (seenIds.has(button.id)) problems.push(`Duplicate button id: ${button.id}`);
      seenIds.add(button.id);
    }
  }

  for (const action of BUTTON_ACTIONS) {
    if (!buttons.some(button => button.dataset.action === action)) {
      problems.push(`Contract action has no button: ${action}`);
    }
    if (typeof handlers[action] !== 'function') problems.push(`Contract action has no handler: ${action}`);
  }

  return {
    ok:problems.length === 0,
    buttons:buttons.length,
    handlers:Object.keys(handlers).length,
    problems,
  };
}

for (const button of document.querySelectorAll('button[data-action]')) {
  button.addEventListener('click', async event => {
    event.preventDefault();
    const action = button.dataset.action;
    try {
      await handlers[action]();
    } catch {
      // guard() already rendered the failure.
    }
  });
}

runtime.onEvent(event => {
  if (event.type === 'tick' || event.type.endsWith('error')) {
    output(`EVENT ${event.type}`, event.payload);
  }
  refreshStatus();
});

window.addEventListener('error', event => {
  output('WINDOW ERROR', String(event.error?.stack || event.message));
});
window.addEventListener('unhandledrejection', event => {
  output('UNHANDLED PROMISE', String(event.reason?.stack || event.reason));
});

(async function boot() {
  const buttons = buttonSelfTest();
  const wiring = runtime.system.wiringAudit();
  const core = runtime.core.capabilities();
  const sha = (await import('../trainable-browser/crypto-compat.mjs')).sha256Hex('abc');
  const shaOk = sha === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

  const problems = [];
  if (!buttons.ok) problems.push(...buttons.problems);
  if (!wiring.ok) problems.push('Universal Execution Spine wiring audit failed.');
  if (!core.stateSpace.length) problems.push('Trainable StateSpace exports are missing.');
  if (!core.ato.length) problems.push('Trainable ATO exports are missing.');
  if (!core.klein.length) problems.push('Trainable Klein exports are missing.');
  if (!shaOk) problems.push('Trainable browser SHA-256 compatibility test failed.');

  const report = {
    ok:problems.length === 0,
    buttonContract:buttons,
    uesWiring:wiring,
    trainableCore:{
      stateSpaceExports:core.stateSpace.length,
      atoExports:core.ato.length,
      kleinExports:core.klein.length,
    },
    cryptoCompatibility:shaOk,
    shellBridge:runtime.status().shell,
    problems,
  };

  $('boot').className = report.ok ? 'good' : 'bad';
  $('boot').textContent = report.ok
    ? `BOOT SELF-TEST PASS · ${buttons.buttons} buttons wired · UES + Trainable StateSpace/ATO/Klein live`
    : `BOOT SELF-TEST FAIL · ${problems.join(' · ')}`;

  output('BOOT REPORT', report);
  refreshStatus();
})();
