import { JSONGateParser } from './json_gate_parser.mjs';
import { GateHeadingTextParser } from './gate_heading_text_parser.mjs';

// Source adapter placeholder for your Yijing material.
// Default dimension is Movement (knowledge). Replace/extend only when the actual
// Yijing file shape is in hand; no invented field mapping lives here.
export class YijingParser {
  constructor() {
    this.json = new JSONGateParser({ id: 'yijing-json', sourceType: 'yijing', defaultDimension: 'Movement' });
    this.text = new GateHeadingTextParser({ id: 'yijing-text', sourceType: 'yijing', defaultDimension: 'Movement' });
  }
  supports(input) { return this.json.supports(input) || this.text.supports(input); }
  parse(input, meta = {}) {
    if (typeof input === 'string') {
      try { return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Movement' }); }
      catch { return this.text.parse(input, { ...meta, dimension: meta.dimension || 'Movement' }); }
    }
    return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Movement' });
  }
}
