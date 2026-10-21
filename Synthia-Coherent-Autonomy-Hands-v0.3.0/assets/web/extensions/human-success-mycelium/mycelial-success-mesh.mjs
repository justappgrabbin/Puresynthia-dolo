const clamp = x => Math.max(0, Math.min(1, x));

// Shares strategy-pattern evidence, never sovereign user state.
export class MycelialSuccessMesh {
  constructor({ shareThreshold = 0.62, minimumEvidence = 2 } = {}) {
    this.shareThreshold = clamp(shareThreshold);
    this.minimumEvidence = Math.max(1, minimumEvidence);
    this.patterns = new Map();
    this.sequence = 0;
  }

  contribute({ patternId, dimensions = [], gate = null, line = null, description = null, outcomeDelta = 0, sourceNode = null } = {}) {
    if (!patternId) throw new TypeError('patternId required');
    const row = this.patterns.get(patternId) || {
      patternId,
      dimensions: new Set(), gate, line, description,
      positive: 0, negative: 0, evidence: 0, sources: new Set(),
    };
    for (const d of dimensions) row.dimensions.add(d);
    if (gate != null) row.gate = gate;
    if (line != null) row.line = line;
    if (description) row.description = description;
    row.evidence += 1;
    if (outcomeDelta >= 0) row.positive += outcomeDelta;
    else row.negative += Math.abs(outcomeDelta);
    if (sourceNode) row.sources.add(sourceNode);
    this.patterns.set(patternId, row);
    return this.get(patternId);
  }

  get(patternId) {
    const row = this.patterns.get(patternId);
    if (!row) return null;
    const score = (1 + row.positive) / (2 + row.positive + row.negative);
    return Object.freeze({
      patternId,
      dimensions: Object.freeze([...row.dimensions]),
      gate: row.gate,
      line: row.line,
      description: row.description,
      score: clamp(score),
      evidence: row.evidence,
      sourceCount: row.sources.size,
      shareable: row.evidence >= this.minimumEvidence && score >= this.shareThreshold,
    });
  }

  candidates({ dimensions = [], gate = null, line = null } = {}) {
    return Object.freeze([...this.patterns.keys()]
      .map(id => this.get(id))
      .filter(p => p.shareable)
      .filter(p => !gate || p.gate == null || p.gate === gate)
      .filter(p => !line || p.line == null || p.line === line)
      .filter(p => !dimensions.length || dimensions.some(d => p.dimensions.includes(d)))
      .sort((a, b) => b.score - a.score || b.evidence - a.evidence));
  }

  exportShareable() {
    // Deliberately excludes source node identities and all person-level data.
    return Object.freeze(this.candidates().map(p => Object.freeze({
      patternId: p.patternId,
      dimensions: p.dimensions,
      gate: p.gate,
      line: p.line,
      description: p.description,
      score: p.score,
      evidence: p.evidence,
    })));
  }
}
