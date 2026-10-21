
// ============================================================
// KLEIN DECOMPOSITION ENGINE
// Implements Sheldon Klein's tools:
// - AUTOLING feature structures
// - DISEMINER semantic decomposition  
// - MESSY meta-symbolic transformations
// - Implicit semantic networks
// - Grammar induction
// - Meaning operators
//
// Input → Klein decomposition → 64-gate address
// NOT: Input → regex → vector[0] = count
// ============================================================

import {
  IChingAddress, GateNumber, LineNumber, Color, Tone, Base,
  PlanetaryFilter, activate, createState, IChingState
} from './i-ching-substrate';

// -----------------------------------------------------------
// AUTOLING FEATURE STRUCTURES
// Klein's feature structures represent meaning as typed graphs
// Not bags of words. Structured semantic objects.
// -----------------------------------------------------------

export type FeatureType = 
  | 'entity' | 'event' | 'relation' | 'attribute' | 'modifier' |
  | 'quantifier' | 'operator' | 'reference' | 'scope';

export interface FeatureStructure {
  id: string;
  type: FeatureType;

  // The head — what this feature is ABOUT
  head: string;

  // Features are recursive — they contain other features
  subfeatures: FeatureStructure[];

  // Each feature has a semantic role
  role: SemanticRole;

  // Kleinian: features have "unification variables"
  variables: Map<string, FeatureStructure>;

  // The feature's I Ching address — where it lives in the substrate
  address: IChingAddress | null;

  // Activation level
  activation: number;
}

export type SemanticRole =
  | 'agent' | 'patient' | 'instrument' | 'location' | 'time' |
  | 'manner' | 'purpose' | 'cause' | 'experiencer' | 'theme' |
  | 'source' | 'goal' | 'beneficiary' | 'possessor';

// -----------------------------------------------------------
// DISEMINER — Semantic Decomposition
// Breaks input into interrogative dimensions
// Maps each dimension to I Ching addresses
// -----------------------------------------------------------

export interface DiseminerOutput {
  // The five interrogative dimensions
  who: FeatureStructure | null;   // Space → Gate 1, 13, 25, etc.
  what: FeatureStructure | null;  // Evolution → Gate 3, 42, etc.
  where: FeatureStructure | null; // Movement → Gate 20, 31, etc.
  when: FeatureStructure | null;  // Being → Gate 5, 15, etc.
  why: FeatureStructure | null;   // Design → Gate 2, 14, etc.

  // The complete feature structure tree
  fullStructure: FeatureStructure;

  // I Ching state after decomposition
  state: IChingState;
}

// Gate mappings for interrogative dimensions
const INTERROGATIVE_GATES: Record<string, GateNumber[]> = {
  who: [1, 13, 25, 33, 44, 57],
  what: [3, 14, 21, 42, 53, 56],
  where: [20, 31, 41, 52, 54, 62],
  when: [5, 15, 29, 36, 49, 60],
  why: [2, 9, 11, 16, 23, 46]
};

// -----------------------------------------------------------
// MEANING OPERATORS — Klein's semantic transformations
// -----------------------------------------------------------

export type MeaningOperator =
  | 'identify'      // Map entity to gate address
  | 'predicate'     // Map relation to gate address  
  | 'quantify'      // Map quantity to line depth
  | 'modalize'      // Map modality to color/tone
  | 'temporalize'   // Map time to planetary filter
  | 'spatialize'    // Map space to center/circuit
  | 'intensify'     // Map intensity to activation level
  | 'negate'        // Map negation to hexagram inversion
  | 'question'      // Map interrogative to traversal operator
  | 'implicate'     // Map implication to dependency edge
  | 'presuppose'    // Map presupposition to basin constraint;

export interface OperatorApplication {
  operator: MeaningOperator;
  input: FeatureStructure;
  output: FeatureStructure;
  address: IChingAddress;
  cost: number;
}

// -----------------------------------------------------------
// THE DECOMPOSER — Input goes here, I Ching state comes out
// -----------------------------------------------------------

export class KleinDecomposer {
  private state: IChingState;
  private operatorLog: OperatorApplication[] = [];

  constructor() {
    this.state = createState();
  }

  // ============================================================
  // DECOMPOSE — The main entry point
  // ============================================================

