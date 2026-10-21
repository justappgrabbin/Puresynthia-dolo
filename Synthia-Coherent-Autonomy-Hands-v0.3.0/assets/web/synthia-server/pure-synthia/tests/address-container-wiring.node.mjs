import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { bootstrapCurrentSynthiaSwarm } from '../src/synthia/swarm/bootstrap.mjs';
import { MemoryCheckpointStore } from '../src/synthia/swarm/checkpointStores.mjs';

function assertShortAddress(value) {
  assert.match(value, /^P[A-Z0-9_]{3}DIM[A-Z0-9_]{3}G\d+L\d+C\d+T\d+D\d+M\d+S\d+ZOD[A-Z0-9_]{3}H\d+$/);
  assert.equal(/Movement|Evolution|Being|Design|Space|Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|NorthNode|SouthNode/.test(value), false);
}

test('root address container wires task -> worker -> result -> checkpoint -> wake', async () => {
  const store = new MemoryCheckpointStore();
  const first = await bootstrapCurrentSynthiaSwarm({ store, attachFoundry: false });
  const result = await first.swarm.submit([
    { id: 'address-e2e', capability: 'organism.snapshot', input: { op: 'snapshot', subject: 'wire the address container' }, meta: { replaySafe: true } },
  ]);
  assert.equal(result.executions.length, 1);
  const execution = result.executions[0];
  assert.ok(execution.address?.planetary);
  assert.ok(execution.address?.dimension);
  assertShortAddress(execution.structuralAddressKey);
  assert.equal(first.swarm.snapshot().address.structuralKey, execution.structuralAddressKey);
  await first.swarm.checkpoint('address-container-test');

  const second = await bootstrapCurrentSynthiaSwarm({ store, attachFoundry: false });
  assert.equal(second.addressContainer.context().structuralKey, execution.structuralAddressKey);
  assert.equal(second.swarm.snapshot().address.structuralKey, execution.structuralAddressKey);
});

test('practice world enters and leaves through the same root address container', async () => {
  const { worldPort, addressContainer } = await bootstrapCurrentSynthiaSwarm({ store: new MemoryCheckpointStore(), attachFoundry: false });
  const observed = worldPort.observe({ type: 'agent_helped', summary: 'agent helped Joe', gate: 59 });
  assert.equal(observed.address.gate, 59);
  assertShortAddress(observed.addressText);
  assert.equal(addressContainer.context().structuralKey, observed.addressText);

  const acted = await worldPort.act({ type: 'build', reason: 'improve the practice habitat' });
  assert.ok(acted.action.address?.gate);
  assertShortAddress(acted.action.addressText);
  assert.equal(addressContainer.context().structuralKey, acted.action.addressText);
});

test('front and daemon surfaces expose the same root container', async () => {
  const main = await fs.readFile(new URL('../extension/main.mjs', import.meta.url), 'utf8');
  const daemon = await fs.readFile(new URL('../runtime/daemon.mjs', import.meta.url), 'utf8');
  const html = await fs.readFile(new URL('../extension/index.html', import.meta.url), 'utf8');
  assert.match(main, /SYNTHIA_ADDRESS_CONTAINER/);
  assert.match(main, /resolveSynthiaAddress/);
  assert.match(main, /\$\('address'\)/);
  assert.match(html, /id="address"/);
  assert.match(daemon, /addressContainer\.context\(\)/);
  assert.match(daemon, /addressContainer\.schema\(\)/);
});
