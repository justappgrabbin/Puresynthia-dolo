import assert from 'node:assert/strict';
import { EventWorkspace } from '../assets/web/app/event-workspace.mjs';
import { SynthiaHands } from '../assets/web/app/hands.mjs';

const workspace = new EventWorkspace();
const hands = new SynthiaHands({ workspace });
let acted = 0;

hands.register({
  id:'test.autonomous',
  description:'test autonomous organ',
  autonomous:true,
  available:() => true,
  invoke:async ({ value }) => {
    acted += 1;
    return { ok:true, complete:true, value:value * 2 };
  },
});

const result = await hands.request('test.autonomous', { value:21 });
assert.equal(result.value, 42);
assert.equal(acted, 1);
const organ = hands.list().find(row => row.id === 'test.autonomous');
assert.equal(organ.state, 'ready');
assert.equal(organ.decisions, 1);
assert.equal(organ.actions, 1);
assert.ok(workspace.recent(10).some(event => event.type === 'hand.request'));

hands.register({
  id:'test.truthful-failure',
  autonomous:true,
  available:() => true,
  invoke:async () => '{"ok":false,"complete":true,"error":"native-failed"}',
});
await assert.rejects(() => hands.request('test.truthful-failure'), /native-failed/);
const failed = hands.list().find(row => row.id === 'test.truthful-failure');
assert.equal(failed.failures, 1);
assert.equal(failed.state, 'failed');

hands.register({
  id:'test.person-only',
  autonomous:false,
  available:() => true,
  invoke:async () => ({ ok:true }),
});
await assert.rejects(() => hands.request('test.person-only'), /requires person approval/);

console.log('distributed hands PASS');
