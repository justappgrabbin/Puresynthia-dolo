import assert from 'node:assert/strict';
import { SynthiaSystem } from '../assets/web/vendor/ues/src/synthia-system.mjs';
import {
  ConfidenceLedger,
  createAcodeHost,
} from '../assets/web/vendor/trainable/ato/index.mjs';
import SynthiaCoreRuntimeBrowser from '../assets/web/trainable-browser/core-runtime.mjs';
import { StateRegistry } from '../assets/web/trainable-browser/registration.mjs';
import { TrainingJournal } from '../assets/web/trainable-browser/training-journal.mjs';

const system = new SynthiaSystem();
const audit = system.wiringAudit();
assert.equal(audit.ok, true, 'UES wiring audit');

const core = new SynthiaCoreRuntimeBrowser();
const caps = core.capabilities();
assert.ok(caps.stateSpace.length > 0, 'Trainable StateSpace must be live');
assert.ok(caps.ato.length > 0, 'Trainable ATO must be live');
assert.ok(caps.klein.length > 0, 'Trainable Klein must be live');

const host = createAcodeHost();
const local = await host.execute(['execute-code','javascript','pure'], 42);
assert.equal(local.facultyId, 'acode.javascript');
assert.equal(local.result, 42);

const confidence = new ConfidenceLedger();
confidence.grant('execute-js', {
  threshold:0.75,
  dataScopes:['local'],
  effects:['execute-code'],
});
assert.equal(confidence.evaluate({
  taskClass:'execute-js',
  dataScopes:['local'],
  effect:'execute-code',
}).authorized, false);
confidence.record('execute-js', { kind:'success' });
confidence.record('execute-js', { kind:'success' });
assert.equal(confidence.evaluate({
  taskClass:'execute-js',
  dataScopes:['local'],
  effect:'execute-code',
}).authorized, true);

const registry = new StateRegistry();
const rec = registry.register({ entityId:'synthia:test', nativeAddress:{ gate:1 } });
assert.equal(rec.entityId, 'synthia:test');

const journal = new TrainingJournal();
journal.record({
  task:'test',
  stateBefore:{},
  toolPath:['test'],
  interaction:{},
  stateAfter:{},
  observedExpression:'ok',
  success:true,
});
assert.equal(journal.rankRoutes()[0].successRate, 1);

console.log(JSON.stringify({
  uesWiring:audit.ok,
  stateSpaceExports:caps.stateSpace.length,
  atoExports:caps.ato.length,
  kleinExports:caps.klein.length,
  trainableHost:true,
  confidenceGate:true,
  trainableRegistry:true,
  trainingJournal:true,
}, null, 2));
