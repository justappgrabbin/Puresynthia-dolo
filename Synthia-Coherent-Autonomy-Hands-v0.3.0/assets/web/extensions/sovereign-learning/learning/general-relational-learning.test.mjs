import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { ProtectedSettings } from '../autonomy/ProtectedSettings.mjs';
import { ApprovalGovernor } from '../autonomy/ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from '../autonomy/ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from '../autonomy/ReversibleChangeLedger.mjs';
import { ToolInstallationController } from '../autonomy/ToolInstallationController.mjs';
import { ArtifactCoat } from '../security/ArtifactCoat.mjs';
import { DeclarativeOperatorCompiler } from './DeclarativeOperatorCompiler.mjs';
import { PlanSandboxRunner } from './PlanSandboxRunner.mjs';
import { LearnedToolCatalog } from './LearnedToolCatalog.mjs';
import { AutonomousProcedureLearner } from './AutonomousProcedureLearner.mjs';
import { ConceptProcedureExtractor } from './ConceptProcedureExtractor.mjs';
import { RelationalKnowledgeInferer } from './RelationalKnowledgeInferer.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

const source = {
  text: 'Being is Matter. Matter is Touch. Touch is Sex. Sex is Survival. Movement is Energy. Energy is Creation. Creation is Seeing. Seeing is Landscape. Landscape is Environment.',
  provenance: { kind: 'user-supplied-image', ref: 'proofs/dimensional-relation-chain/source-1000057126.jpg' },
  citation: () => Object.freeze({ source: 'user-supplied dimensional relation chart', ref: 'proofs/dimensional-relation-chain/source-1000057126.jpg' })
};

async function system(store) {
  const nervousSystem = new NervousSystem(), compiler = new DeclarativeOperatorCompiler(), coatAuthority = new ArtifactCoat(), catalog = new LearnedToolCatalog({ compiler, coatAuthority });
  nervousSystem.learnedTools = catalog;
  const installer = new ToolInstallationController({ mesh: nervousSystem.ato.mesh, sandbox: new ArbitraryCodeSandbox({ runner: new PlanSandboxRunner({ compiler }) }), governor: new ApprovalGovernor({ settings: new ProtectedSettings() }), ledger: new ReversibleChangeLedger(), coatAuthority });
  return { nervousSystem, compiler, catalog, capsule: new StateCapsule({ store }), learner: new AutonomousProcedureLearner({ nervousSystem, inferer: new RelationalKnowledgeInferer(), compiler, installer, catalog, identity: await coatAuthority.generateIdentity() }) };
}

test('general extractor learns a non-geometry relational operator, installs it on the mesh, and reuses it after restart', async () => {
  const extraction = new ConceptProcedureExtractor().extract(source);
  assert.equal(extraction.triples.length, 9);
  assert.deepEqual(extraction.repeatedPredicates, [{ predicate: 'is', count: 9 }]);
  assert.ok(extraction.concepts.includes('Survival'));

  const examples = [{ input: { triples: extraction.triples, query: { from: 'Being', to: 'Survival' } }, condition: { path: ['connected'], equals: true } }];
  const store = new MemorySnapshotStore(), first = await system(store);
  const learned = await first.learner.learn({ sourceText: source, examples, name: 'trace-repeated-is-relation' });
  assert.equal(learned.status, 'installed');

  const tool = first.nervousSystem.ato.mesh.automatons.get(learned.toolId);
  const result = await tool.call(examples[0].input);
  assert.deepEqual(result.path, ['Being', 'Matter', 'Touch', 'Sex', 'Survival']);
  assert.ok(result.derived.some(triple => triple.subject === 'Being' && triple.object === 'Survival'));

  await first.capsule.save(first.nervousSystem);
  const second = await system(store);
  await second.capsule.restore(second.nervousSystem);
  const replay = await second.nervousSystem.ato.mesh.automatons.get('trace-repeated-is-relation').call({ triples: extraction.triples, query: { from: 'Movement', to: 'Environment' } });
  assert.equal(replay.connected, true);
  assert.deepEqual(replay.path, ['Movement', 'Energy', 'Creation', 'Seeing', 'Landscape', 'Environment']);
});
