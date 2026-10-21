import assert from 'node:assert/strict';
import { sha256Hex, randomUUID } from '../assets/web/trainable-browser/crypto-compat.mjs';

assert.equal(
  sha256Hex('abc'),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);
assert.match(randomUUID(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
console.log('trainable browser crypto compatibility PASS');
