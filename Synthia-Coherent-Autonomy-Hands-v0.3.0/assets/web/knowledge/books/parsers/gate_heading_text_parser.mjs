import { BookParser } from './base_parser.mjs';

// Minimal plain-text parser for source material that visibly marks sections like:
//   Gate 14
//   Hexagram 14
// It does NOT infer gates from prose.
export class GateHeadingTextParser extends BookParser {
  constructor(options = {}) {
    super({ id: options.id || 'gate-heading-text', sourceType: options.sourceType || 'text', defaultDimension: options.defaultDimension || null });
  }

  supports(input) {
    return typeof input === 'string' && /(?:gate|hexagram)\s+\d{1,2}/i.test(input);
  }

  parse(input, meta = {}) {
    const heading = /(?:^|\n)\s*(?:gate|hexagram)\s+(\d{1,2})\b[^\n]*\n?/gi;
    const matches = [...input.matchAll(heading)];
    const out = [];
    for (let i = 0; i < matches.length; i++) {
      const gate = Number(matches[i][1]);
      if (gate < 1 || gate > 64) continue;
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : input.length;
      const text = input.slice(start, end).trim();
      if (!text) continue;
      out.push(this.record({
        id: `${meta.bookId || this.id}:g${gate}:${i}`,
        gate,
        text,
        dimension: meta.dimension || this.defaultDimension,
        section: matches[i][0].trim(),
        attributes: { bookId: meta.bookId || null, rawSectionIndex: i },
      }));
    }
    return out;
  }
}
