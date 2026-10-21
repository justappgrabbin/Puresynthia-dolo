
/**
 * Universal Engine Orchestrator
 * 
 * Three-stage transduction pipeline:
 * 1. Perceptual Layer (Front-End Compiler) - DISEMINER
 * 2. Resonant Substrate (Linker/Optimizer) - 69,120-node Mesh
 * 3. Generative Back-End (Code Generator) - Transduction Engine
 * 
 * Plus: AUTOLING Heuristic Engine for grammar learning
 * Plus: MESSY Simulator for meta-symbolic simulation
 */

import { MeshAddressingSystem } from './mesh-addressing-system';
import { WHInterrogativeCore, InterrogationManifest } from './wh-interrogative-core';
import { AUTOLINGHeuristicEngine, GrammarRule, InformantResponse } from './autoling-heuristic-engine';
import { TransductionEngine, OutputModality, CompiledArtifact } from './transduction-engine';
import { MESSYSimulator, SimulationState } from './messy-simulator';

export interface PipelineInput {
  raw: string;
  sourceType: 'text' | 'code' | 'image' | 'video' | 'audio' | 'situation';
  context?: Record<string, any>;
}

export interface PipelineOutput {
  input: PipelineInput;
  manifest: InterrogationManifest;
  artifacts: Record<OutputModality, CompiledArtifact>;
  simulation: SimulationState | null;
  grammarRules: GrammarRule[];
  informantResponses: InformantResponse[];
  processingTime: number;
}

export interface EngineConfig {
  convergenceThreshold: number;
  maxRecursiveDepth: number;
  propagationSpeed: number;
  decayRate: number;
  autoSimulate: boolean;
  autoLearn: boolean;
  outputModalities: OutputModality[];
}

export class UniversalEngine {
  private mesh: MeshAddressingSystem;
  private interrogator: WHInterrogativeCore;
  private autoling: AUTOLINGHeuristicEngine;
  private transducer: TransductionEngine;
  private simulator: MESSYSimulator;
  private config: EngineConfig;
  private history: PipelineOutput[];

  constructor(config?: Partial<EngineConfig>) {
    this.mesh = new MeshAddressingSystem();
    this.interrogator = new WHInterrogativeCore(this.mesh);
    this.autoling = new AUTOLINGHeuristicEngine(this.mesh, this.interrogator);
    this.transducer = new TransductionEngine(this.mesh);
    this.simulator = new MESSYSimulator(this.mesh);

    this.config = {
      convergenceThreshold: 0.75,
      maxRecursiveDepth: 7,
      propagationSpeed: 10,
      decayRate: 0.05,
      autoSimulate: true,
      autoLearn: true,
      outputModalities: ['story', 'code', 'image', 'video', 'game'],
      ...config
    };

    this.history = [];
  }

  /**
   * Main pipeline: ingest → interrogate → compile → simulate
   */
  async process(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = performance.now();

    // Stage 1: Perceptual Layer (DISEMINER)
    // Extract W-H parameters from input
    const manifest = await this.interrogator.interrogate(input.raw);

    // Stage 2: Resonant Substrate
    // The mesh is already activated by the interrogator during convergence

    // Stage 2b: AUTOLING Learning (if enabled)
    let grammarRules: GrammarRule[] = [];
    let informantResponses: InformantResponse[] = [];

    if (this.config.autoLearn) {
      const dimension = manifest.convergence.locked_address?.dimension || 0;
      const learnResult = await this.autoling.learn(input.raw, dimension);
      grammarRules = learnResult.rules;
      informantResponses = learnResult.responses;
    }

    // Stage 3: Generative Back-End (Transduction)
    const artifacts: Record<OutputModality, CompiledArtifact> = {} as any;

    if (manifest.convergence.is_locked) {
      for (const modality of this.config.outputModalities) {
        artifacts[modality] = this.transducer.compile(manifest, modality);
      }
    }

    // Stage 4: MESSY Simulation (if enabled)
    let simulation: SimulationState | null = null;

    if (this.config.autoSimulate && manifest.convergence.is_locked) {
      this.simulator.injectFromManifest(manifest);
      this.simulator.start();

      // Run a few ticks synchronously for immediate output
      for (let i = 0; i < 5; i++) {
        this.simulator.tick();
      }

      simulation = this.simulator.getState();
    }

    const processingTime = performance.now() - startTime;

    const output: PipelineOutput = {
      input,
      manifest,
      artifacts,
      simulation,
      grammarRules,
      informantResponses,
      processingTime
    };

    this.history.push(output);
    return output;
  }

