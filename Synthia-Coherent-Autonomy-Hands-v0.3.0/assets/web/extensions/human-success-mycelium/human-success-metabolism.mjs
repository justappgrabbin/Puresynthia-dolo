const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

export const SUCCESS_DIMENSIONS = Object.freeze(['movement', 'evolution', 'being', 'design', 'space']);

export const HUMAN_SUCCESS_CONSTITUTION = Object.freeze({
  id: 'human-success-sovereignty-v1',
  invariant: 'Synthia fitness is evaluated by evidence of sustainable, sovereign, self-defined human success. Failed outcomes adapt Synthia strategies, never the worth of the human.',
  immutable: true,
});

const slope = values => {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n - 1) * n / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, value, i) => sum + i * value, 0);
  const sumX2 = (n - 1) * n * (2 * n - 1) / 6;
  const den = n * sumX2 - sumX * sumX;
  return den === 0 ? 0 : (n * sumXY - sumX * sumY) / den;
};

export class HumanSuccessMetabolism {
  constructor({ target = 0.72, window = 8, vitality = 0.5, weights = {} } = {}) {
    this.target = clamp01(target);
    this.window = Math.max(2, Math.floor(window));
    this.vitality = clamp01(vitality);
    this.weights = Object.freeze(Object.fromEntries(SUCCESS_DIMENSIONS.map(d => [d, Number.isFinite(weights[d]) ? Math.max(0, weights[d]) : 1])));
    this.people = new Map();
    this.strategies = new Map();
    this.events = [];
    this.sequence = 0;
  }

  ensurePerson(personId, { statement = null } = {}) {
    if (!personId) throw new TypeError('personId required');
    if (!this.people.has(personId)) {
      this.people.set(personId, {
        statement,
        dimensions: new Map(SUCCESS_DIMENSIONS.map(d => [d, []])),
      });
      this.#event('person-observed', { personId, statement });
    } else if (statement) {
      this.people.get(personId).statement = statement;
    }
    return this.people.get(personId);
  }

  observe(personId, dimension, value, { source = 'person', context = null, strategyIds = [] } = {}) {
    if (!SUCCESS_DIMENSIONS.includes(dimension)) throw new TypeError(`Unknown success dimension: ${dimension}`);
    if (!Number.isFinite(value)) throw new TypeError('success observation must be numeric');
    const person = this.ensurePerson(personId);
    const row = Object.freeze({ sequence: ++this.sequence, value: clamp01(value), source, context });
    const history = person.dimensions.get(dimension);
    history.push(row);
    if (history.length > this.window * 4) history.splice(0, history.length - this.window * 4);

    const before = this.vitality;
    const fitness = this.fitness(personId);
    // Vitality follows external human-success evidence gradually; it cannot be raised by Synthia's own task completion.
    if (source !== 'synthia') this.vitality = clamp01(before * 0.7 + fitness.score * 0.3);

    const delta = this.vitality - before;
    for (const strategyId of strategyIds) this.recordStrategy(strategyId, { delta, personId, dimension, evidenceSequence: row.sequence });
    this.#event('human-success-observed', { personId, dimension, observation: row, vitalityBefore: before, vitalityAfter: this.vitality, strategyIds: [...strategyIds] });
    return this.state(personId);
  }

  fitness(personId) {
    const person = this.people.get(personId);
    if (!person) return Object.freeze({ personId, score: 0.5, trend: 0, dimensions: Object.freeze({}), evidenceCount: 0 });
    let weighted = 0, totalWeight = 0, trendWeighted = 0, evidenceCount = 0;
    const dimensions = {};
    for (const dimension of SUCCESS_DIMENSIONS) {
      const history = person.dimensions.get(dimension) || [];
      const grounded = history.filter(x => x.source !== 'synthia');
      const values = grounded.slice(-this.window).map(x => x.value);
      const score = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
      const direction = slope(values);
      const weight = this.weights[dimension];
      dimensions[dimension] = Object.freeze({ score, trend: direction, evidenceCount: grounded.length });
      if (score !== null) {
        weighted += score * weight;
        trendWeighted += direction * weight;
        totalWeight += weight;
        evidenceCount += grounded.length;
      }
    }
    return Object.freeze({
      personId,
      score: totalWeight ? clamp01(weighted / totalWeight) : 0.5,
      trend: totalWeight ? trendWeighted / totalWeight : 0,
      dimensions: Object.freeze(dimensions),
      evidenceCount,
    });
  }

  pressure(personId) {
    const fitness = this.fitness(personId);
    const deficit = Math.max(0, this.target - fitness.score);
    const decline = Math.max(0, -fitness.trend);
    return clamp01(deficit / Math.max(this.target, 0.01) * 0.75 + Math.min(1, decline) * 0.25);
  }

  recordStrategy(strategyId, { delta = 0, personId = null, dimension = null, evidenceSequence = null } = {}) {
    if (!strategyId) return null;
    const row = this.strategies.get(strategyId) || { score: 0, evidence: 0, positive: 0, negative: 0, history: [] };
    row.score += delta;
    row.evidence += 1;
    if (delta > 0) row.positive += delta;
    if (delta < 0) row.negative += Math.abs(delta);
    row.history.push(Object.freeze({ delta, personId, dimension, evidenceSequence }));
    this.strategies.set(strategyId, row);
    this.#event('strategy-fitness', { strategyId, delta, personId, dimension, evidenceSequence });
    return this.strategy(strategyId);
  }

  strategy(strategyId) {
    const x = this.strategies.get(strategyId);
    return x ? Object.freeze({ strategyId, score: x.score, evidence: x.evidence, positive: x.positive, negative: x.negative }) : null;
  }

  state(personId) {
    return Object.freeze({
      constitution: HUMAN_SUCCESS_CONSTITUTION,
      vitality: this.vitality,
      target: this.target,
      fitness: this.fitness(personId),
      adaptationPressure: this.pressure(personId),
      strategies: Object.freeze([...this.strategies.keys()].map(id => this.strategy(id))),
    });
  }

  #event(type, payload) { this.events.push(Object.freeze({ sequence: ++this.sequence, type, payload })); }
  replay() { return Object.freeze([...this.events]); }
}
