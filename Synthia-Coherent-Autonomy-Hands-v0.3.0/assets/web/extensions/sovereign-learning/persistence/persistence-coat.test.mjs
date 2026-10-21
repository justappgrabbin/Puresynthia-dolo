import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { MemorySnapshotStore } from './SnapshotStores.mjs';
import { StateCapsule } from './StateCapsule.mjs';
import { ArtifactCoat } from '../security/ArtifactCoat.mjs';

test('organism state survives a fresh nervous-system restart', async () => {
  const store = new MemorySnapshotStore();
  const capsule = new StateCapsule({ store });
  const before = new NervousSystem();
  const run = await before.process('Analyze the meaning of a line within a gate.');
  await capsule.save(before);
  const after = new NervousSystem();
  const restored = await capsule.restore(after);
  assert.equal(restored.status, 'restored');
  assert.ok(after.organism.mind.sources.source(run.intake.source.id));
  assert.ok(after.organism.episodes.episodes.some(item => item.id === run.intake.source.id));
  assert.deepEqual(after.ledger.replay(), before.ledger.replay());
});

test('portable coat detects mutation and quarantines valid unknown signers', async () => {
  const authority = new ArtifactCoat();
  const identity = await authority.generateIdentity();
  const content = 'export const learned = input => input;';
  const coat = await authority.wrap({ content, identity, manifest:{ artifactType:'generated-tool', capabilities:['transform'], address:{ dimension:'Design', gate:14, line:1, color:1, tone:1, base:1 } } });
  const valid = await authority.verify(coat, content);
  const changed = await authority.verify(coat, `${content}\n// changed`);
  assert.equal(valid.valid, true);
  assert.equal(valid.decision, 'quarantine');
  assert.equal(changed.valid, false);
  assert.equal(changed.decision, 'reject');
  const trusted = new ArtifactCoat({ trustedKeyIds:[identity.keyId] });
  assert.equal((await trusted.verify(coat, content)).decision, 'allow');
});
