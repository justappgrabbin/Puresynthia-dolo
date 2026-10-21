import { KimiStateSpaceAdapter } from './kimi-adapter.mjs';
import { EmergentStateSpaceAdapter } from './emergent-adapter.mjs';

export const CANONICAL_ADDRESS_FIELDS = Object.freeze([
  'planet', 'dimension', 'gate', 'line', 'color', 'tone', 'base',
  'degree', 'minute', 'second', 'arc', 'axis', 'zodiac', 'house'
]);

const clampInt = (value, min, max, fallback = min) => {
  const n = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
  return Math.max(min, Math.min(max, n));
};

function normalizeAddress(input = {}) {
  const address = {
    planet: input.planet ?? null,
    dimension: input.dimension ?? null,
    gate: clampInt(input.gate, 1, 64, 1),
    line: clampInt(input.line, 1, 6, 1),
    color: clampInt(input.color, 1, 6, 1),
    tone: clampInt(input.tone, 1, 6, 1),
    base: clampInt(input.base, 1, 5, 1),
    degree: clampInt(input.degree ?? input.degrees, 0, 359, 0),
    minute: clampInt(input.minute ?? input.minutes, 0, 59, 0),
    second: Number(input.second ?? input.seconds ?? 0),
    arc: input.arc ?? input.arcSecond ?? input.arcSeconds ?? null,
    axis: input.axis ?? null,
    zodiac: input.zodiac ?? null,
    house: input.house ?? null
  };
  if (!Number.isFinite(address.second)) address.second = 0;
  address.second = Math.max(0, Math.min(59.999999, address.second));
  return Object.freeze(address);
}

function addressIdentity(a) {
  return CANONICAL_ADDRESS_FIELDS.map((k) => `${k}=${a[k] ?? '*'}`).join('|');
}

export class UnifiedSynthiaStateSpace {
  constructor({ provenance = {} } = {}) {
    this.kimi = new KimiStateSpaceAdapter();
    this.emergent = new EmergentStateSpaceAdapter();
    this.journal = [];
    this.sequence = 0;
    this.provenance = Object.freeze({
      mergePolicy: 'retain-all-perspectives',
      semanticWinnerAtSubstrate: false,
      llmDependency: false,
      ...provenance
    });
  }

  normalizeAddress(input) {
    if (typeof input === 'number') return normalizeAddress(this.kimi.addressForArcSecond(input));
    const base = normalizeAddress(input || {});
    // Kimi resolves its own zodiac/house when not supplied; preserve explicit values when present.
    const kimi = this.kimi.addressForArcSecond(this.kimi.arcSecondForAddress(base));
    return normalizeAddress({ ...kimi, ...Object.fromEntries(Object.entries(base).filter(([,v]) => v !== null)) });
  }

  resolve(input, context = {}) {
    const address = this.normalizeAddress(input);
    const kimi = this.kimi.resolve(address);
    const emergent = this.emergent.resolve(address, context);
    return Object.freeze({
      id: addressIdentity(address),
      address,
      views: Object.freeze({ kimi, emergent }),
      projections: Object.freeze({
        kimi: Object.freeze(['knowledge', 'causal', 'phase', 'temporal', 'dependency']),
        emergent: Object.freeze(['space', 'design', 'causal', 'knowledge', 'dependency'])
      }),
      policy: this.provenance
    });
  }

  project(input, perspective, context = {}) {
    const resolved = this.resolve(input, context);
    if (perspective === 'kimi') return resolved.views.kimi;
    if (perspective === 'emergent') return resolved.views.emergent;
    if (perspective.startsWith('emergent:')) {
      const name = perspective.split(':')[1];
      const view = resolved.views.emergent.views[name];
      if (!view) throw new Error(`Unknown Emergent perspective: ${name}`);
      return view;
    }
    if (perspective.startsWith('kimi:')) {
      const name = perspective.split(':')[1];
      if (!resolved.views.kimi.meshMetrics.projections[name]) throw new Error(`Unknown Kimi projection: ${name}`);
      return { name, metrics: resolved.views.kimi.meshMetrics.projections[name], state: resolved.views.kimi };
    }
    throw new Error(`Unknown perspective: ${perspective}`);
  }

