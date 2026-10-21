const int = (value, min, max, name) => {
  if (!Number.isInteger(value) || value < min || value > max) throw new TypeError(`${name} must be ${min}..${max}`);
  return value;
};

export const PROCESS_HORIZON_HYPOTHESES = Object.freeze({
  gatePowerLine: Object.freeze({
    id: 'gate^line',
    status: 'experimental',
    description: 'Candidate maximum process horizon before an activated Gate/Line is expected to express a qualitative shift.',
    calculate: (gate, line) => gate ** line,
  }),
});

export class GateLineProcessField {
  constructor({ hypothesis = 'gatePowerLine' } = {}) {
    if (!PROCESS_HORIZON_HYPOTHESES[hypothesis]) throw new TypeError(`Unknown horizon hypothesis: ${hypothesis}`);
    this.hypothesis = hypothesis;
    this.fields = new Map();
    this.sequence = 0;
  }

  activate(entityId, address, { trigger = null, context = null } = {}) {
    if (!entityId) throw new TypeError('entityId required');
    const gate = int(address?.gate, 1, 64, 'gate');
    const line = int(address?.line, 1, 6, 'line');
    const id = `${entityId}:g${gate}.l${line}:${++this.sequence}`;
    const hypothesis = PROCESS_HORIZON_HYPOTHESES[this.hypothesis];
    const field = {
      id, entityId, gate, line,
      qualities: Object.freeze({
        color: address?.color ?? null,
        tone: address?.tone ?? null,
        base: address?.base ?? null,
        degree: address?.degree ?? null,
        minute: address?.minute ?? null,
        second: address?.second ?? null,
        dimension: address?.dimension ?? null,
        planetary: address?.planetary ?? null,
      }),
      trigger,
      context,
      processEvents: 0,
      horizon: hypothesis.calculate(gate, line),
      horizonHypothesis: hypothesis.id,
      hypothesisStatus: hypothesis.status,
      status: 'active',
      events: [],
    };
    this.fields.set(id, field);
    return this.snapshot(id);
  }

  process(fieldId, { amount = 1, kind = 'state-transformation', quality = null, evidence = null } = {}) {
    const field = this.fields.get(fieldId);
    if (!field) throw new TypeError(`Unknown process field: ${fieldId}`);
    if (!Number.isFinite(amount) || amount <= 0) throw new TypeError('amount must be positive');
    field.processEvents += amount;
    const pressure = Math.min(1, field.processEvents / Math.max(1, field.horizon));
    field.events.push(Object.freeze({ sequence: ++this.sequence, amount, kind, quality, evidence, processEvents: field.processEvents, transitionPressure: pressure }));
    if (field.processEvents >= field.horizon) field.status = 'threshold-reached';
    return this.snapshot(fieldId);
  }

  close(fieldId, reason = 'resolved') {
    const field = this.fields.get(fieldId);
    if (!field) return null;
    field.status = reason;
    return this.snapshot(fieldId);
  }

  snapshot(fieldId) {
    const field = this.fields.get(fieldId);
    if (!field) return null;
    return Object.freeze({
      id: field.id,
      entityId: field.entityId,
      gate: field.gate,
      line: field.line,
      qualities: field.qualities,
      trigger: field.trigger,
      processEvents: field.processEvents,
      horizon: field.horizon,
      horizonHypothesis: field.horizonHypothesis,
      hypothesisStatus: field.hypothesisStatus,
      transitionPressure: Math.min(1, field.processEvents / Math.max(1, field.horizon)),
      status: field.status,
      events: Object.freeze([...field.events]),
    });
  }

  all() { return Object.freeze([...this.fields.keys()].map(id => this.snapshot(id))); }
}