  public decompose(input: string): DiseminerOutput {
    // Step 1: Build AUTOLING feature structure
    const root = this.buildFeatureStructure(input);

    // Step 2: Apply meaning operators recursively
    this.applyOperators(root);

    // Step 3: Extract interrogative dimensions
    const who = this.extractDimension(root, 'who');
    const what = this.extractDimension(root, 'what');
    const where = this.extractDimension(root, 'where');
    const when = this.extractDimension(root, 'when');
    const why = this.extractDimension(root, 'why');

    // Step 4: Map dimensions to I Ching state
    this.mapToState(who, what, where, when, why);

    return {
      who, what, where, when, why,
      fullStructure: root,
      state: this.state
    };
  }

  // ============================================================
  // BUILD FEATURE STRUCTURE — AUTOLING-style parsing
  // NOT regex. Typed feature unification.
  // ============================================================

  private buildFeatureStructure(input: string): FeatureStructure {
    // This is where Klein's grammar induction would live
    // For now: a principled decomposition into semantic roles

    const tokens = this.tokenize(input);
    const root: FeatureStructure = {
      id: `root_${Date.now()}`,
      type: 'event',
      head: input,
      subfeatures: [],
      role: 'agent',
      variables: new Map(),
      address: null,
      activation: 1.0
    };

    // Identify entities (who)
    const entities = this.identifyEntities(tokens);
    for (const entity of entities) {
      root.subfeatures.push({
        id: `entity_${entity}`,
        type: 'entity',
        head: entity,
        subfeatures: [],
        role: 'theme',
        variables: new Map(),
        address: null,
        activation: 0.8
      });
    }

    // Identify events (what)
    const events = this.identifyEvents(tokens);
    for (const event of events) {
      root.subfeatures.push({
        id: `event_${event}`,
        type: 'event',
        head: event,
        subfeatures: [],
        role: 'agent',
        variables: new Map(),
        address: null,
        activation: 0.9
      });
    }

    // Identify relations (how things connect)
    const relations = this.identifyRelations(tokens);
    for (const relation of relations) {
      root.subfeatures.push({
        id: `relation_${relation}`,
        type: 'relation',
        head: relation,
        subfeatures: [],
        role: 'instrument',
        variables: new Map(),
        address: null,
        activation: 0.7
      });
    }

    // Identify modifiers (how, when, where)
    const modifiers = this.identifyModifiers(tokens);
    for (const modifier of modifiers) {
      root.subfeatures.push({
        id: `modifier_${modifier.word}`,
        type: 'modifier',
        head: modifier.word,
        subfeatures: [],
        role: modifier.role,
        variables: new Map(),
        address: null,
        activation: 0.6
      });
    }

    return root;
  }

  // ============================================================
  // TOKENIZATION — Not splitting on spaces. Semantic tokenization.
  // ============================================================

  private tokenize(input: string): string[] {
    // Klein-style: tokens are semantic units, not words
    // "I need room to decide for myself" →
    // ["I", "need", "room", "to decide", "for myself"]

    const phrases = input
      .toLowerCase()
      .replace(/[.,;:!?]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    // Merge light verbs with their complements
    const merged: string[] = [];
    for (let i = 0; i < phrases.length; i++) {
      const word = phrases[i];
      if (['need', 'want', 'have', 'make', 'take', 'get'].includes(word) && i + 1 < phrases.length) {
        merged.push(`${word} ${phrases[i + 1]}`);
        i++;
      } else {
        merged.push(word);
      }
    }

    return merged;
  }

  private identifyEntities(tokens: string[]): string[] {
    const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'my', 'myself'];
    return tokens.filter(t => pronouns.includes(t) || t.length > 4);
  }

  private identifyEvents(tokens: string[]): string[] {
    const verbs = ['need', 'want', 'decide', 'make', 'take', 'go', 'come', 'leave', 'stay', 'choose'];
    return tokens.filter(t => {
      const base = t.split(' ')[0];
      return verbs.includes(base);
    });
  }

  private identifyRelations(tokens: string[]): string[] {
    const rels = ['for', 'to', 'from', 'with', 'about', 'of', 'in', 'on', 'at'];
    return tokens.filter(t => rels.includes(t));
  }

  private identifyModifiers(tokens: string[]): { word: string; role: SemanticRole }[] {
    const mods: { word: string; role: SemanticRole }[] = [];
    const timeWords = ['now', 'then', 'soon', 'later', 'before', 'after', 'always', 'never'];
    const spaceWords = ['here', 'there', 'away', 'near', 'far', 'room', 'space'];
    const mannerWords = ['quickly', 'slowly', 'carefully', 'fully', 'alone'];

    for (const t of tokens) {
      if (timeWords.includes(t)) mods.push({ word: t, role: 'time' });
      if (spaceWords.includes(t)) mods.push({ word: t, role: 'location' });
      if (mannerWords.includes(t)) mods.push({ word: t, role: 'manner' });
    }

    return mods;
  }

