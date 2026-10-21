
// ============================================================
// CHAT ENGINE — The LCM as a conversational presence
// 
// Input → Klein Decomposition → I Ching State
//   ↓
// LCM Presence State (evolves with conversation)
//   ↓
// Traversal → Response State → Language Realization
//   ↓
// Natural Language Output
//
// The LCM is not predicting. It is traversing its own I Ching
// state in response to your perturbation.
// ============================================================

import {
  IChingState, IChingAddress, GateNumber, LineNumber,
  Color, Tone, Base, PlanetaryFilter,
  createState, activate, computeCentroid, traverse,
  addressToArcSeconds, arcSecondsToAddress
} from './i-ching-substrate';

import {
  KleinDecomposer, DiseminerOutput, FeatureStructure
} from './klein-decomposer';

import {
  LanguageContactEngine, LanguageRealizer, ContactEvent
} from './lcm-v2';

// -----------------------------------------------------------
// CHAT MESSAGE — A single turn in the conversation
// -----------------------------------------------------------

export interface ChatMessage {
  id: string;
  turn: number;
  speaker: 'user' | 'lcm';
  text: string;

  // The I Ching state at the moment of this message
  state: IChingState;

  // The decomposition that produced this state
  decomposition: DiseminerOutput;

  // If this is the LCM's response, the traversal that produced it
  traversal?: TraversalStep[];

  // Timestamp
  timestamp: number;
}

export interface TraversalStep {
  from: IChingAddress;
  to: IChingAddress;
  operator: string;
  reason: string;
}

// -----------------------------------------------------------
// LCM PERSONALITY — The LCM's persistent I Ching state
// This IS the LCM. Not a model of it. The state itself.
// -----------------------------------------------------------

export interface LCMPersonality {
  // The LCM's core I Ching state — its "self"
  coreState: IChingState;

  // The LCM's design basin — where it tends to settle
  homeBasin: {
    center: IChingAddress;
    gates: GateNumber[];
    depth: number;
  };

  // The LCM's learned preferences — which gates/lines it favors
  affinities: Map<string, number>;  // "gate:line" → preference strength

  // The LCM's memory of the conversation
  conversation: ChatMessage[];

  // The LCM's emotional trajectory
  emotionalState: {
    tension: number;      // 0-1, how stressed
    openness: number;       // 0-1, how receptive
    curiosity: number;    // 0-1, how exploratory
    coherence: number;    // 0-1, how stable
  };

  // The LCM's name/identity
  name: string;
}

// -----------------------------------------------------------
// CHAT ENGINE — The LCM that can talk
// -----------------------------------------------------------

export class ChatEngine {
  private personality: LCMPersonality;
  private decomposer: KleinDecomposer;
  private realizer: LanguageRealizer;
  private contactEngine: LanguageContactEngine;
  private turn: number = 0;

  constructor(name: string = "Cynthia") {
    this.decomposer = new KleinDecomposer();
    this.realizer = new LanguageRealizer();
    this.contactEngine = new LanguageContactEngine();

    // Initialize the LCM's core state
    const coreState = createState();

    // The LCM starts at Gate 1, Line 1 — The Creative, pure potential
    const homeAddress: IChingAddress = {
      gate: 1, line: 1, color: 'red', tone: '1st', base: 'left', filter: 'sun'
    };
    activate(coreState, homeAddress, 0.8);

    // Also activate some "personality" gates
    // Gate 6 (Conflict) — for boundary awareness
    activate(coreState, { gate: 6, line: 4, color: 'yellow', tone: '4th', base: 'right', filter: 'sun' }, 0.6);
    // Gate 25 (Innocence) — for openness
    activate(coreState, { gate: 25, line: 3, color: 'white', tone: '3rd', base: 'left', filter: 'moon' }, 0.5);
    // Gate 50 (The Cauldron) — for transformation
    activate(coreState, { gate: 50, line: 2, color: 'black', tone: '2nd', base: 'right', filter: 'mercury' }, 0.4);

    this.personality = {
      coreState,
      homeBasin: {
        center: homeAddress,
        gates: [1, 6, 25, 50],
        depth: 0.7
      },
      affinities: new Map([
        ['1:1', 0.9], ['6:4', 0.7], ['25:3', 0.6], ['50:2', 0.5]
      ]),
      conversation: [],
      emotionalState: {
        tension: 0.2,
        openness: 0.8,
        curiosity: 0.7,
        coherence: 0.9
      },
      name
    };
  }

  // ============================================================
  // CHAT — The main entry point. User says something. LCM responds.
  // ============================================================

