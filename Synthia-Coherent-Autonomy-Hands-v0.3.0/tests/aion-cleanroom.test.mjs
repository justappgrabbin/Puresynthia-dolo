import assert from 'node:assert/strict';
import { MeasuredState } from '../assets/web/app/measured-state.mjs';
import { EvolutionGate } from '../assets/web/app/evolution-gate.mjs';

const measured = new MeasuredState({ outcomeWindow:4 });
measured.setFocus('verify hand evidence');
measured.recordResult(true, 2);
measured.recordResult(false, 3);
assert.equal(measured.snapshot().focus, 'verify hand evidence');
assert.equal(measured.snapshot().recentOutcomes.length, 2);
assert.ok(measured.snapshot().certainty >= 0 && measured.snapshot().certainty <= 1);

let promoted = 0;
const gate = new EvolutionGate({ failureThreshold:2 });
const ok = await gate.evaluate({
  id:'good',
  candidate:{ value:42 },
  checks:[{ name:'shape', run:candidate => candidate.value === 42 }],
  canary:async () => ({ ok:true, tests:3 }),
  promote:async () => ({ installed:++promoted }),
});
assert.equal(ok.accepted, true);
assert.equal(promoted, 1);

const bad = async id => gate.evaluate({
  id,
  candidate:{},
  canary:async () => ({ ok:false, error:'test-failed' }),
  promote:async () => ({ installed:++promoted }),
});
assert.equal((await bad('bad-1')).accepted, false);
assert.equal((await bad('bad-2')).accepted, false);
assert.equal(gate.open, true);
const blocked = await gate.evaluate({
  id:'blocked', candidate:{}, canary:async () => ({ ok:true }), promote:async () => ({})
});
assert.equal(blocked.reason, 'circuit-breaker-open');
assert.equal(promoted, 1);

console.log('clean AION mechanics PASS');
