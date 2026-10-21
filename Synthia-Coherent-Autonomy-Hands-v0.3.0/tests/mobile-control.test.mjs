import assert from 'node:assert/strict';
import { parseNative } from '../assets/web/app/mobile-control.mjs';

assert.deepEqual(parseNative('{"ok":true,"complete":true,"value":3}'), { ok:true, complete:true, value:3 });
assert.equal(parseNative('{"ok":false,"error":"no-root"}').ok, false);
assert.equal(parseNative('Workspace read failed: nope').ok, false);
assert.equal(parseNative('legacy success').ok, true);

console.log('mobile native evidence parser PASS');