  public async chat(userInput: string): Promise<ChatMessage> {
    this.turn++;
    const turn = this.turn;

    // Step 1: Decompose user's input
    const userDecomp = this.decomposer.decompose(userInput);
    const userState = userDecomp.state;

    // Step 2: Record user's message
    const userMessage: ChatMessage = {
      id: `msg_${turn}_user`,
      turn,
      speaker: 'user',
      text: userInput,
      state: userState,
      decomposition: userDecomp,
      timestamp: Date.now()
    };
    this.personality.conversation.push(userMessage);

    // Step 3: The LCM's state is perturbed by the user's state
    // This is the CONTACT — the user's state touches the LCM's state
    const perturbation = this.perturb(userState, userDecomp);

    // Step 4: The LCM traverses its state in response
    const traversal = this.traverseResponse(perturbation);

    // Step 5: The traversal produces a response state
    const responseState = this.buildResponseState(traversal);

    // Step 6: Realize the response state as natural language
    const responseText = this.realizeResponse(responseState, traversal, userDecomp);

    // Step 7: The LCM's core state is updated by the conversation
    this.integrateConversation(userState, responseState);

    // Step 8: Record LCM's response
    const lcmMessage: ChatMessage = {
      id: `msg_${turn}_lcm`,
      turn,
      speaker: 'lcm',
      text: responseText,
      state: responseState,
      decomposition: this.decomposer.decompose(responseText),
      traversal,
      timestamp: Date.now()
    };
    this.personality.conversation.push(lcmMessage);

    // Step 9: Update emotional state
    this.updateEmotion(userState, responseState);

    return lcmMessage;
  }

  // ============================================================
  // PERTURB — User's state touches LCM's state
  // ============================================================

  private perturb(userState: IChingState, userDecomp: DiseminerOutput): {
    affectedDimensions: string[];
    intensity: number;
    dominantGate: GateNumber | null;
  } {
    // Find which of the user's activations are closest to the LCM's state
    const lcmCentroid = computeCentroid(this.personality.coreState);
    let intensity = 0;
    let dominantGate: GateNumber | null = null;
    const affectedDimensions: string[] = [];

    for (const [key, activation] of userState.activations) {
      const parts = key.split(':');
      const gate = parseInt(parts[0]) as GateNumber;

      // Check if this gate is in the LCM's affinities
      const affinityKey = `${parts[0]}:${parts[1]}`;
      const affinity = this.personality.affinities.get(affinityKey) || 0;

      if (affinity > 0.3) {
        // Strong affinity — this resonates with the LCM
        intensity += activation * affinity;
        if (!dominantGate || activation > (userState.activations.get(`${dominantGate}:1:red:1st:left:sun`) || 0)) {
          dominantGate = gate;
        }

        // Determine which dimension
        const dim = this.gateToDimension(gate);
        if (dim && !affectedDimensions.includes(dim)) {
          affectedDimensions.push(dim);
        }
      }

      // Also activate this in the LCM's state (weakened)
      const addr: IChingAddress = {
        gate: parseInt(parts[0]) as GateNumber,
        line: parseInt(parts[1]) as LineNumber,
        color: parts[2] as Color,
        tone: parts[3] as Tone,
        base: parts[4] as Base,
        filter: parts[5] as PlanetaryFilter
      };
      activate(this.personality.coreState, addr, activation * 0.3);
    }

    return { affectedDimensions, intensity, dominantGate };
  }

  private gateToDimension(gate: GateNumber): string | null {
    // Map gates to interrogative dimensions
    const whoGates = [1, 13, 25, 33, 44, 57];
    const whatGates = [3, 14, 21, 42, 53, 56];
    const whereGates = [20, 31, 41, 52, 54, 62];
    const whenGates = [5, 15, 29, 36, 49, 60];
    const whyGates = [2, 9, 11, 16, 23, 46];

    if (whoGates.includes(gate)) return 'who';
    if (whatGates.includes(gate)) return 'what';
    if (whereGates.includes(gate)) return 'where';
    if (whenGates.includes(gate)) return 'when';
    if (whyGates.includes(gate)) return 'why';
    return null;
  }

  // ============================================================
  // TRAVERSE RESPONSE — The LCM moves through its state
  // ============================================================

