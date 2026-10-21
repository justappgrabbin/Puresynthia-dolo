import { BookParser } from './base_parser.mjs';

// Conservative JSON parser. It only ingests records with an explicit gate and text.
// Accepted shapes:
//   [ { gate: 1, text: '...', id?, dimension?, dependsOn?, relation? }, ... ]
//   { gates: [ ...same records... ] }
export class JSONGateParser extends BookParser {
  constructor(options = {}) {
    super({ id: options.id || 'json-gate', sourceType: options.sourceType || 'json', defaultDimension: options.defaultDimension || null });
  }

  supports(input) {
    return typeof input === 'string' || Array.isArray(input) || (input && typeof input === 'object');
  }

  parse(input, meta = {}) {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    const rows = Array.isArray(data) ? data : data?.gates;
    if (!Array.isArray(rows)) throw new Error('JSONGateParser expected an array or {gates:[...]}');

    const records = [];
    rows.forEach((row, index) => {
      if (!Number.isInteger(Number(row.gate)) || !String(row.text ?? row.content ?? '').trim()) return;
      records.push(this.record({
        id: row.id || `${meta.bookId || this.id}:g${Number(row.gate)}:${index}`,
        gate: Number(row.gate),
        text: String(row.text ?? row.content).trim(),
        dimension: row.dimension || meta.dimension || this.defaultDimension,
        section: row.section ?? meta.section ?? null,
        page: row.page ?? null,
        dependsOn: row.dependsOn || [],
        relation: row.relation || null,
        attributes: { ...row.attributes, bookId: meta.bookId || null },
      }));
    });
    return records;
  }
}
