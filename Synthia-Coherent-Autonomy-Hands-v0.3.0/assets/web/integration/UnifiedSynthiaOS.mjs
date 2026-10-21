import SynthiaUnit from '../core/SynthiaUnit.mjs';
import { UnifiedSynthiaStateSpace } from '../extensions/unified-state-space/src/unified-state-space.mjs';
import { MycelialSuccessMesh } from '../extensions/human-success-mycelium/mycelial-success-mesh.mjs';
import { HumanSuccessMetabolism } from '../extensions/human-success-mycelium/human-success-metabolism.mjs';
import { GateLineProcessField } from '../extensions/human-success-mycelium/process-field.mjs';
import { RecursiveMediaOrgan } from '../extensions/recursive-media-field/src/synthia-recursive-media-field.js';
import { PressureMesh } from '../extensions/sovereign-learning/PressureMesh.mjs';
import { ResultFeedbackLoop } from '../extensions/sovereign-learning/ResultFeedbackLoop.mjs';
import { SourceMemory } from '../extensions/sovereign-learning/SourceMemory.mjs';
import { extractProcedures } from '../extensions/sovereign-learning/ProcedureExtractor.mjs';
import OSKernel from '../os/OSKernel.mjs';

/**
 * Direct assembly around the verified r21.22 SynthiaUnit.
 * There is no version resolver. Every mounted extension is named explicitly.
 * No donor boots a second GraphRuntime, ATO mesh, or organism brain.
 */
export class UnifiedSynthiaOS extends SynthiaUnit {
  constructor(options = {}) {
    super(options);
    this.unifiedStateSpace = new UnifiedSynthiaStateSpace({ provenance: { host: 'Synthia-Organism-OS-r22.0', chassis: 'r21.22' } });
    this.mycelialSuccess = new MycelialSuccessMesh();
    this.humanSuccessField = new HumanSuccessMetabolism();
    this.gateLineProcesses = new GateLineProcessField();
    this.recursiveMedia = new RecursiveMediaOrgan();
    this.pressureMesh = new PressureMesh();
    this.resultFeedback = new ResultFeedbackLoop();
    this.sourceMemoryV2 = new SourceMemory();
    this.os = new OSKernel({ unit: this });

    // Publish real mounted processes into the same ProcessFabric. These are not aliases.
    const mounted = [
      ['process:unified-kimi-emergent-state-space','canonical state projection and transition journal',['resolve-state','project-state','transition-state','replay-state']],
      ['process:human-success-mycelium','human outcome fitness and shareable strategy-pattern evidence',['observe-human-success','score-strategy','share-pattern']],
      ['process:gate-line-process-field','experimental Gate^Line process-horizon instrumentation',['activate-process-field','advance-process-field','close-process-field']],
      ['process:recursive-media-field','64-state media field, operator reinforcement and skeletal morphing',['address-media-state','morph-sprite','reinforce-media-operator']],
      ['process:sovereign-learning','source preservation, procedure extraction, pressure routing and result verification',['preserve-source','extract-procedure','route-pressure','verify-result']],
      ['process:os-kernel','single app shell and capability surfaces',['app-tray','surface-state','permission-state','admin-state']],
    ];
    for (const [id,role,members] of mounted) {
      try { this.fabric.registerExternalProcess({id,role,members,origin:{type:'direct-integration',source:'integration/UnifiedSynthiaOS.mjs'}}); } catch {}
    }
  }

  resolveUnifiedState(input, context = {}) {
    return this.unifiedStateSpace.resolve(input, context);
  }

  transitionUnifiedState(event = {}) {
    return this.unifiedStateSpace.transition(event);
  }

  recordHumanSuccessV2(personId, dimension, value, options = {}) {
    const result = this.humanSuccessField.observe(personId, dimension, value, options);
    if (options.patternId) {
      this.mycelialSuccess.contribute({
        patternId: options.patternId,
        dimensions: [dimension],
        gate: options.gate ?? null,
        line: options.line ?? null,
        description: options.description ?? null,
        outcomeDelta: result.vitality - 0.5,
        sourceNode: options.sourceNode ?? null,
      });
    }
    return result;
  }

  activateGateLineProcess(entityId, address, options = {}) {
    return this.gateLineProcesses.activate(entityId, address, options);
  }

  preserveAndLearnSource(content, metadata = {}) {
    const source = this.sourceMemoryV2.preserve(String(content), metadata);
    const procedures = extractProcedures(String(content));
    this.pressureMesh.register(`source:${source.id}`, { competence: 0.5 });
    return Object.freeze({ source, procedures });
  }

  async verifyWithFeedback(spec = {}) {
    return this.resultFeedback.run(spec);
  }

  async buildSelf(spec = {}) {
    // Uses the existing proven chain rather than inventing a second self-builder.
    const inspection = spec.files ? this.inspectCodebase(spec.files) : null;
    const plan = spec.change ? this.planCodeChange(spec.change) : null;
    const changeSet = spec.change ? this.synthesizeCodeChangeSet({ ...spec.change, plan }) : null;
    return { inspection, plan, changeSet, adoption: 'requires existing stage/test/adopt or approval path' };
  }

  snapshot() {
    const base = super.snapshot();
    return {
      ...base,
      mergedExtensions: {
        unifiedStateSpace: { history: this.unifiedStateSpace.getHistory(), provenance: this.unifiedStateSpace.provenance },
        humanSuccessField: this.humanSuccessField.state('user'),
        mycelialSuccess: this.mycelialSuccess.exportShareable(),
        gateLineProcesses: this.gateLineProcesses.all(),
        recursiveMedia: this.recursiveMedia.snapshot(),
        pressureMesh: this.pressureMesh.snapshot(),
        sourceMemory: this.sourceMemoryV2.snapshot(),
        os: this.os.snapshot(),
      },
    };
  }
}

export default UnifiedSynthiaOS;
