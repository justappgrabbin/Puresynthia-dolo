import assert from 'node:assert/strict';
import { createUnifiedStateSpace, CANONICAL_ADDRESS_FIELDS } from '../src/unified-state-space.mjs';

const s = createUnifiedStateSpace({ provenance: { testRun: true } });
assert.equal(s.provenance.llmDependency, false);
assert.equal(s.provenance.mergePolicy, 'retain-all-perspectives');
assert.equal(CANONICAL_ADDRESS_FIELDS.includes('gate'), true);

const a = s.resolve({ gate: 25, line: 4, color: 6, tone: 5, base: 2 });
assert.equal(a.address.gate, 25);
assert.equal(a.address.line, 4);
assert.ok(a.views.kimi.gateBits.length === 6);
assert.ok(a.views.emergent.views.space);
assert.ok(a.views.emergent.views.design);
assert.ok(a.views.emergent.views.causal);
assert.ok(a.views.emergent.views.knowledge);
assert.ok(a.views.emergent.views.dependency);
assert.deepEqual(a.projections.kimi, ['knowledge','causal','phase','temporal','dependency']);
assert.deepEqual(a.projections.emergent, ['space','design','causal','knowledge','dependency']);

const mirrored = s.transition({ address: a.address, transition: 'mirror' });
const restored = s.transition({ address: mirrored.resolved.address, transition: 'mirror' });
assert.equal(restored.resolved.address.gate, 25, 'mirror must be involutive');

const shadow = s.transition({ address: a.address, transition: 'shadow' });
const shadowBack = s.transition({ address: shadow.resolved.address, transition: 'shadow' });
assert.equal(shadowBack.resolved.address.gate, 25, 'shadow must be involutive');

const becoming = s.transition({ address: a.address, transition: 'becoming', changingLines: [2, 6] });
assert.notEqual(becoming.resolved.address.gate, a.address.gate);

const obs = s.observe(a.address, { source: 'test', intensity: 0.7 });
assert.equal(obs.type, 'observation');
assert.ok(s.getHistory().length >= 6);

const derivation = s.executeKimi('klein-analogy "hot cold day night"');
assert.ok(derivation.hash);
const lastIntake = s.getLastKimiIntake();
assert.ok(lastIntake?.address?.gate >= 1 && lastIntake.address.gate <= 64);
const replay = s.replayKimi(derivation);
assert.equal(replay.hashMatch, true);

const snapshot = s.exportState();
assert.equal(snapshot.manifest, 'synthia.unified-statespace.v1');
const s2 = createUnifiedStateSpace();
s2.hydrate(snapshot);
assert.equal(s2.getHistory().length, s.getHistory().length);
assert.equal(s2.resolve(a.address).address.gate, 25);

const validation = s2.validate();
assert.equal(validation.ok, true, validation.errors.join('; '));

console.log(JSON.stringify({
  ok: true,
  address: a.address,
  kimiTools: a.views.kimi.meshMetrics.automata,
  emergentMeshes: Object.keys(a.views.emergent.views),
  history: s.getHistory().length,
  replay: replay.status,
  validation
}, null, 2));
