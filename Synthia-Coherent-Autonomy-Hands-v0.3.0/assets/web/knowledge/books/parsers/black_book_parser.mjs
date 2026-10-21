import { JSONGateParser } from './json_gate_parser.mjs';
import { GateHeadingTextParser } from './gate_heading_text_parser.mjs';

// Source adapter placeholder for Black Book material.
// Default dimension follows the current project mapping: Being.
export class BlackBookParser {
  constructor() {
    this.json = new JSONGateParser({ id: 'black-book-json', sourceType: 'black-book', defaultDimension: 'Being' });
    this.text = new GateHeadingTextParser({ id: 'black-book-text', sourceType: 'black-book', defaultDimension: 'Being' });
  }
  supports(input) { return this.json.supports(input) || this.text.supports(input); }
  parse(input, meta = {}) {
    if (typeof input === 'string') {
      try { return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Being' }); }
      catch { return this.text.parse(input, { ...meta, dimension: meta.dimension || 'Being' }); }
    }
    return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Being' });
  }
}
