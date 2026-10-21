import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntegratedSynthia } from './IntegratedSynthiaRuntime.mjs';
import { MemorySnapshotStore } from './persistence/SnapshotStores.mjs';

test('the public integrated runtime mounts the cumulative organs around one mesh', async () => {
  const store = new MemorySnapshotStore();
  const first = await createIntegratedSynthia({ store });
  const before = first.nervousSystem.ato.mesh.automatons.size;
  const processed = await first.process('Analyze the meaning and relationship of a gate to its line.');
  assert.equal(processed.route.toolId, 'diseminer');
  assert.ok(processed.intake.source.id);
  assert.equal(first.diagnostics().sources, 1);

  const grown = await first.growTool({ purpose: 'build a deterministic planning tool', input: 'plan structure build' });
  assert.ok(['mounted', 'existing'].includes(grown.status));
  assert.equal(first.nervousSystem.ato.mesh.automatons.size, before + 1);

  await first.persist();
  const second = await createIntegratedSynthia({ store });
  assert.equal(second.diagnostics().restoration, 'restored');
  assert.equal(second.diagnostics().sources, 1);
});
