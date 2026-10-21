import assert from 'node:assert/strict';
import { SynthiaHands } from '../assets/web/app/hands.mjs';

globalThis.document = { createElement:() => ({}) };

const hands = new SynthiaHands();
const listed = hands.list();

assert.ok(listed.some(x => x.id === 'javascript.run' && x.autonomous));
assert.ok(listed.some(x => x.id === 'workspace.write' && x.autonomous === true));
assert.ok(listed.some(x => x.id === 'termux.shell' && x.autonomous === false));
assert.ok(listed.some(x => x.id === 'open.url' && x.autonomous === false));

await assert.rejects(
  () => hands.use('termux.shell', { command:'pwd' }, { manual:false }),
  /requires person approval|unavailable/
);

console.log(`hands contract PASS: ${listed.length} faculties`);
