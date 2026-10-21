import { SynthiaSystem } from '../vendor/ues/src/synthia-system.mjs';
import {
  ConfidenceLedger,
  DeletionGuard,
  createAcodeHost,
} from '../vendor/trainable/ato/index.mjs';
import { SentenceMesh } from '../vendor/trainable/sentence-mesh.mjs';
import { StateRegistry } from '../trainable-browser/registration.mjs';
import { ScientistLoop } from '../trainable-browser/scientist-loop.mjs';
import { TrainingJournal } from '../trainable-browser/training-journal.mjs';
import { BookIngestBridge } from '../trainable-browser/book-ingest-bridge.mjs';
import SynthiaCoreRuntimeBrowser from '../trainable-browser/core-runtime.mjs';
import { runJavaScript } from './js-runtime.mjs';
import { SynthiaHands } from './hands.mjs';
import { EventWorkspace } from './event-workspace.mjs';
import { MeasuredState } from './measured-state.mjs';
import { EvolutionGate } from './evolution-gate.mjs';

const STORAGE_KEY = 'synthia:coherent-autonomy:v0.3.0';
const LEGACY_STORAGE_KEYS = [
  'synthia:coherent-autonomy:v0.2.0',
  'synthia:coherent-autonomy:v0.1.0',
];

const clone = value => {
  try { return structuredClone(value); }
  catch {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return String(value); }
  }
};

const now = () => new Date().toISOString();

function nativeShellAvailable() {
  return Boolean(
    globalThis.SynthiaAndroid &&
    typeof globalThis.SynthiaAndroid.runShell === 'function'
  );
}

async function nativeShell(command) {
  if (!nativeShellAvailable()) {
    throw new Error('Native Termux shell bridge is not available. JavaScript execution is still available locally.');
  }
  return globalThis.SynthiaAndroid.runShell(String(command));
}

export class SynthiaAutonomy {
  constructor({ heartbeatMs = 5000 } = {}) {
    this.system = new SynthiaSystem();
    this.core = new SynthiaCoreRuntimeBrowser();

    this.confidence = new ConfidenceLedger();
    this.deletions = new DeletionGuard();

    this.registry = new StateRegistry();
    this.sentences = new SentenceMesh();
    this.scientist = new ScientistLoop();
    this.training = new TrainingJournal();
    this.books = new BookIngestBridge({ registry:this.registry });

    this.host = createAcodeHost({
      workers: async input => {
        const code = typeof input === 'string' ? input : input?.code;
        const value = typeof input === 'object' ? input?.input : null;
        return runJavaScript(code, value);
      },
      terminal: nativeShellAvailable()
        ? async input => nativeShell(typeof input === 'string' ? input : input?.command)
        : null,
      storage: async input => this.storageFaculty(input),
    });

    this.system.registerRuntimeAdapter({
      id:'synthia-browser-js-worker',
      kinds:['javascript'],
      canRun:() => typeof Worker !== 'undefined',
      execute:async ({ artifact }) => {
        const run = await runJavaScript(artifact?.content ?? artifact?.source ?? '');
        return {
          ...run,
          engine:'synthia-browser-js-worker',
          stdout:run.logs ?? [],
          stderr:run.ok ? [] : [run.error],
        };
      },
    });

    this.heartbeatMs = Math.max(500, Number(heartbeatMs) || 5000);
    this.timer = null;
    this.tickCount = 0;
    this.queue = [];
    this.watchers = [];
    this.events = [];
    this.listeners = new Set();
    this.policyEvidence = [];

    // Re-entrant event field + factual self-state. Neither is a central planner.
    this.workspace = new EventWorkspace({ maxEvents:1000 });
    this.measured = new MeasuredState({ outcomeWindow:10 });
    this.evolution = new EvolutionGate({ failureThreshold:3 });
    this.hands = new SynthiaHands({ journal:this.training, workspace:this.workspace, runtime:this });

    this.installPolicies();
    this.restore();

    if (!this.registry.get('synthia:self')) {
      this.registry.register({
        entityId:'synthia:self',
        entityType:'organism',
        nativeAddress:{},
        source:{
          trainable:'Pure-Synthia-Trainable-Assembly-v0.4.2',
          execution:'Synthia-Universal-Execution-Spine-v0.4.0',
        },
        state:{ mode:'presence', autonomy:'bounded' },
      });
    }
  }