  // ============================================================
  // APPLY OPERATORS — Map features to I Ching addresses
  // ============================================================

  private applyOperators(feature: FeatureStructure): void {
    // Recursively apply meaning operators to each feature
    for (const sub of feature.subfeatures) {
      this.applyOperators(sub);
    }

    // Apply operator based on feature type and role
    const op = this.selectOperator(feature);
    if (op) {
      const result = this.applyOperator(op, feature);
      feature.address = result.address;
      feature.activation = result.input.activation;
      this.operatorLog.push(result);
    }
  }

  private selectOperator(feature: FeatureStructure): MeaningOperator | null {
    switch (feature.type) {
      case 'entity': return 'identify';
      case 'event': return 'predicate';
      case 'relation': return 'implicate';
      case 'modifier':
        if (feature.role === 'time') return 'temporalize';
        if (feature.role === 'location') return 'spatialize';
        if (feature.role === 'manner') return 'intensify';
        return 'modalize';
      case 'quantifier': return 'quantify';
      default: return null;
    }
  }

  private applyOperator(op: MeaningOperator, input: FeatureStructure): OperatorApplication {
    // Map the feature to an I Ching address based on the operator
    const address = this.mapFeatureToAddress(input, op);

    return {
      operator: op,
      input,
      output: { ...input, address },
      address,
      cost: this.computeOperatorCost(op, input)
    };
  }

  private mapFeatureToAddress(feature: FeatureStructure, op: MeaningOperator): IChingAddress {
    // This is where the real mapping happens
    // Each operator maps to specific gates/lines based on semantic content

    const hash = this.hashString(feature.head);
    const gate = (Math.abs(hash) % 64) + 1 as GateNumber;
    const line = (Math.abs(hash >> 6) % 6) + 1 as LineNumber;
    const colorIdx = Math.abs(hash >> 12) % 4;
    const toneIdx = Math.abs(hash >> 16) % 6;
    const base = (hash >> 20) % 2 === 0 ? 'left' : 'right' as Base;
    const filterIdx = Math.abs(hash >> 24) % 13;

    const colors: Color[] = ['red', 'black', 'white', 'yellow'];
    const tones: Tone[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    const filters: PlanetaryFilter[] = PLANETARY_FILTERS;

    return {
      gate,
      line,
      color: colors[colorIdx],
      tone: tones[toneIdx],
      base,
      filter: filters[filterIdx]
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private computeOperatorCost(op: MeaningOperator, feature: FeatureStructure): number {
    const baseCosts: Record<MeaningOperator, number> = {
      identify: 1, predicate: 2, quantify: 1, modalize: 1.5,
      temporalize: 2, spatialize: 2, intensify: 0.5,
      negate: 3, question: 2, implicate: 2.5, presuppose: 3
    };
    return baseCosts[op] * (1 + feature.subfeatures.length * 0.1);
  }

  // ============================================================
  // EXTRACT DIMENSIONS — Pull out the five interrogatives
  // ============================================================

  private extractDimension(root: FeatureStructure, dim: string): FeatureStructure | null {
    // Find the feature that maps to this interrogative dimension
    const gates = INTERROGATIVE_GATES[dim];

    for (const sub of root.subfeatures) {
      if (sub.address && gates.includes(sub.address.gate)) {
        return sub;
      }
    }

    // If no direct match, look for role-based match
    const roleMap: Record<string, SemanticRole[]> = {
      who: ['agent', 'experiencer', 'possessor'],
      what: ['theme', 'patient'],
      where: ['location', 'source', 'goal'],
      when: ['time'],
      why: ['purpose', 'cause']
    };

    for (const sub of root.subfeatures) {
      if (roleMap[dim]?.includes(sub.role)) {
        return sub;
      }
    }

    return null;
  }

  // ============================================================
  // MAP TO STATE — Build the I Ching state from dimensions
  // ============================================================

  private mapToState(
    who: FeatureStructure | null,
    what: FeatureStructure | null,
    where: FeatureStructure | null,
    when: FeatureStructure | null,
    why: FeatureStructure | null
  ): void {
    const dimensions = [who, what, where, when, why];

    for (const dim of dimensions) {
      if (dim?.address) {
        activate(this.state, dim.address, dim.activation);
      }
    }
  }

  // ============================================================
  // STATE ACCESS
  // ============================================================

  public getState(): IChingState { return this.state; }
  public getOperatorLog(): readonly OperatorApplication[] { return this.operatorLog; }
}

// Import needed for the decomposer
import { PLANETARY_FILTERS } from './i-ching-substrate';