  transition(event = {}) {
    const before = this.normalizeAddress(event.address || event.state || {});
    const transition = event.transition || event.id;
    if (!transition) throw new Error('transition() requires event.transition');

    const gateResult = this.kimi.transformGate(before.gate, transition, { changingLines: event.changingLines || [] });
    const after = gateResult.changed ? this.normalizeAddress({ ...before, gate: gateResult.gate }) : before;

    let emergentVector = null;
    if (event.emergentRule) {
      emergentVector = this.emergent.transitionVector(event.emergentRule, event.vector || this.emergent.vector, ...(event.args || []));
    }

    const record = Object.freeze({
      sequence: ++this.sequence,
      type: 'transition',
      transition,
      operator: gateResult.operator,
      before,
      after,
      changed: gateResult.changed,
      changingLines: Object.freeze([...(event.changingLines || [])]),
      emergentVector,
      context: structuredClone(event.context || {}),
      provenance: Object.freeze({ kimi: true, emergent: Boolean(event.emergentRule) })
    });
    this.journal.push(record);
    return Object.freeze({ record, resolved: this.resolve(after, event.context || {}) });
  }

  observe(input, context = {}) {
    const address = this.normalizeAddress(input);
    const emergentObservation = this.emergent.observe(address, context);
    const record = Object.freeze({
      sequence: ++this.sequence,
      type: 'observation',
      address,
      context: structuredClone(context),
      emergentTrace: structuredClone(emergentObservation)
    });
    this.journal.push(record);
    return record;
  }

  executeKimi(input) {
    const derivation = this.kimi.call(input);
    const record = Object.freeze({
      sequence: ++this.sequence,
      type: 'kimi-execution',
      derivationId: derivation.id,
      hash: derivation.hash,
      input
    });
    this.journal.push(record);
    return derivation;
  }

  replayKimi(derivation) {
    return this.kimi.replay(derivation);
  }

  getLastKimiIntake() {
    return this.kimi.lastIntake();
  }

  getHistory() {
    return structuredClone(this.journal);
  }

  getRelationships(input) {
    const r = this.resolve(input);
    return {
      kimi: {
        neighbors: r.views.kimi.neighbors,
        opposite: r.views.kimi.opposite,
        inverse: r.views.kimi.inverse
      },
      emergent: {
        causal: r.views.emergent.views.causal.interpretation,
        dependency: r.views.emergent.views.dependency.interpretation,
        space: r.views.emergent.views.space.interpretation,
        design: r.views.emergent.views.design.interpretation,
        knowledge: r.views.emergent.views.knowledge.interpretation
      }
    };
  }

  exportState() {
    return {
      manifest: 'synthia.unified-statespace.v1',
      provenance: this.provenance,
      sequence: this.sequence,
      journal: structuredClone(this.journal),
      kimi: this.kimi.snapshot(),
      emergent: this.emergent.snapshot()
    };
  }

  hydrate(snapshot = {}) {
    if (snapshot.manifest !== 'synthia.unified-statespace.v1') throw new Error('Unsupported StateSpace snapshot');
    this.sequence = Number(snapshot.sequence) || 0;
    this.journal = structuredClone(snapshot.journal || []);
    this.emergent.restore(snapshot.emergent || {});
    this.kimi.restoreByReplay(snapshot.kimi || {});
    return this.exportState();
  }

  validate() {
    const errors = [];
    const sample = this.resolve({ gate: 25, line: 4, color: 6, tone: 5, base: 2 });
    if (sample.address.gate !== 25) errors.push('canonical address lost gate');
    if (!sample.views.kimi.gateBits?.length) errors.push('Kimi gate bits missing');
    if (!sample.views.emergent.views?.space) errors.push('Emergent space view missing');
    const before = this.resolve({ gate: 24 });
    const t = this.transition({ address: before.address, transition: 'mirror' });
    const back = this.transition({ address: t.resolved.address, transition: 'mirror' });
    if (back.resolved.address.gate !== 24) errors.push('Kimi mirror involution failed');
    return { ok: errors.length === 0, errors, policies: this.provenance };
  }
}

export function createUnifiedStateSpace(options = {}) {
  return new UnifiedSynthiaStateSpace(options);
}