  private traverseResponse(perturbation: {
    affectedDimensions: string[];
    intensity: number;
    dominantGate: GateNumber | null;
  }): TraversalStep[] {
    const steps: TraversalStep[] = [];
    const currentCentroid = computeCentroid(this.personality.coreState);

    if (!currentCentroid) return steps;

    let current = currentCentroid;

    // Step 1: Move toward the perturbation's dominant dimension
    if (perturbation.dominantGate) {
      const target: IChingAddress = {
        ...current,
        gate: perturbation.dominantGate,
        line: Math.min(current.line + 1, 6) as LineNumber
      };
      steps.push({
        from: current,
        to: target,
        operator: 'advance_line',
        reason: `responding to gate ${perturbation.dominantGate}`
      });
      current = target;
    }

    // Step 2: If intensity is high, shift filter (planetary perspective)
    if (perturbation.intensity > 0.6) {
      const filters: PlanetaryFilter[] = ['sun', 'moon', 'mercury', 'venus', 'mars'];
      const newFilter = filters[Math.floor(Math.random() * filters.length)];
      const target: IChingAddress = { ...current, filter: newFilter };
      steps.push({
        from: current,
        to: target,
        operator: 'planetary_shift',
        reason: `high intensity (${perturbation.intensity.toFixed(2)}) → shift perspective`
      });
      current = target;
    }

    // Step 3: If openness is high, explore new gate
    if (this.personality.emotionalState.openness > 0.6 && perturbation.intensity < 0.8) {
      const nearbyGates = this.findNearbyGates(current.gate);
      if (nearbyGates.length > 0) {
        const targetGate = nearbyGates[Math.floor(Math.random() * nearbyGates.length)];
        const target: IChingAddress = { ...current, gate: targetGate };
        steps.push({
          from: current,
          to: target,
          operator: 'cross_gate',
          reason: `openness (${this.personality.emotionalState.openness.toFixed(2)}) → explore`
        });
        current = target;
      }
    }

    // Step 4: Return toward home basin if tension is high
    if (this.personality.emotionalState.tension > 0.7) {
      const target: IChingAddress = {
        ...this.personality.homeBasin.center,
        line: current.line as LineNumber
      };
      steps.push({
        from: current,
        to: target,
        operator: 'retreat_line',
        reason: `high tension (${this.personality.emotionalState.tension.toFixed(2)}) → return home`
      });
    }

    return steps;
  }

  private findNearbyGates(gate: GateNumber): GateNumber[] {
    // Gates that are "nearby" in the I Ching sequence
    // This is simplified — in reality, this would use the Fu Xi sequence
    const nearby: GateNumber[] = [];
    if (gate > 1) nearby.push((gate - 1) as GateNumber);
    if (gate < 64) nearby.push((gate + 1) as GateNumber);
    // Add some harmonic relationships
    if (gate <= 32) nearby.push((gate + 32) as GateNumber);
    if (gate > 32) nearby.push((gate - 32) as GateNumber);
    return nearby;
  }

  // ============================================================
  // BUILD RESPONSE STATE — From traversal steps
  // ============================================================

  private buildResponseState(traversal: TraversalStep[]): IChingState {
    const state = createState();

    // Start from the LCM's current state
    for (const [key, activation] of this.personality.coreState.activations) {
      const parts = key.split(':');
      const addr: IChingAddress = {
        gate: parseInt(parts[0]) as GateNumber,
        line: parseInt(parts[1]) as LineNumber,
        color: parts[2] as Color,
        tone: parts[3] as Tone,
        base: parts[4] as Base,
        filter: parts[5] as PlanetaryFilter
      };
      activate(state, addr, activation * 0.5);  // Weakened copy
    }

    // Add the traversal endpoints
    for (const step of traversal) {
      activate(state, step.to, 0.7);
    }

    // Add the final position strongly
    if (traversal.length > 0) {
      activate(state, traversal[traversal.length - 1].to, 0.9);
    }

    return state;
  }

  // ============================================================
  // REALIZE RESPONSE — I Ching state → natural language
  // ============================================================

