// semanticOS.js — THE CORE ENGINE
//
// The Five-Layer Stack, implemented:
//   Layer 1: Parser        (Who, What, Where, When, Why)
//   Layer 2: Ontology       (Movement, Evolution, Being, Design, Space)
//   Layer 3: Address        (Gate, Line, Color, Tone, Base, Degree, ...)
//   Layer 4: State          (Resolved coordinate — identity lives here)
//   Layer 5: Morphism      (How — the transition operator)
//
// This is NOT an LLM. It is a coordinate system in which meaning lives
// and transforms. The hypothesis: structurally equivalent states share
// transformation laws regardless of domain.

import { createHash } from 'crypto';
import { ToolBase } from './ToolBase.js';

export class SemanticOS extends ToolBase {
  constructor(mesh) {
    super(mesh, 'SemanticOS', 'core.semanticos');
    this.substrate = new Map(); // hash -> State
    this.operators = new Map(); // name -> Morphism
    this.initializeDefaultOperators();
  }

  /** Primary Compiler: Resolves structural input into Field State */
  resolve(input) {
    const ontology = this.computeOntology(input.coordinates);

    const rawState = {
      who: input.who,
      what: input.what,
      where: input.where,
      when: input.when,
      why: input.why,
      ontology,
      coordinates: input.coordinates,
      domain: input.domain || "unknown"
    };

    const hash = this.computeDeterministicHash(rawState);
    const finalizedState = { ...rawState, resolved: true, hash };
    this.substrate.set(hash, finalizedState);

    this.mesh.publish(this.channel, this.name, {
      event: 'STATE_RESOLVED',
      hash,
      domain: finalizedState.domain,
      gate: finalizedState.coordinates.gate,
      line: finalizedState.coordinates.line
    });

    return finalizedState;
  }

  /** Core Morphism: How(State) -> New State */
  transition(state, operatorName) {
    const operator = this.operators.get(operatorName);
    if (!operator) {
      throw new Error(`Execution error: Morphism operator "${operatorName}" is undefined.`);
    }

    const transformedState = operator(state);
    transformedState.hash = this.computeDeterministicHash(transformedState);
    this.substrate.set(transformedState.hash, transformedState);

    this.mesh.publish(this.channel, this.name, {
      event: 'STATE_TRANSITIONED',
      fromHash: state.hash,
      toHash: transformedState.hash,
      operator: operatorName
    });

    return transformedState;
  }

  /** Check structural equivalence — same transformation laws apply */
  checkEquivalence(stateA, stateB) {
    return (
      stateA.ontology.movement === stateB.ontology.movement &&
      stateA.ontology.evolution === stateB.ontology.evolution &&
      stateA.ontology.being === stateB.ontology.being &&
      stateA.ontology.design === stateB.ontology.design &&
      stateA.ontology.space === stateB.ontology.space &&
      stateA.coordinates.gate === stateB.coordinates.gate &&
      stateA.coordinates.line === stateB.coordinates.line
    );
  }

  /** Cross-Domain Invariant Transduction */
  projectInvariant(sourceState, targetDomain) {
    const structuralMatch = this.findEquivalenceInDomain(sourceState, targetDomain);
    if (structuralMatch) {
      const projected = {
        ...sourceState,
        domain: targetDomain,
        hash: this.computeDeterministicHash({ ...sourceState, domain: targetDomain })
      };
      this.substrate.set(projected.hash, projected);
      return projected;
    }
    return null;
  }

  /** Mathematical Projection: Coordinates -> 5D Ontology Field */
  computeOntology(coords) {
    return {
      movement: (coords.gate % 8) / 8,
      evolution: (coords.line - 1) / 5,
      being: ((coords.color - 1) * 6 + (coords.tone - 1)) / 35,
      design: (coords.base - 1) / 4,
      space: (coords.degree + (coords.house - 1) * 30 + coords.minute / 60) / 360
    };
  }

  computeDeterministicHash(obj) {
    const clearString = JSON.stringify(obj, Object.keys(obj).sort());
    return createHash("sha256").update(clearString).digest("hex");
  }

  findEquivalenceInDomain(state, domain) {
    for (const [, targetState] of this.substrate) {
      if (targetState.domain === domain && this.checkEquivalence(state, targetState)) {
        return targetState;
      }
    }
    return undefined;
  }

  registerOperator(name, morphism) {
    this.operators.set(name, morphism);
  }

  initializeDefaultOperators() {
    // REFLECT: Symmetrical polar reflection across the field
    this.registerOperator("reflect", (state) => ({
      ...state,
      coordinates: {
        ...state.coordinates,
        degree: (state.coordinates.degree + 180) % 360,
        house: ((state.coordinates.house + 6) % 12) || 12
      }
    }));

    // MUTATE: Structural line transition within gate constraints
    this.registerOperator("mutate", (state) => ({
      ...state,
      coordinates: {
        ...state.coordinates,
        line: state.coordinates.line >= 6 ? 1 : state.coordinates.line + 1
      }
    }));

    // ASCEND: Gate-level transition (cyclic through 64)
    this.registerOperator("ascend", (state) => ({
      ...state,
      coordinates: {
        ...state.coordinates,
        gate: state.coordinates.gate >= 64 ? 1 : state.coordinates.gate + 1
      }
    }));

    // DEEPEN: Color-tone shift (cognitive architecture mutation)
    this.registerOperator("deepen", (state) => ({
      ...state,
      coordinates: {
        ...state.coordinates,
        color: state.coordinates.color >= 6 ? 1 : state.coordinates.color + 1,
        tone: state.coordinates.tone >= 6 ? 1 : state.coordinates.tone + 1
      }
    }));
  }

  /** Get all states in the substrate */
  getSubstrate() {
    return this.substrate;
  }

  /** Get state by hash */
  getState(hash) {
    return this.substrate.get(hash);
  }
}
