
// ============================================================
// LANGUAGE CONTACT MODEL v2
// 
// Foundation: I Ching substrate (64 gates, 6 lines, 13 filters)
// Analysis: Klein decomposition (AUTOLING, DISEMINER, operators)
// Contact: Field dynamics between I Ching states
// Output: Language realization from trajectory
//
// Architecture:
//   Input → Klein Decomposition → I Ching State → Trajectory
//     ↓
//   Contact Boundary (between two I Ching states)
//     ↓
//   Resonance Detection → Crystallization → Language Realization
// ============================================================

import {
  IChingState, IChingAddress, GateNumber, LineNumber,
  activate, createState, traverse, TraversalStep, TraversalOperator,
  computeCentroid, addressToArcSeconds
} from './i-ching-substrate';

import {
  KleinDecomposer, DiseminerOutput, FeatureStructure,
  MeaningOperator, OperatorApplication
} from './klein-decomposer';

// -----------------------------------------------------------
// CONTACT STATE — Two I Ching states in contact
// -----------------------------------------------------------

export interface ContactState {
  fieldA: IChingState;
  fieldB: IChingState;

  // The boundary has its own state
  boundary: {
    sharedActivations: Map<string, number>;  // Keys both fields activate
    interferencePattern: number[];           // Wave interference
    intimacy: number;                        // 0-1, grows with contact
    turn: number;
  };

  // Crystallizations that emerged from contact
  crystallizations: Crystallization[];

  // The contact history
  history: ContactEvent[];
}

export interface ContactEvent {
  turn: number;
  emitter: 'A' | 'B';

  // What was emitted: an I Ching state perturbation
  emission: {
    address: IChingAddress;
    strength: number;
    operator: TraversalOperator;
  };

  // What happened at the boundary
  resonance: ResonanceResult;

  // What crystallized
  crystallization: Crystallization | null;
}

export interface ResonanceResult {
  // Did the emission find a matching activation in the receiver?
  matched: boolean;

  // Which gate/line in the receiver resonated
  matchedAddress: IChingAddress | null;

  // Resonance strength (0-1)
  strength: number;

  // Harmonic level (1 = fundamental, 2 = octave, etc.)
  harmonic: number;

  // The interference pattern
  interference: number;
}

export interface Crystallization {
  id: string;

  // The stable address that emerged
  address: IChingAddress;

  // How it emerged
  type: 'resonance' | 'interference' | 'harmonic' | 'collision';

  // Its stability
  stability: number;

  // Which fields contributed
  contributors: ('A' | 'B')[];

  // When it emerged
  turn: number;

  // The feature structure it represents
  meaning: FeatureStructure | null;
}

// -----------------------------------------------------------
// LANGUAGE CONTACT ENGINE — The actual contact dynamics
// -----------------------------------------------------------

export class LanguageContactEngine {
  private state: ContactState;
  private decomposerA: KleinDecomposer;
  private decomposerB: KleinDecomposer;

  constructor() {
    this.state = {
      fieldA: createState(),
      fieldB: createState(),
      boundary: {
        sharedActivations: new Map(),
        interferencePattern: [0, 0, 0, 0, 0],
        intimacy: 0,
        turn: 0
      },
      crystallizations: [],
      history: []
    };

    this.decomposerA = new KleinDecomposer();
    this.decomposerB = new KleinDecomposer();
  }

  // ============================================================
  // CONTACT — The core operation
  // ============================================================