  installPolicies() {
    this.confidence.grant('call', {
      threshold:0.5,
      dataScopes:['local'],
      effects:['compute'],
    });
    this.confidence.grant('chat', {
      threshold:0.5,
      dataScopes:['local'],
      effects:['communicate'],
    });
    this.confidence.grant('execute-js', {
      threshold:0.75,
      dataScopes:['local'],
      effects:['execute-code'],
    });
    this.confidence.grant('hand', {
      threshold:0.5,
      dataScopes:['local'],
      effects:['device'],
    });
  }

  onEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type, payload = {}) {
    const event = Object.freeze({
      sequence:this.events.length + 1,
      at:now(),
      type,
      payload:clone(payload),
    });
    this.events.push(event);
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
    // Re-entry is evidence, not a second command path.
    this.workspace.record(type, payload, { source:'runtime', kind:type });
    for (const listener of this.listeners) {
      try { listener(event); } catch {}
    }
    return event;
  }

  status() {
    return Object.freeze({
      running:Boolean(this.timer),
      heartbeatMs:this.heartbeatMs,
      tick:this.tickCount,
      queue:{
        total:this.queue.length,
        pending:this.queue.filter(task => task.status === 'pending').length,
        needsApproval:this.queue.filter(task => task.status === 'needs-approval').length,
      },
      watchers:this.watchers.filter(item => item.enabled).length,
      shell:nativeShellAvailable(),
      hostFaculties:[...this.host.faculties.keys()],
      runtimeAdapters:this.system.listRuntimeAdapters(),
      wiring:this.system.wiringAudit(),
      coreCapabilities:this.core.capabilities(),
      trainingRoutes:this.training.rankRoutes(),
      hands:this.hands.list(),
      handOrgans:this.hands.status(),
      workspace:{ sequence:this.workspace.sequence, subscribers:[...this.workspace.subscribers.keys()].sort(), recent:this.workspace.recent(12) },
      measured:this.measured.snapshot(),
      evolution:this.evolution.snapshot(),
    });
  }

  start() {
    if (this.timer) return false;
    this.timer = setInterval(() => {
      this.tick().catch(error => this.emit('heartbeat-error', { error:String(error?.stack ?? error) }));
    }, this.heartbeatMs);
    this.emit('watch-started', { heartbeatMs:this.heartbeatMs });
    this.persist();
    return true;
  }

  stop() {
    if (!this.timer) return false;
    clearInterval(this.timer);
    this.timer = null;
    this.emit('watch-stopped');
    this.persist();
    return true;
  }

  async tick() {
    this.tickCount += 1;
    const watcherResults = [];

    for (const watcher of this.watchers.filter(item => item.enabled)) {
      if (this.tickCount % watcher.every !== 0) continue;
      try {
        const result = await this.call(watcher.input, {
          origin:'watcher',
          watcherId:watcher.id,
        }, { manual:false });
        watcherResults.push({ id:watcher.id, ok:true, result:clone(result) });
      } catch (error) {
        watcherResults.push({ id:watcher.id, ok:false, error:String(error?.message ?? error) });
      }
    }

    const task = this.queue.find(item => item.status === 'pending');
    let taskResult = null;
    if (task) taskResult = await this.processTask(task.id, { manual:false });

    const result = Object.freeze({
      tick:this.tickCount,
      watcherResults,
      taskResult,
      quiescent:watcherResults.length === 0 && !task,
    });

    this.emit('tick', result);
    this.persist();
    return result;
  }

  addWatcher(input, every = 1) {
    const text = String(input ?? '').trim();
    if (!text) throw new Error('Watcher input is required.');
    const watcher = {
      id:`watch-${Date.now()}-${this.watchers.length + 1}`,
      input:text,
      every:Math.max(1, Number(every) || 1),
      enabled:true,
      createdAt:now(),
    };
    this.watchers.push(watcher);
    this.emit('watcher-added', watcher);
    this.persist();
    return clone(watcher);
  }

  clearWatchers() {
    for (const watcher of this.watchers) watcher.enabled = false;
    this.emit('watchers-disabled');
    this.persist();
  }

  enqueue(kind, input, options = {}) {
    if (!['call','chat','execute-js','hand'].includes(kind)) {
      throw new Error(`Unsupported autonomous task kind: ${kind}`);
    }
    const normalizedInput = kind === 'hand'
      ? (typeof input === 'string' ? { id:input, args:clone(options.args ?? {}) } : clone(input ?? {}))
      : String(input ?? '');
    if (kind === 'hand' && !normalizedInput?.id) throw new Error('Hand task requires { id, args }.');
    const task = {
      id:`task-${Date.now()}-${this.queue.length + 1}`,
      kind,
      input:normalizedInput,
      status:'pending',
      createdAt:now(),
      updatedAt:now(),
      options:clone(options),
      result:null,
      error:null,
    };
    this.queue.push(task);
    this.emit('task-enqueued', task);
    this.persist();
    return clone(task);
  }

  policyFor(kind) {
    const taskClass = kind === 'execute-js' ? 'execute-js' : kind;
    const effect = kind === 'call'
      ? 'compute'
      : kind === 'chat'
        ? 'communicate'
        : kind === 'hand'
          ? 'device'
          : 'execute-code';

    return this.confidence.evaluate({
      taskClass,
      dataScopes:['local'],
      effect,
    });
  }

  async processTask(id, { manual = false } = {}) {
    const task = this.queue.find(item => item.id === id);
    if (!task) throw new Error(`Unknown task: ${id}`);

    if (task.status === 'complete') return clone(task.result);

    const policy = this.policyFor(task.kind);
    if (!manual && !policy.authorized) {
      task.status = 'needs-approval';
      task.updatedAt = now();
      task.result = { policy:clone(policy) };
      this.emit('task-needs-approval', { taskId:id, policy });
      this.persist();
      return clone(task.result);
    }

    task.status = 'running';
    task.updatedAt = now();
    const before = this.status();

    try {
      let result;
      if (task.kind === 'call') result = await this.call(task.input, { origin:manual ? 'person' : 'autonomy' }, { manual });
      else if (task.kind === 'chat') result = await this.chat(task.input, { origin:manual ? 'person' : 'autonomy' }, { manual });
      else if (task.kind === 'hand') result = await this.useHand(task.input.id, task.input.args ?? {}, { manual });
      else result = await this.runJS(task.input, null, { manual });

      task.status = 'complete';
      task.result = clone(result);
      task.updatedAt = now();

      this.recordEvidence(task.kind, 'success', { manual });
      if (task.kind !== 'hand') {
        this.measured.recordResult(true, 1);
        this.training.record({
          task:task.kind,
          stateBefore:before,
          toolPath:[task.kind],
          interaction:{ input:task.input, manual },
          stateAfter:this.status(),
          observedExpression:clone(result),
          success:true,
          metadata:{ taskId:task.id },
        });
      }
      this.emit('task-complete', { taskId:id, result });
      this.persist();
      return clone(result);
    } catch (error) {
      task.status = 'failed';
      task.error = String(error?.stack ?? error);
      task.updatedAt = now();
      this.recordEvidence(task.kind, 'failure', { manual, error:task.error });
      if (task.kind !== 'hand') {
        this.measured.recordResult(false, 1);
        this.training.record({
          task:task.kind,
          stateBefore:before,
          toolPath:[task.kind],
          interaction:{ input:task.input, manual },
          stateAfter:this.status(),
          observedExpression:null,
          success:false,
          error:task.error,
          metadata:{ taskId:task.id },
        });
      }
      this.emit('task-failed', { taskId:id, error:task.error });
      this.persist();
      throw error;
    }
  }

  recordEvidence(kind, evidenceKind, context = {}) {
    const taskClass = kind === 'execute-js' ? 'execute-js' : kind;
    this.confidence.record(taskClass, { kind:evidenceKind, context });
    this.policyEvidence.push({ taskClass, kind:evidenceKind, context:clone(context) });
  }

  async call(input, context = {}, { manual = true } = {}) {
    const text = String(input ?? '').trim();
    if (!text) throw new Error('Call input is required.');

    const started = performance.now();
    try {
      const result = await this.system.engine.call(text, {
        ...context,
        origin:context.origin ?? (manual ? 'person' : 'autonomy'),
      });
      if (manual) this.recordEvidence('call', 'success', { input:text });
      this.emit('call', { input:text, result, elapsedMs:performance.now() - started });
      this.persist();
      return result;
    } catch (error) {
      if (manual) this.recordEvidence('call', 'failure', { input:text });
      throw error;
    }
  }

  async chat(input, context = {}, { manual = true } = {}) {
    const text = String(input ?? '').trim();
    if (!text) throw new Error('Chat input is required.');

    try {
      const result = await this.system.chat(text, context);
      if (manual) this.recordEvidence('chat', 'success', { input:text });
      this.emit('chat', { input:text, result });
      this.persist();
      return result;
    } catch (error) {
      if (manual) this.recordEvidence('chat', 'failure', { input:text });
      throw error;
    }
  }

  async runJS(code, input = null, { manual = true } = {}) {
    const source = String(code ?? '');
    if (!source.trim()) throw new Error('JavaScript source is required.');

    try {
      const result = await this.host.execute(
        ['execute-code','javascript','pure','worker'],
        { code:source, input },
        { origin:manual ? 'person' : 'autonomy' },
      );
      if (!result.result?.ok) throw new Error(result.result?.error || 'JavaScript execution failed.');
      if (manual) this.recordEvidence('execute-js', 'success', { bytes:source.length });
      this.emit('javascript', { result });
      this.persist();
      return result;
    } catch (error) {
      if (manual) this.recordEvidence('execute-js', 'failure', { bytes:source.length });
      throw error;
    }
  }

  async executeArtifact(artifact) {
    const result = await this.system.executeArtifact(artifact, {
      origin:'person',
      learnOnFailure:true,
    });
    this.emit('artifact-execution', { artifact:{ name:artifact?.name }, result });
    this.persist();
    return result;
  }


  async useHand(id, args = {}, { manual = true } = {}) {
    const started = performance.now();
    const before = this.status();
    try {
      const result = manual
        ? await this.hands.use(id, args, { manual:true })
        : await this.hands.request(id, args, { origin:'autonomy' });

      const complete = !(result && typeof result === 'object' && result.complete === false);
      this.training.record({
        task:`hand:${id}`,
        stateBefore:before,
        toolPath:['hands', id],
        interaction:{ args:clone(args), manual },
        stateAfter:this.status(),
        observedExpression:clone(result),
        success:complete,
        score:complete ? 1 : 0.5,
        metadata:{ elapsedMs:performance.now() - started, complete },
      });
      this.measured.recordResult(complete, 1);
      this.emit('hand-used', { id, manual, complete, result });
      this.persist();
      return result;
    } catch (error) {
      this.training.record({
        task:`hand:${id}`,
        stateBefore:before,
        toolPath:['hands', id],
        interaction:{ args:clone(args), manual },
        stateAfter:this.status(),
        observedExpression:null,
        success:false,
        error:String(error?.stack || error?.message || error),
        metadata:{ elapsedMs:performance.now() - started },
      });
      this.measured.recordResult(false, 1);
      this.emit('hand-failed', { id, manual, error:String(error?.message || error) });
      this.persist();
      throw error;
    }
  }

  handsStatus() { return this.hands.status(); }

  async evaluateCapabilityCandidate({ id, candidate, checks = [], canary, promote } = {}) {
    const report = await this.evolution.evaluate({ id, candidate, checks, canary, promote });
    this.emit('evolution-evaluated', report);
    this.persist();
    return report;
  }

  async runShell(command) {
    const source = String(command ?? '').trim();
    if (!source) throw new Error('Shell command is required.');
    if (!nativeShellAvailable()) {
      throw new Error('Termux bridge is unavailable. This does not affect Cynthia JavaScript execution.');
    }

    // Shell stays explicitly person-triggered; it is never an autonomous queue task.
    const result = await this.host.execute(['shell','command'], source, { origin:'person' });
    this.emit('shell', { command:source, result });
    return result;
  }

  ingestText({ sourceId, title, dimension = 'source', text }) {
    const rows = this.books.ingest({
      sourceId,
      title,
      dimension,
      text,
      addressResolver:({ index }) => ({ dimension, arc:index % 100 }),
    });
    this.emit('trainable-ingest', { sourceId, count:rows.length });
    this.persist();
    return rows;
  }

  async storageFaculty(input = {}) {
    const op = input?.op ?? 'status';
    if (op === 'persist') return this.persist();
    if (op === 'restore') return this.restore();
    if (op === 'status') return this.status();
    throw new Error(`Unsupported storage operation: ${op}`);
  }

  persist() {
    const state = {
      version:2,
      lineage:'0.3.0',
      tickCount:this.tickCount,
      heartbeatMs:this.heartbeatMs,
      queue:this.queue,
      watchers:this.watchers,
      policyEvidence:this.policyEvidence,
      registry:this.registry.snapshot(),
      training:this.training.records,
      events:this.events.slice(-200),
      workspace:this.workspace.recent(500),
      measured:this.measured.snapshot(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return clone(state);
  }

  restore() {
    let state = null;
    let sourceKey = STORAGE_KEY;
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      try { state = JSON.parse(localStorage.getItem(key) || 'null'); }
      catch { state = null; }
      if (state) { sourceKey = key; break; }
    }
    if (!state || ![1,2].includes(state.version)) return false;

    this.tickCount = Math.max(0, Number(state.tickCount) || 0);
    this.heartbeatMs = Math.max(500, Number(state.heartbeatMs) || this.heartbeatMs);
    this.queue = Array.isArray(state.queue) ? state.queue : [];
    this.watchers = Array.isArray(state.watchers) ? state.watchers : [];
    this.events = Array.isArray(state.events) ? state.events : [];
    this.workspace.restore(Array.isArray(state.workspace) ? state.workspace : this.events);
    this.measured.restore(state.measured ?? null);

    this.policyEvidence = [];
    this.hands = new SynthiaHands({ journal:this.training, workspace:this.workspace, runtime:this });
    for (const row of Array.isArray(state.policyEvidence) ? state.policyEvidence : []) {
      try {
        this.confidence.record(row.taskClass, {
          kind:row.kind,
          context:row.context ?? null,
        });
        this.policyEvidence.push(row);
      } catch {}
    }

    if (state.registry?.entities) {
      for (const row of state.registry.entities) {
        try {
          this.registry.register({
            entityId:row.entityId,
            entityType:row.entityType,
            nativeAddress:row.nativeAddress,
            currentAddress:row.currentAddress,
            source:row.source,
            sayings:row.sayings,
            state:row.state,
          });
        } catch {}
      }
    }

    for (const row of Array.isArray(state.training) ? state.training : []) {
      try {
        this.training.record({
          task:row.task,
          stateBefore:row.stateBefore,
          toolPath:row.toolPath,
          interaction:row.interaction,
          stateAfter:row.stateAfter,
          observedExpression:row.observedExpression,
          success:row.success,
          error:row.error,
          score:row.score,
          metadata:row.metadata,
        });
      } catch {}
    }

    if (sourceKey !== STORAGE_KEY) {
      try { localStorage.removeItem(sourceKey); } catch {}
    }
    return true;
  }

  exportState() {
    return this.persist();
  }
}
