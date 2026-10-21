import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const donorPath = path.resolve(here, '../vendor/kimi-sovereign-recovered.bundle.cjs');

function loadFresh() {
  const resolved = require.resolve(donorPath);
  delete require.cache[resolved];
  delete globalThis.SYNTHIA_SOVEREIGN;
  require(resolved);
  const api = globalThis.SYNTHIA_SOVEREIGN;
  if (!api?.engine || !api?.addressing || !api?.operators) {
    throw new Error('Recovered Kimi sovereign bundle did not expose the expected API');
  }
  return api;
}

export class KimiStateSpaceAdapter {
  constructor({ fresh = true } = {}) {
    this.api = fresh ? loadFresh() : (globalThis.SYNTHIA_SOVEREIGN || loadFresh());
  }

  addressForArcSecond(arcSecond) {
    return structuredClone(this.api.addressing.addressForArcSec(Number(arcSecond) || 0));
  }

  arcSecondForAddress(address) {
    return this.api.addressing.arcSecForAddress(address);
  }

  resolve(address) {
    const a = structuredClone(address);
    const bits = this.api.addressing.gateBits(a.gate);
    const arcSecond = this.arcSecondForAddress(a);
    const fuxi = this.api.merged.gateToFuXiDecimal(a.gate);
    const pattern = this.api.merged.encodeIndex(fuxi);
    const patternToGate = (p) => this.api.merged.fuXiDecimalToGate(this.api.merged.decodePattern(p));
    return Object.freeze({
      source: 'kimi-recovered-sovereign-bundle',
      address: a,
      addressKey: this.api.addressing.addrKey(a),
      arcSecond,
      gateBits: [...bits],
      fuXiPattern: pattern,
      sound: structuredClone(this.api.sounds.soundFor(a)),
      color: structuredClone(this.api.colors.colorFor(a)),
      neighbors: this.api.merged.getNeighbors(pattern).map(patternToGate),
      opposite: patternToGate(this.api.merged.getOpposite(pattern)),
      inverse: patternToGate(this.api.merged.getInverse(pattern)),
      meshMetrics: structuredClone(this.api.meshMetrics())
    });
  }

  transformGate(gate, transitionId, { changingLines = [] } = {}) {
    const named = this.api.transitions.NAMED_TRANSITIONS.find((t) => t.id === transitionId);
    if (!named) throw new Error(`Unknown Kimi transition: ${transitionId}`);
    const op = this.api.operators.operatorById(named.operatorId);
    if (!op) throw new Error(`Missing operator ${named.operatorId} for ${transitionId}`);

    const bits = this.api.addressing.gateBits(gate);
    let transformed;
    if (['mirror', 'shadow', 'rotation'].includes(transitionId)) {
      transformed = op.transform(bits);
    } else if (transitionId === 'core') {
      transformed = op.transform(bits);
    } else if (transitionId === 'becoming') {
      transformed = op.transform([bits, changingLines]);
    } else {
      return { changed: false, gate, bits: [...bits], transition: named, operator: named.operatorId };
    }
    const nextBits = Array.isArray(transformed) ? transformed : transformed.bits;
    const nextGate = transformed?.gate || this.api.addressing.gateFromBits(nextBits);
    return {
      changed: true,
      gate: nextGate,
      bits: [...nextBits],
      transition: structuredClone(named),
      operator: named.operatorId
    };
  }

  call(input) {
    return this.api.call(input);
  }

  lastIntake() {
    const history = this.api.engine?.intakeGate?.history || [];
    return history.length ? structuredClone(history[history.length - 1]) : null;
  }

  replay(derivation) {
    return this.api.replay(derivation);
  }

  snapshot() {
    const runtime = this.api.engine.runtime;
    const ownedState = {};
    for (const [id, automaton] of this.api.engine.mesh.automata.entries()) {
      if (typeof automaton.exportState === 'function') ownedState[id] = automaton.exportState();
    }
    return {
      source: 'kimi-recovered-sovereign-bundle',
      derivations: structuredClone(runtime.derivations || []),
      ownedState,
      meshMetrics: structuredClone(this.api.meshMetrics()),
      tools: structuredClone(this.api.listTools())
    };
  }

  restoreByReplay(snapshot = {}) {
    this.api = loadFresh();
    for (const derivation of snapshot.derivations || []) {
      this.api.call(derivation.input);
    }
    return this.snapshot();
  }
}
