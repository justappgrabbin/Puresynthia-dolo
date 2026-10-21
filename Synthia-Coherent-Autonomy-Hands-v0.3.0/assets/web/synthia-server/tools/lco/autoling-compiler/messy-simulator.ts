
/**
 * MESSY Simulator (Meta-Symbolic Simulation Engine)
 * 
 * Asynchronous node firing based on internal resonance.
 * No global update. Data propagates like a wave through the mesh
 * until it hits a boundary (attractor basin).
 * 
 * Based on Klein's MESSY but modernized for the 69,120-node mesh.
 */

import { MeshAddressingSystem, TOTAL_NODES, DIMENSIONS } from './mesh-addressing-system';
import { InterrogationManifest } from './wh-interrogative-core';

export interface SimulationState {
  timestamp: number;
  activeNodes: Array<{
    packed: number;
    dimension: number;
    gate: number;
    activation: number;
    resonance: number;
    fear: number;
    hope: number;
    desire: number;
  }>;
  waveFronts: Array<{
    origin: number;
    current: number;
    distance: number;
    intensity: number;
    path: number[];
  }>;
  attractorBasins: Array<{
    center: number;
    radius: number;
    nodes: number[];
    totalActivation: number;
  }>;
  entropy: number;
  coherence: number;
}

export interface SimulationConfig {
  propagationSpeed: number;      // Nodes per tick
  decayRate: number;             // Activation decay per tick
  resonanceThreshold: number;    // Minimum resonance to propagate
  maxWaveDistance: number;       // Maximum propagation distance
  attractorThreshold: number;    // Activation level to form attractor
  tickInterval: number;          // ms between ticks
}

export class MESSYSimulator {
  private mesh: MeshAddressingSystem;
  private config: SimulationConfig;
  private currentState: SimulationState;
  private isRunning: boolean;
  private tickCount: number;
  private waveQueue: Array<{ origin: number; intensity: number; timestamp: number }>;

  constructor(mesh: MeshAddressingSystem, config?: Partial<SimulationConfig>) {
    this.mesh = mesh;
    this.config = {
      propagationSpeed: 10,
      decayRate: 0.05,
      resonanceThreshold: 0.1,
      maxWaveDistance: 5,
      attractorThreshold: 0.7,
      tickInterval: 100,
      ...config
    };

    this.currentState = this.initializeState();
    this.isRunning = false;
    this.tickCount = 0;
    this.waveQueue = [];
  }

  private initializeState(): SimulationState {
    return {
      timestamp: Date.now(),
      activeNodes: [],
      waveFronts: [],
      attractorBasins: [],
      entropy: 1.0,
      coherence: 0.0
    };
  }

  /**
   * Inject a signal into the mesh at a specific gate
   */
  injectSignal(gateId: number, dimension: number = 0, intensity: number = 1.0): void {
    const packed = this.mesh.pack({
      dimension,
      gate: gateId,
      line: 0,
      color: 0,
      tone: 0,
      base: 0
    });

    this.mesh.activate(packed, intensity);
    this.waveQueue.push({ origin: packed, intensity, timestamp: Date.now() });
  }

  /**
   * Inject from an interrogation manifest
   */
  injectFromManifest(manifest: InterrogationManifest): void {
    if (manifest.convergence.is_locked && manifest.convergence.locked_gate_id !== null) {
      const addr = manifest.convergence.locked_address;
      if (addr) {
        this.injectSignal(
          addr.gate,
          addr.dimension,
          manifest.convergence.confidence_score
        );
      }
    }
  }

  /**
   * Start the asynchronous simulation
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.runSimulation();
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Run a single tick of the simulation
   */
  tick(): SimulationState {
    this.tickCount++;

    // Process wave propagation
    this.propagateWaves();

    // Decay activations
    this.decayActivations();

    // Detect attractor basins
    this.detectAttractors();

    // Calculate entropy and coherence
    this.calculateMetrics();

    // Build state snapshot
    this.currentState = this.buildState();

    return this.currentState;
  }

  private async runSimulation(): Promise<void> {
    while (this.isRunning) {
      this.tick();
      await this.sleep(this.config.tickInterval);
    }
  }

  private propagateWaves(): void {
    const newWaves: Array<{ origin: number; intensity: number; timestamp: number }> = [];

    for (const wave of this.waveQueue) {
      const field = this.mesh.getResonanceField(wave.origin, this.config.maxWaveDistance);

      for (const [node, decay] of field) {
        if (node === wave.origin) continue;

        const state = this.mesh.getState(node);
        const newResonance = wave.intensity * decay;

        if (newResonance > this.config.resonanceThreshold) {
          state[1] = Math.min(1.0, state[1] + newResonance * 0.3);

          // If resonance is high enough, trigger activation
          if (state[1] > 0.5) {
            state[0] = Math.min(1.0, state[0] + newResonance * 0.2);

            // Spawn new wave if activation crosses threshold
            if (state[0] > 0.3) {
              newWaves.push({
                origin: node,
                intensity: state[0] * 0.7,
                timestamp: Date.now()
              });
            }
          }
        }
      }
    }

    this.waveQueue = newWaves;
  }