  public contact(
    emitter: 'A' | 'B',
    input: string,
    emphasis?: TraversalOperator
  ): ContactEvent {
    this.state.boundary.turn++;
    const turn = this.state.boundary.turn;

    // Step 1: Decompose the input through Klein
    const decomposer = emitter === 'A' ? this.decomposerA : this.decomposerB;
    const decomposition = decomposer.decompose(input);

    // Step 2: The decomposition becomes the emitter's state perturbation
    const emitterState = emitter === 'A' ? this.state.fieldA : this.state.fieldB;
    this.integrateDecomposition(emitterState, decomposition);

    // Step 3: Find the emission address (centroid or emphasized)
    const emissionAddress = emphasis 
      ? this.findEmphasisAddress(decomposition, emphasis)
      : computeCentroid(emitterState) || this.getDefaultAddress();

    // Step 4: The emission crosses the boundary
    const receiverState = emitter === 'A' ? this.state.fieldB : this.state.fieldA;
    const resonance = this.computeResonance(emissionAddress, receiverState);

    // Step 5: Update receiver state based on resonance
    if (resonance.matched && resonance.matchedAddress) {
      activate(receiverState, resonance.matchedAddress, resonance.strength * 0.5);
    }

    // Step 6: Check for crystallization
    const crystal = this.attemptCrystallization(emitter, emissionAddress, resonance, turn);
    if (crystal) {
      this.state.crystallizations.push(crystal);
    }

    // Step 7: Update boundary intimacy
    this.state.boundary.intimacy = Math.min(
      this.state.boundary.intimacy + resonance.strength * 0.05,
      1.0
    );

    // Step 8: Record event
    const event: ContactEvent = {
      turn,
      emitter,
      emission: {
        address: emissionAddress,
        strength: 1.0,
        operator: emphasis || 'advance_line'
      },
      resonance,
      crystallization: crystal
    };

    this.state.history.push(event);
    return event;
  }

  // ============================================================
  // RESONANCE — Compute how the emission interacts with receiver
  // ============================================================

  private computeResonance(emission: IChingAddress, receiver: IChingState): ResonanceResult {
    const emissionArcSec = addressToArcSeconds(emission);

    // Check each activation in the receiver
    let bestMatch: { address: IChingAddress; strength: number; harmonic: number } | null = null;

    for (const [key, activation] of receiver.activations) {
      const parts = key.split(':');
      const addr: IChingAddress = {
        gate: parseInt(parts[0]) as GateNumber,
        line: parseInt(parts[1]) as LineNumber,
        color: parts[2] as any,
        tone: parts[3] as any,
        base: parts[4] as any,
        filter: parts[5] as any
      };

      const receiverArcSec = addressToArcSeconds(addr);
      const distance = Math.abs(emissionArcSec - receiverArcSec);

      // Same gate = strong resonance
      const sameGate = addr.gate === emission.gate;
      const sameLine = addr.line === emission.line;

      let strength = 0;
      let harmonic = 0;

      if (sameGate && sameLine) {
        strength = 1.0;
        harmonic = 1;
      } else if (sameGate) {
        strength = 0.7;
        harmonic = 2;
      } else if (addr.line === emission.line) {
        strength = 0.5;
        harmonic = 3;
      } else {
        // Distance-based falloff
        strength = Math.max(0, 1 - distance / 100000);
        harmonic = Math.floor(1 / strength);
      }

      strength *= activation;  // Modulate by receiver's activation level

      if (!bestMatch || strength > bestMatch.strength) {
        bestMatch = { address: addr, strength, harmonic };
      }
    }

    if (bestMatch && bestMatch.strength > 0.1) {
      return {
        matched: true,
        matchedAddress: bestMatch.address,
        strength: bestMatch.strength,
        harmonic: bestMatch.harmonic,
        interference: bestMatch.strength * (this.state.boundary.intimacy + 0.1)
      };
    }

    return {
      matched: false,
      matchedAddress: null,
      strength: 0,
      harmonic: 0,
      interference: 0
    };
  }

  // ============================================================
  // CRYSTALLIZATION — Meaning condenses from field interaction
  // ============================================================

  private attemptCrystallization(
    emitter: 'A' | 'B',
    emission: IChingAddress,
    resonance: ResonanceResult,
    turn: number
  ): Crystallization | null {
    // Crystallization requires significant resonance change
    if (!resonance.matched || resonance.strength < 0.3) return null;

    // The crystallized address is between emission and matched address
    const matched = resonance.matchedAddress!;
    const crystalAddr: IChingAddress = {
      gate: Math.round((emission.gate + matched.gate) / 2) as GateNumber,
      line: Math.round((emission.line + matched.line) / 2) as LineNumber,
      color: emission.color,
      tone: emission.tone,
      base: emission.base,
      filter: matched.filter
    };

    // Determine emergence type
    let type: Crystallization['type'] = 'resonance';
    if (resonance.strength > 0.9) type = 'collision';
    else if (resonance.harmonic === 1) type = 'harmonic';
    else if (resonance.interference > 0.5) type = 'interference';

    return {
      id: `crystal_${turn}`,
      address: crystalAddr,
      type,
      stability: resonance.strength * this.state.boundary.intimacy,
      contributors: [emitter, emitter === 'A' ? 'B' : 'A'],
      turn,
      meaning: null  // Would be populated from feature structure
    };
  }

