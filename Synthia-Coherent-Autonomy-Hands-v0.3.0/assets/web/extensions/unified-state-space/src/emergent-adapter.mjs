import { createRequire } from 'node:module';
import { StateTransitionEngine } from '../vendor/emergent-state-transitions.mjs';

const require = createRequire(import.meta.url);
const { StateSpace } = require('../vendor/emergent-state-space.cjs');

const meshNames = Object.freeze(['space', 'design', 'causal', 'knowledge', 'dependency']);

export class EmergentStateSpaceAdapter {
  constructor() {
    this.space = new StateSpace();
    this.vector = { movement: 0.5, evolution: 0.5, being: 0.5, design: 0.5, space: 0.5 };
    const geometry = {
      interpolate: (a, b, t) => {
        const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
        const out = {};
        for (const k of keys) {
          const av = a?.[k], bv = b?.[k];
          out[k] = (typeof av === 'number' && typeof bv === 'number') ? av + (bv - av) * t : (t < 1 ? av : bv);
        }
        return out;
      }
    };
    this.transitions = new StateTransitionEngine(geometry);
    this.rules = this.transitions.buildTransitionRules();
  }

  resolve(address, context = {}) {
    const state = this.space.createState({
      gate: address.gate,
      line: address.line,
      color: address.color,
      tone: address.tone,
      base: address.base,
      degrees: address.degree ?? address.degrees ?? 0,
      minutes: address.minute ?? address.minutes ?? 0,
      seconds: address.second ?? address.seconds ?? 0,
      zodiac: address.zodiac || undefined,
      house: address.house || undefined,
      mesh: context.mesh || 'space',
      chart: context.chart || 'personality',
      intensity: context.intensity ?? 0,
      timestamp: context.timestamp || Date.now()
    });
    const views = {};
    for (const name of meshNames) views[name] = this.space.routeThroughMesh(state, name);
    return Object.freeze({
      source: 'emergent-state-space-recovered-source',
      state,
      views,
      field: this.space.evaluateField(state.angle),
      nearestBasin: this.space.nearestBasin(state.angle)
    });
  }

  observe(address, context = {}) {
    const resolved = this.resolve(address, context);
    const trace = this.space.addTrace(resolved.state, context);
    return { trace, traceCount: this.space.traces.length };
  }

  transitionVector(ruleId, current = this.vector, ...args) {
    const rule = this.rules[ruleId];
    if (!rule) throw new Error(`Unknown Emergent transition rule: ${ruleId}`);
    const result = rule(current, ...args);
    this.vector = structuredClone(result.targetState);
    return { ...structuredClone(result), ruleId };
  }

  snapshot() {
    return {
      source: 'emergent-state-space-recovered-source',
      stateSpace: this.space.serialize(),
      vector: structuredClone(this.vector)
    };
  }

  restore(snapshot = {}) {
    if (snapshot.stateSpace) this.space.deserialize(snapshot.stateSpace);
    if (snapshot.vector) this.vector = structuredClone(snapshot.vector);
    return this.snapshot();
  }
}
