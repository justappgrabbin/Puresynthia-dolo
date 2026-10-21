import { YIJING_HATCHER_MATRIX } from '../index/yijing_hatcher_matrix.mjs';

// Parser for the bundled Bradford Hatcher Matrix extraction.
// It intentionally emits one source-backed semantic record per gate.
// It does NOT pretend a whole Matrix section is a "word" and does NOT infer
// dependency edges from column layout until a dedicated column parser exists.
export class HatcherMatrixParser {
  constructor({ defaultDimension = 'Movement' } = {}) {
    this.id = 'hatcher-yijing-matrix';
    this.defaultDimension = defaultDimension;
  }

  supports(input) {
    return input == null || Array.isArray(input) || Array.isArray(input?.entries);
  }

  parse(input = null, meta = {}) {
    const src = input == null ? YIJING_HATCHER_MATRIX : (Array.isArray(input) ? { entries: input } : input);
    if (!Array.isArray(src?.entries)) throw new Error('HatcherMatrixParser expects {entries:[...]} or null for bundled Matrix');
    const dimension = meta.dimension || this.defaultDimension;
    const bookId = meta.bookId || src.bookId || 'yijing-hatcher-word-by-word';

    return src.entries.map((entry) => ({
      id: `book:${bookId}:matrix:gate:${entry.gate}`,
      kind: 'section',
      wordLevel: false,
      dimension,
      gate: Number(entry.gate),
      text: String(entry.text || '').trim(),
      dependsOn: [],
      relation: null,
      source: {
        type: 'book-matrix',
        bookId,
        section: src.part || 'Part Five · The Matrix',
        page: entry.pageStart,
        pageStart: entry.pageStart,
        pageEnd: entry.pageEnd,
      },
      attributes: {
        bookId,
        title: entry.title || null,
        part: src.part || null,
        pageStart: entry.pageStart,
        pageEnd: entry.pageEnd,
        extractionStatus: 'source-backed-coarse',
        dependencyStatus: 'not-inferred',
      },
    }));
  }
}
