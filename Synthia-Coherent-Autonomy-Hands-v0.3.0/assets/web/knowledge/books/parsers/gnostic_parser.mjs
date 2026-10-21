import { JSONGateParser } from './json_gate_parser.mjs';
import { GateHeadingTextParser } from './gate_heading_text_parser.mjs';

// Source adapter placeholder for your Gnostic I Ching material.
// Default dimension follows the current project mapping: Design.
export class GnosticParser {
  constructor() {
    this.json = new JSONGateParser({ id: 'gnostic-json', sourceType: 'gnostic', defaultDimension: 'Design' });
    this.text = new GateHeadingTextParser({ id: 'gnostic-text', sourceType: 'gnostic', defaultDimension: 'Design' });
  }
  supports(input) { return this.json.supports(input) || this.text.supports(input); }
  parse(input, meta = {}) {
    if (typeof input === 'string') {
      try { return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Design' }); }
      catch { return this.text.parse(input, { ...meta, dimension: meta.dimension || 'Design' }); }
    }
    return this.json.parse(input, { ...meta, dimension: meta.dimension || 'Design' });
  }
}
