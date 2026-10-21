import canonicalState from '../canonicalState.mjs';

const clone = (value) => {
  try { return structuredClone(value); }
  catch { try { return JSON.parse(JSON.stringify(value)); } catch { return null; } }
};

export const STRUCTURAL_ADDRESS_SPINE = Object.freeze([
  'planetary', 'dimension', 'gate', 'line', 'color', 'tone',
  'degree', 'minute', 'second', 'zodiac', 'house',
]);

export const ADDRESS_LABELS = Object.freeze({
  planetary: 'P', dimension: 'DIM', gate: 'G', line: 'L', color: 'C', tone: 'T',
  degree: 'D', minute: 'M', second: 'S', zodiac: 'ZOD', house: 'H',
});

const PLANET_CODES = Object.freeze({
  Sun: 'SUN', Earth: 'EAR', Moon: 'MOO', NorthNode: 'NNO', SouthNode: 'SNO',
  Mercury: 'MER', Venus: 'VEN', Mars: 'MAR', Jupiter: 'JUP', Saturn: 'SAT',
  Uranus: 'URA', Neptune: 'NEP', Pluto: 'PLU',
});
const DIMENSION_CODES = Object.freeze({ Movement: 'MOV', Evolution: 'EVO', Being: 'BEI', Design: 'DES', Space: 'SPA' });
const ZODIAC_CODES = Object.freeze({
  Aries: 'ARI', Taurus: 'TAU', Gemini: 'GEM', Cancer: 'CAN', Leo: 'LEO', Virgo: 'VIR',
  Libra: 'LIB', Scorpio: 'SCO', Sagittarius: 'SAG', Capricorn: 'CAP', Aquarius: 'AQU', Pisces: 'PIS',
});

function code3(value, table = null) {
  if (value == null || value === '') return null;
  if (table?.[value]) return table[value];
  const compact = String(value).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return compact.slice(0, 3).padEnd(3, '_');
}

export function structuralProjection(address = {}) {
  return Object.freeze({
    planetary: code3(address.planetary, PLANET_CODES),
    dimension: code3(address.dimension, DIMENSION_CODES),
    gate: address.gate ?? null,
    line: address.line ?? null,
    color: address.color ?? null,
    tone: address.tone ?? null,
    degree: address.degree ?? null,
    minute: address.minute ?? null,
    second: address.second ?? null,
    zodiac: code3(address.zodiac, ZODIAC_CODES),
    house: address.house ?? null,
  });
}

export function formatStructuralAddress(address = {}) {
  const a = structuralProjection(address);
  const parts = [];
  if (a.planetary) parts.push(`${ADDRESS_LABELS.planetary}${a.planetary}`);
  if (a.dimension) parts.push(`${ADDRESS_LABELS.dimension}${a.dimension}`);
  for (const field of ['gate','line','color','tone','degree','minute','second']) {
    if (a[field] != null) parts.push(`${ADDRESS_LABELS[field]}${a[field]}`);
  }
  if (a.zodiac) parts.push(`${ADDRESS_LABELS.zodiac}${a.zodiac}`);
  if (a.house != null) parts.push(`${ADDRESS_LABELS.house}${a.house}`);
  return parts.join('');
}

export class AddressContainer {
  constructor({ authority = canonicalState } = {}) {
    this.id = 'canonical-address-container';
    this.address = { dimension: 'Space' };
    this.metadata = { capabilities: ['address.resolve', 'address.current', 'address.format', 'address.schema'] };
    this.authority = authority;
    this.state = { sequence: 0, current: null, history: [] };
  }

  manifest() { return { id: this.id, address: this.address, metadata: this.metadata }; }

  bind(kind, input, overrides = {}) {
    const resolved = this.authority.resolve(typeof input === 'string' ? input : JSON.stringify(input ?? null), overrides || {});
    const record = Object.freeze({
      sequence: ++this.state.sequence,
      kind: String(kind || 'state'),
      address: clone(resolved),
      addressText: this.authority.format(resolved),
      structural: structuralProjection(resolved),
      structuralKey: formatStructuralAddress(resolved),
      at: new Date().toISOString(),
    });
    this.state.current = clone(record);
    this.state.history.push(clone(record));
    if (this.state.history.length > 128) this.state.history.splice(0, this.state.history.length - 128);
    return record;
  }

  addressTask(task = {}) {
    const explicit = task.address || task.meta?.address || null;
    const cue = `${task.capability || 'task'}:${JSON.stringify(task.input ?? null)}`;
    const record = this.bind('task', cue, explicit || {});
    return Object.freeze({
      ...task,
      address: clone(record.address),
      addressText: record.addressText,
      structuralAddress: clone(record.structural),
      structuralAddressKey: record.structuralKey,
    });
  }

  context() { return clone(this.state.current); }
  schema() {
    return Object.freeze({
      version: 'synthia.address-container.v1',
      literalSpine: 'PDIMGLCTDMSZH',
      labels: ADDRESS_LABELS,
      structuralOrder: STRUCTURAL_ADDRESS_SPINE,
      note: 'Public/user structural projection. Deeper canonical coordinates remain available internally.',
    });
  }
  snapshot() { return clone({ ...this.state, schema: this.schema() }); }
  exportState() { return this.snapshot(); }
  hydrate(state) {
    if (!state) return this.snapshot();
    this.state.sequence = Number(state.sequence || 0);
    this.state.current = clone(state.current || null);
    this.state.history = clone(state.history || []).slice(-128);
    return this.snapshot();
  }

  async run(input = {}) {
    switch (input.op) {
      case 'resolve': return this.bind(input.kind || 'resolve', input.input ?? input.value ?? '', input.overrides || {});
      case 'current': return this.context();
      case 'format': return formatStructuralAddress(input.address || this.state.current?.address || {});
      case 'schema': return this.schema();
      default: throw new RangeError(`Unknown address-container operation: ${input.op}`);
    }
  }
}

export default AddressContainer;
