import { NervousSystem } from './NervousSystem.mjs';
import { ProtectedSettings } from './autonomy/ProtectedSettings.mjs';
import { ApprovalGovernor } from './autonomy/ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from './autonomy/ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from './autonomy/ReversibleChangeLedger.mjs';
import { ToolInstallationController } from './autonomy/ToolInstallationController.mjs';
import { ArtifactCoat } from './security/ArtifactCoat.mjs';
import { DeclarativeOperatorCompiler } from './learning/DeclarativeOperatorCompiler.mjs';
import { PlanSandboxRunner } from './learning/PlanSandboxRunner.mjs';
import { LearnedToolCatalog } from './learning/LearnedToolCatalog.mjs';
import { AutonomousProcedureLearner } from './learning/AutonomousProcedureLearner.mjs';
import { RelationalKnowledgeInferer } from './learning/RelationalKnowledgeInferer.mjs';
import { BookIngestionEngine } from './books/BookIngestionEngine.mjs';
import { DependencyResolver } from './books/DependencyResolver.mjs';
import { GapChannelFactory } from './books/GapChannelFactory.mjs';
import { BookLearningCoordinator } from './books/BookLearningCoordinator.mjs';
import { IndexedDbSnapshotStore, MemorySnapshotStore } from './persistence/SnapshotStores.mjs';
import { StateCapsule } from './persistence/StateCapsule.mjs';
import { IntegratedToolFactory, ATONativeBridge } from '../UPGRADES/vendor/integrated-tool-factory/src/integrated-tool-factory.mjs';
import { Automaton } from '../../vendor/ato-core/src/automaton.mjs';

function defaultStore() {
  return globalThis.indexedDB
    ? new IndexedDbSnapshotStore({ database: 'cynthia-sovereign', objectStore: 'organism-v1' })
    : new MemorySnapshotStore();
}

function summarize(result) {
  const toolId = result.route?.toolId ?? 'unknown';
  const output = result.output ?? {};
  if (typeof output === 'string') return output;
  if (output.utterance) return output.utterance;
  if (output.narrative) return output.narrative;
  if (output.corrected) return output.corrected;
  if (output.kind) return `${toolId} produced ${output.kind}.`;
  return `${toolId} processed the input and preserved its derivation.`;
}

/**
 * One assembled runtime for the complete step-by-step lineage.
 * Modules are mounted as organs around one NervousSystem and one ATO mesh;
 * they are not parallel demo engines.
 */
export async function createIntegratedSynthia(options = {}) {
  const nervousSystem = options.nervousSystem ?? new NervousSystem(options);
  const factory = options.factory ?? new IntegratedToolFactory();
  const factoryBridge = new ATONativeBridge({ Automaton, mesh: nervousSystem.ato.mesh, factory });
  const compiler = new DeclarativeOperatorCompiler();
  const coatAuthority = new ArtifactCoat();
  const catalog = new LearnedToolCatalog({ compiler, coatAuthority });
  nervousSystem.learnedTools = catalog;

  const settings = new ProtectedSettings(options.settings);
  const governor = new ApprovalGovernor({ settings });
  const changeLedger = new ReversibleChangeLedger();
  const sandbox = new ArbitraryCodeSandbox({ runner: new PlanSandboxRunner({ compiler }) });
  const installer = new ToolInstallationController({
    mesh: nervousSystem.ato.mesh,
    sandbox,
    governor,
    ledger: changeLedger,
    coatAuthority,
  });
  const identity = await coatAuthority.generateIdentity();
  const learner = new AutonomousProcedureLearner({
    nervousSystem,
    inferer: new RelationalKnowledgeInferer(),
    compiler,
    installer,
    catalog,
    identity,
  });

  const bookDependencies = new DependencyResolver(options.bookDependencies);
  nervousSystem.bookDependencies = bookDependencies;
  const books = new BookLearningCoordinator({
    ingestion: new BookIngestionEngine(),
    resolver: bookDependencies,
    gapFactory: new GapChannelFactory({ mind: nervousSystem.organism.mind }),
  });

  const capsule = new StateCapsule({ store: options.store ?? defaultStore() });
  const restoration = options.restore === false
    ? Object.freeze({ status: 'skipped' })
    : await capsule.restore(nervousSystem);

  async function persist() {
    return capsule.save(nervousSystem);
  }

  async function process(input, context = {}) {
    const result = await nervousSystem.process(input, context);
    if (context.persist !== false) await persist();
    return Object.freeze({ ...result, response: summarize(result) });
  }

  async function teachRelational({ source, examples, name, approval = 'approve' } = {}) {
    const result = await learner.learn({ sourceText: source, examples, name, approval });
    await persist();
    return result;
  }

  async function growTool(request = {}) {
    const result = factoryBridge.generateAndMount(request);
    await persist();
    return result;
  }

  function diagnostics() {
    return Object.freeze({
      runtime: 'integrated-organism',
      restoration: restoration.status,
      meshTools: nervousSystem.ato.mesh.automatons.size,
      learnedTools: catalog.records.size,
      generatedTools: factory.tools.size,
      sources: nervousSystem.organism.mind.sources.originals.size,
      episodes: nervousSystem.organism.episodes.snapshot().episodes?.length ?? 0,
      organs: Object.freeze([
        'first-mind', 'nervous-system', 'ato-mesh', 'source-memory', 'episodic-memory',
        'pressure-mesh', 'learned-tool-catalog', 'book-learning', 'gap-factory',
        'morph-evolution', 'business-orientation', 'personal-synth-registry',
      ]),
    });
  }

  return Object.freeze({
    nervousSystem,
    factory,
    factoryBridge,
    learner,
    books,
    capsule,
    settings,
    governor,
    installer,
    process,
    teachRelational,
    growTool,
    persist,
    diagnostics,
  });
}