  private decayActivations(): void {
    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.mesh['indexToPacked'](i);
      const state = this.mesh.getState(packed);

      state[0] = Math.max(0, state[0] - this.config.decayRate);
      state[1] = Math.max(0, state[1] - this.config.decayRate * 0.5);

      // Decay emotional states
      state[2] = Math.max(0, state[2] - this.config.decayRate * 0.3); // fear
      state[3] = Math.max(0, state[3] - this.config.decayRate * 0.3); // hope
      state[4] = Math.max(0, state[4] - this.config.decayRate * 0.3); // desire
    }
  }

  private detectAttractors(): void {
    const basins: Array<{ center: number; radius: number; nodes: number[]; totalActivation: number }> = [];
    const visited = new Set<number>();

    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.mesh['indexToPacked'](i);
      const state = this.mesh.getState(packed);

      if (state[0] > this.config.attractorThreshold && !visited.has(packed)) {
        // Found an attractor center
        const basin = this.expandBasin(packed, visited);
        if (basin.nodes.length > 1) {
          basins.push(basin);
        }
      }
    }

    this.currentState.attractorBasins = basins;
  }

  private expandBasin(center: number, visited: Set<number>): {
    center: number;
    radius: number;
    nodes: number[];
    totalActivation: number;
  } {
    const nodes: number[] = [center];
    const queue: Array<{ node: number; dist: number }> = [{ node: center, dist: 0 }];
    let totalActivation = this.mesh.getState(center)[0];
    let maxDist = 0;

    visited.add(center);

    while (queue.length > 0) {
      const { node, dist } = queue.shift()!;

      if (dist > maxDist) maxDist = dist;

      const neighbors = this.mesh['adjacency'].get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            const state = this.mesh.getState(neighbor);
            if (state[0] > 0.1 || state[1] > 0.2) {
              visited.add(neighbor);
              nodes.push(neighbor);
              totalActivation += state[0];
              queue.push({ node: neighbor, dist: dist + 1 });
            }
          }
        }
      }
    }

    return { center, radius: maxDist, nodes, totalActivation };
  }

  private calculateMetrics(): void {
    let totalActivation = 0;
    let totalResonance = 0;
    let activeCount = 0;
    let resonanceCount = 0;

    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.mesh['indexToPacked'](i);
      const state = this.mesh.getState(packed);

      if (state[0] > 0.01) {
        totalActivation += state[0];
        activeCount++;
      }
      if (state[1] > 0.01) {
        totalResonance += state[1];
        resonanceCount++;
      }
    }

    // Entropy: how spread out the activation is
    const activationDensity = activeCount / TOTAL_NODES;
    this.currentState.entropy = activationDensity > 0 
      ? -activationDensity * Math.log(activationDensity) 
      : 1.0;

    // Coherence: how concentrated in attractor basins
    const basinActivation = this.currentState.attractorBasins.reduce((sum, b) => sum + b.totalActivation, 0);
    this.currentState.coherence = totalActivation > 0 ? basinActivation / totalActivation : 0;
  }

  private buildState(): SimulationState {
    const activeNodes: Array<{
      packed: number;
      dimension: number;
      gate: number;
      activation: number;
      resonance: number;
      fear: number;
      hope: number;
      desire: number;
    }> = [];

    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.mesh['indexToPacked'](i);
      const state = this.mesh.getState(packed);

      if (state[0] > 0.01 || state[1] > 0.01) {
        const addr = this.mesh.unpack(packed);
        activeNodes.push({
          packed,
          dimension: addr.dimension,
          gate: addr.gate,
          activation: state[0],
          resonance: state[1],
          fear: state[2],
          hope: state[3],
          desire: state[4]
        });
      }
    }

    return {
      timestamp: Date.now(),
      activeNodes: activeNodes.sort((a, b) => b.activation - a.activation).slice(0, 100),
      waveFronts: this.waveQueue.map(w => ({
        origin: w.origin,
        current: w.origin,
        distance: 0,
        intensity: w.intensity,
        path: [w.origin]
      })),
      attractorBasins: this.currentState.attractorBasins,
      entropy: this.currentState.entropy,
      coherence: this.currentState.coherence
    };
  }

  getState(): SimulationState {
    return this.currentState;
  }

  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * Get the dominant attractor (highest total activation)
   */
  getDominantAttractor(): { center: number; dimension: string; gate: number; totalActivation: number } | null {
    if (this.currentState.attractorBasins.length === 0) return null;

    const dominant = this.currentState.attractorBasins.reduce((max, basin) => 
      basin.totalActivation > max.totalActivation ? basin : max
    );

    const addr = this.mesh.unpack(dominant.center);
    return {
      center: dominant.center,
      dimension: DIMENSIONS[addr.dimension],
      gate: addr.gate + 1,
      totalActivation: dominant.totalActivation
    };
  }

  /**
   * Get emotional weather (aggregate of fear/hope/desire across mesh)
   */
  getEmotionalWeather(): { fear: number; hope: number; desire: number; dominant: string } {
    let totalFear = 0;
    let totalHope = 0;
    let totalDesire = 0;
    let count = 0;

    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.mesh['indexToPacked'](i);
      const state = this.mesh.getState(packed);

      if (state[0] > 0.01) {
        totalFear += state[2];
        totalHope += state[3];
        totalDesire += state[4];
        count++;
      }
    }

    const fear = count > 0 ? totalFear / count : 0;
    const hope = count > 0 ? totalHope / count : 0;
    const desire = count > 0 ? totalDesire / count : 0;

    const dominant = fear > hope && fear > desire ? 'fear' 
      : hope > desire ? 'hope' 
      : 'desire';

    return { fear, hope, desire, dominant };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MESSYSimulator;
