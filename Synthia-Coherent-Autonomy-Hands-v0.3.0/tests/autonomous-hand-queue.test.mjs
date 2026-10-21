import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem:key => store.has(key) ? store.get(key) : null,
  setItem:(key, value) => store.set(key, String(value)),
  removeItem:key => store.delete(key),
};

const { SynthiaAutonomy } = await import('../assets/web/app/autonomy.mjs');
const runtime = new SynthiaAutonomy({ heartbeatMs:5000 });
let executions = 0;
runtime.hands.register({
  id:'test.queue-hand',
  autonomous:true,
  available:() => true,
  invoke:async ({ value }) => ({ ok:true, complete:true, value:value + (++executions) }),
});

const task = runtime.enqueue('hand', { id:'test.queue-hand', args:{ value:40 } });
const result = await runtime.processTask(task.id, { manual:false });
assert.equal(result.value, 41);
assert.equal(executions, 1);
assert.equal(runtime.queue.find(row => row.id === task.id).status, 'complete');
assert.equal(runtime.hands.list().find(row => row.id === 'test.queue-hand').decisions, 1);
assert.ok(runtime.workspace.recent(20).some(row => row.type === 'hand.request'));
assert.ok(runtime.policyEvidence.some(row => row.taskClass === 'hand' && row.kind === 'success'));

console.log('autonomous hand queue PASS');