  // ============================================================
  // INTEGRATION — Merge decomposition into I Ching state
  // ============================================================

  private integrateDecomposition(state: IChingState, decomposition: DiseminerOutput): void {
    // Activate all addresses from the decomposition
    const dims = [decomposition.who, decomposition.what, decomposition.where, decomposition.when, decomposition.why];

    for (const dim of dims) {
      if (dim?.address) {
        activate(state, dim.address, dim.activation);
      }
    }

    // Also activate the full structure's centroid
    const centroid = computeCentroid(state);
    if (centroid) {
      activate(state, centroid, 0.5);
    }
  }

  private findEmphasisAddress(decomposition: DiseminerOutput, emphasis: TraversalOperator): IChingAddress {
    // Map traversal operator to dimension
    const dimMap: Record<string, FeatureStructure | null> = {
      'advance_line': decomposition.why,
      'retreat_line': decomposition.when,
      'cross_gate': decomposition.what,
      'planetary_shift': decomposition.who,
      'circuit_traverse': decomposition.where,
      'center_transition': decomposition.who,
      'hexagram_flip': decomposition.what,
      'line_resonance': decomposition.why
    };

    const feature = dimMap[emphasis];
    if (feature?.address) return feature.address;

    // Fallback to centroid
    const state = createState();
    this.integrateDecomposition(state, decomposition);
    return computeCentroid(state) || this.getDefaultAddress();
  }

  private getDefaultAddress(): IChingAddress {
    return {
      gate: 1, line: 1, color: 'red', tone: '1st', base: 'left', filter: 'sun'
    };
  }

  // ============================================================
  // STATE ACCESS
  // ============================================================

  public getState(): ContactState { return this.state; }
  public getHistory(): readonly ContactEvent[] { return this.state.history; }
  public getCrystallizations(): readonly Crystallization[] { return this.state.crystallizations; }
  public getIntimacy(): number { return this.state.boundary.intimacy; }
}

// -----------------------------------------------------------
// LANGUAGE REALIZER — Project I Ching trajectory back to text
// NOT prediction. Trajectory → language.
// -----------------------------------------------------------

export class LanguageRealizer {
  private gateVocabulary: Map<string, string[]> = new Map();

  constructor() {
    // Each gate has vocabulary it "speaks"
    this.gateVocabulary.set('1', ['create', 'inspire', 'initiate', 'begin']);
    this.gateVocabulary.set('2', ['receive', 'respond', 'nurture', 'support']);
    this.gateVocabulary.set('3', ['order', 'structure', 'organize', 'arrange']);
    this.gateVocabulary.set('4', ['answer', 'resolve', 'clarify', 'explain']);
    this.gateVocabulary.set('5', ['wait', 'patience', 'timing', 'rhythm']);
    this.gateVocabulary.set('6', ['conflict', 'friction', 'pressure', 'tension']);
    // ... all 64 gates
  }

  public realize(state: IChingState, emphasis?: string): string {
    // Get the most activated addresses
    const sorted = Array.from(state.activations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sorted.length === 0) return "...";

    // Build text from gate vocabulary
    const words: string[] = [];
    for (const [key, strength] of sorted) {
      const gate = key.split(':')[0];
      const vocab = this.gateVocabulary.get(gate);
      if (vocab) {
        const word = vocab[Math.floor(strength * vocab.length) % vocab.length];
        words.push(word);
      }
    }

    // Add emphasis-based framing
    if (emphasis === 'why') words.unshift("Because");
    if (emphasis === 'what') words.unshift("The issue is");
    if (emphasis === 'where') words.unshift("In this");
    if (emphasis === 'when') words.unshift("Now");
    if (emphasis === 'who') words.unshift("I");

    return words.join(' ') + '.';
  }

  public realizeTrajectory(trajectory: IChingAddress[]): string {
    // Realize a trajectory as a narrative
    const segments: string[] = [];
    for (let i = 0; i < trajectory.length; i++) {
      const addr = trajectory[i];
      const gate = addr.gate.toString();
      const vocab = this.gateVocabulary.get(gate);
      if (vocab) {
        segments.push(vocab[addr.line - 1] || vocab[0]);
      }
    }
    return segments.join(', then ');
  }
}