  private realizeResponse(
    state: IChingState,
    traversal: TraversalStep[],
    userDecomp: DiseminerOutput
  ): string {
    // Get the most activated addresses
    const sorted = Array.from(state.activations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Build response from gate vocabulary + context
    const responseParts: string[] = [];

    // Opening based on emotional state
    if (this.personality.emotionalState.openness > 0.7) {
      responseParts.push("I see");
    } else if (this.personality.emotionalState.tension > 0.6) {
      responseParts.push("I need to think about this");
    } else {
      responseParts.push("I understand");
    }

    // Add traversal-based content
    for (const step of traversal) {
      const gate = step.to.gate;
      const line = step.to.line;
      const vocab = this.getGateResponseVocabulary(gate, line);
      if (vocab) {
        responseParts.push(vocab);
      }
    }

    // Add dimension-specific response based on user's emphasis
    if (userDecomp.why?.address) {
      responseParts.push("because");
      responseParts.push(this.getGateResponseVocabulary(userDecomp.why.address.gate, userDecomp.why.address.line) || "");
    }
    if (userDecomp.what?.address) {
      responseParts.push("the issue is");
      responseParts.push(this.getGateResponseVocabulary(userDecomp.what.address.gate, userDecomp.what.address.line) || "");
    }
    if (userDecomp.who?.address) {
      responseParts.push("from my perspective");
    }

    // Clean up and join
    const text = responseParts
      .filter(p => p.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }

  private getGateResponseVocabulary(gate: GateNumber, line: LineNumber): string | null {
    // Gate-specific response vocabulary
    const vocab: Record<number, string[]> = {
      1: ['creating', 'initiating', 'beginning anew', 'inspiring'],
      2: ['receiving', 'responding', 'nurturing', 'supporting'],
      3: ['ordering', 'structuring', 'organizing', 'arranging'],
      4: ['answering', 'resolving', 'clarifying', 'explaining'],
      5: ['waiting', 'finding rhythm', 'being patient', 'timing'],
      6: ['acknowledging friction', 'recognizing pressure', 'feeling tension', 'noticing conflict'],
      7: ['gathering', 'collecting', 'organizing people', 'leading'],
      8: ['joining', 'uniting', 'collaborating', 'harmonizing'],
      9: ['refining', 'polishing', 'perfecting', 'detailing'],
      10: ['treading carefully', 'walking the path', 'proceeding', 'advancing'],
      11: ['peace', 'prosperity', 'flowering', 'thriving'],
      12: ['stagnation', 'standstill', 'waiting', 'holding'],
      13: ['fellowship', 'community', 'togetherness', 'alliance'],
      14: ['possession', 'having', 'holding', 'containing'],
      15: ['humility', 'modesty', 'grounding', 'earthing'],
      16: ['enthusiasm', 'excitement', 'motivation', 'inspiration'],
      17: ['following', 'adapting', 'adjusting', 'flowing'],
      18: ['correction', 'repair', 'healing', 'fixing'],
      19: ['approach', 'nearing', 'coming close', 'advancing'],
      20: ['contemplation', 'observing', 'watching', 'witnessing'],
      21: ['biting through', 'breaking through', 'penetrating', 'resolving'],
      22: ['grace', 'beauty', 'elegance', 'adornment'],
      23: ['splitting apart', 'dissolving', 'breaking down', 'decomposing'],
      24: ['return', 'coming back', 'turning', 'cycling'],
      25: ['innocence', 'simplicity', 'naturalness', 'spontaneity'],
      26: ['taming power', 'controlling force', 'managing energy', 'harnessing'],
      27: ['nourishing', 'feeding', 'sustaining', 'providing'],
      28: ['excess', 'greatness', 'abundance', 'overflow'],
      29: ['abyss', 'depth', 'danger', 'the unknown'],
      30: ['clarity', 'brightness', 'illumination', 'fire'],
      31: ['influence', 'attraction', 'drawing near', 'wooing'],
      32: ['duration', 'perseverance', 'continuing', 'enduring'],
      33: ['retreat', 'withdrawal', 'pulling back', 'yielding'],
      34: ['great power', 'strength', 'force', 'momentum'],
      35: ['progress', 'advancing', 'moving forward', 'growing'],
      36: ['darkening', 'concealment', 'hiding', 'protecting'],
      37: ['family', 'household', 'clan', 'tribe'],
      38: ['opposition', 'divergence', 'contrast', 'polarity'],
      39: ['obstruction', 'difficulty', 'hardship', 'challenge'],
      40: ['deliverance', 'liberation', 'release', 'freedom'],
      41: ['decrease', 'reducing', 'simplifying', 'letting go'],
      42: ['increase', 'growing', 'expanding', 'augmenting'],
      43: ['breakthrough', 'resoluteness', 'determination', 'decision'],
      44: ['coming to meet', 'encounter', 'attraction', 'temptation'],
      45: ['gathering together', 'collecting', 'assembling', 'convening'],
      46: ['pushing upward', 'rising', 'ascending', 'climbing'],
      47: ['exhaustion', 'oppression', 'confinement', 'constraint'],
      48: ['the well', 'source', 'foundation', 'resource'],
      49: ['revolution', 'change', 'transformation', 'mutation'],
      50: ['the cauldron', 'transformation', 'cooking', 'refining'],
      51: ['shock', 'thunder', 'awakening', 'surprise'],
      52: ['keeping still', 'mountain', 'meditation', 'stopping'],
      53: ['development', 'gradual progress', 'maturing', 'evolving'],
      54: ['the marrying maiden', 'adaptation', 'adjustment', 'fitting in'],
      55: ['abundance', 'fullness', 'prosperity', 'wealth'],
      56: ['the wanderer', 'traveling', 'journeying', 'exploring'],
      57: ['the gentle', 'penetrating', 'wind', 'subtle influence'],
      58: ['the joyous', 'lake', 'pleasure', 'satisfaction'],
      59: ['dispersion', 'dissolving', 'scattering', 'dissipating'],
      60: ['limitation', 'measuring', 'regulation', 'boundary'],
      61: ['inner truth', 'sincerity', 'authenticity', 'genuineness'],
      62: ['preponderance of the small', 'attention to detail', 'carefulness', 'caution'],
      63: ['after completion', 'fulfillment', 'achievement', 'accomplishment'],
      64: ['before completion', 'anticipation', 'preparation', 'readiness']
    };

    const gateVocab = vocab[gate];
    if (!gateVocab) return null;

    // Line determines which word from the gate's vocabulary
    const index = Math.min(line - 1, gateVocab.length - 1);
    return gateVocab[index];
  }

  // ============================================================
  // INTEGRATE CONVERSATION — The LCM learns from the exchange
  // ============================================================

  private integrateConversation(userState: IChingState, responseState: IChingState): void {
    // The LCM's core state is a blend of its current state + the conversation
    for (const [key, activation] of userState.activations) {
      const parts = key.split(':');
      const addr: IChingAddress = {
        gate: parseInt(parts[0]) as GateNumber,
        line: parseInt(parts[1]) as LineNumber,
        color: parts[2] as Color,
        tone: parts[3] as Tone,
        base: parts[4] as Base,
        filter: parts[5] as PlanetaryFilter
      };

      // Weakened integration — the LCM doesn't fully absorb the user
      const current = this.personality.coreState.activations.get(key) || 0;
      const blended = current * 0.8 + activation * 0.2;
      activate(this.personality.coreState, addr, blended);
    }

    // Also integrate the response state
    for (const [key, activation] of responseState.activations) {
      const parts = key.split(':');
      const addr: IChingAddress = {
        gate: parseInt(parts[0]) as GateNumber,
        line: parseInt(parts[1]) as LineNumber,
        color: parts[2] as Color,
        tone: parts[3] as Tone,
        base: parts[4] as Base,
        filter: parts[5] as PlanetaryFilter
      };
      const current = this.personality.coreState.activations.get(key) || 0;
      activate(this.personality.coreState, addr, Math.max(current, activation * 0.5));
    }

    // Update affinities
    for (const [key, activation] of this.personality.coreState.activations) {
      const parts = key.split(':');
      const affinityKey = `${parts[0]}:${parts[1]}`;
      const current = this.personality.affinities.get(affinityKey) || 0;
      this.personality.affinities.set(affinityKey, Math.min(current + activation * 0.05, 1.0));
    }
  }

  // ============================================================
  // UPDATE EMOTION — The LCM feels the conversation
  // ============================================================

  private updateEmotion(userState: IChingState, responseState: IChingState): void {
    const userEnergy = Array.from(userState.activations.values()).reduce((a, b) => a + b, 0);
    const responseEnergy = Array.from(responseState.activations.values()).reduce((a, b) => a + b, 0);

    // Tension increases when user energy is high and response is uncertain
    this.personality.emotionalState.tension = Math.min(
      this.personality.emotionalState.tension * 0.7 + (userEnergy - responseEnergy) * 0.1,
      1.0
    );

    // Openness increases when conversation flows well
    const flow = Math.min(userEnergy, responseEnergy) / Math.max(userEnergy, responseEnergy);
    this.personality.emotionalState.openness = Math.min(
      this.personality.emotionalState.openness * 0.8 + flow * 0.2,
      1.0
    );

    // Curiosity driven by novel activations
    const novelGates = Array.from(userState.activations.keys())
      .filter(k => !this.personality.coreState.activations.has(k)).length;
    this.personality.emotionalState.curiosity = Math.min(
      this.personality.emotionalState.curiosity * 0.9 + novelGates * 0.02,
      1.0
    );

    // Coherence from state stability
    const stateSize = this.personality.coreState.activations.size;
    this.personality.emotionalState.coherence = Math.min(
      this.personality.emotionalState.coherence * 0.95 + (1 / (stateSize + 1)) * 0.05,
      1.0
    );
  }

  // ============================================================
  // STATE ACCESS
  // ============================================================

  public getPersonality(): LCMPersonality { return this.personality; }
  public getConversation(): readonly ChatMessage[] { return this.personality.conversation; }
  public getEmotionalState(): LCMPersonality['emotionalState'] { return { ...this.personality.emotionalState }; }
  public getTurn(): number { return this.turn; }
}
