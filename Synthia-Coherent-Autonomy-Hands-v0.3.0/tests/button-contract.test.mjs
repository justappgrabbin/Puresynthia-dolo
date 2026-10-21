import fs from 'node:fs';
import assert from 'node:assert/strict';
import { BUTTON_ACTIONS } from '../assets/web/app/button-contract.mjs';

const html = fs.readFileSync(new URL('../assets/web/index.html', import.meta.url), 'utf8');
const actions = [...html.matchAll(/<button\b[^>]*\bdata-action="([^"]+)"/g)].map(match => match[1]);

assert.equal(actions.length, BUTTON_ACTIONS.length, 'button count must equal contract count');
assert.equal(new Set(actions).size, actions.length, 'button actions must be unique');
assert.deepEqual([...actions].sort(), [...BUTTON_ACTIONS].sort(), 'HTML buttons must match action contract');

console.log(`button contract PASS: ${actions.length} buttons`);