  /**
   * Query the engine about its current state
   */
  query(question: string): {
    answer: string;
    activeGates: number[];
    dominantAttractor: { dimension: string; gate: number; activation: number } | null;
    emotionalWeather: { fear: number; hope: number; desire: number; dominant: string };
    grammarStats: ReturnType<AUTOLINGHeuristicEngine['getGrammarStats']>;
  } {
    const activeNodes = this.mesh.getActiveNodes(0.1);
    const activeGates = [...new Set(activeNodes.map(n => n.address.gate + 1))];

    const dominantAttractor = this.simulator.getDominantAttractor();
    const emotionalWeather = this.simulator.getEmotionalWeather();
    const grammarStats = this.autoling.getGrammarStats();

    // Simple response generation based on state
    let answer = '';

    if (activeGates.length === 0) {
      answer = 'The mesh is quiet. No gates are active. Inject a signal to begin.';
    } else if (dominantAttractor) {
      answer = `The dominant attractor is Gate ${dominantAttractor.gate} in the ${dominantAttractor.dimension} dimension, ` +
               `with total activation ${dominantAttractor.totalActivation.toFixed(3)}. ` +
               `${activeGates.length} gates are currently resonant. ` +
               `The emotional weather is dominated by ${emotionalWeather.dominant}.`;
    } else {
      answer = `${activeGates.length} gates are active but no stable attractor has formed. ` +
               `The system is in a high-entropy state. ` +
               `Emotional weather: ${emotionalWeather.dominant}.`;
    }

    return {
      answer,
      activeGates,
      dominantAttractor: dominantAttractor ? {
        dimension: dominantAttractor.dimension,
        gate: dominantAttractor.gate,
        activation: dominantAttractor.totalActivation
      } : null,
      emotionalWeather,
      grammarStats
    };
  }

  /**
   * Get the full mesh state for visualization
   */
  getMeshState(): {
    totalNodes: number;
    activeNodes: number;
    activeGates: number[];
    byDimension: Record<string, number>;
    topNodes: Array<{ gate: number; dimension: string; activation: number; resonance: number }>;
  } {
    const activeNodes = this.mesh.getActiveNodes(0.01);
    const activeGates = [...new Set(activeNodes.map(n => n.address.gate + 1))];

    const byDimension: Record<string, number> = {};
    for (const node of activeNodes) {
      const dim = DIMENSIONS[node.address.dimension];
      byDimension[dim] = (byDimension[dim] || 0) + node.state[0];
    }

    const topNodes = activeNodes
      .sort((a, b) => b.state[0] - a.state[0])
      .slice(0, 20)
      .map(n => ({
        gate: n.address.gate + 1,
        dimension: DIMENSIONS[n.address.dimension],
        activation: n.state[0],
        resonance: n.state[1]
      }));

    return {
      totalNodes: 207360,
      activeNodes: activeNodes.length,
      activeGates,
      byDimension,
      topNodes
    };
  }

  /**
   * Get processing history
   */
  getHistory(): PipelineOutput[] {
    return this.history;
  }

  /**
   * Export the current grammar as a learning corpus
   */
  exportGrammar(): {
    rules: GrammarRule[];
    stats: ReturnType<AUTOLINGHeuristicEngine['getGrammarStats']>;
    acceptedProductions: string[];
  } {
    const rules = this.autoling.getGrammar();
    const stats = this.autoling.getGrammarStats();
    const acceptedProductions = this.autoling.getAcceptedRules().map(r => r.rhs.join(' '));

    return { rules, stats, acceptedProductions };
  }

  /**
   * Reset the entire engine
   */
  reset(): void {
    this.mesh = new MeshAddressingSystem();
    this.interrogator = new WHInterrogativeCore(this.mesh);
    this.autoling = new AUTOLINGHeuristicEngine(this.mesh, this.interrogator);
    this.transducer = new TransductionEngine(this.mesh);
    this.simulator = new MESSYSimulator(this.mesh);
    this.history = [];
  }
}

export default UniversalEngine;
