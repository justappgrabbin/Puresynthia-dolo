export class BookIngestor {
  constructor(mesh) {
    this.mesh = mesh;
    this.parsers = new Map();
    this.enrichers = [];
    this.postIngestHooks = [];
  }

  useEnricher(fn) {
    if (typeof fn !== 'function') throw new Error('Enricher must be a function');
    this.enrichers.push(fn);
    return this;
  }

  onIngest(fn) {
    if (typeof fn !== 'function') throw new Error('Post-ingest hook must be a function');
    this.postIngestHooks.push(fn);
    return this;
  }

  register(name, parser) {
    if (!parser || typeof parser.parse !== 'function') throw new Error('Parser must expose parse(input, meta)');
    this.parsers.set(name, parser);
    return this;
  }

  parse(name, input, meta = {}) {
    const parser = this.parsers.get(name);
    if (!parser) throw new Error(`Unknown parser: ${name}. Known: ${[...this.parsers.keys()].join(', ')}`);
    return parser.parse(input, meta);
  }

  ingest(name, input, meta = {}) {
    const records = this.parse(name, input, meta);
    const added = [];
    const pending = records.map((record) => ({ ...record }));
    const byRequestedId = new Set(records.map((r) => r.id));
    const inserted = new Set([...this.mesh.nodes.keys()]);

    // Multiple passes enforce dependency-before-dependent without silently
    // fabricating or dropping dependencies.
    let progressed = true;
    while (pending.length && progressed) {
      progressed = false;
      for (let i = pending.length - 1; i >= 0; i--) {
        const record = pending[i];
        const deps = record.dependsOn || [];
        if (!deps.every((id) => inserted.has(id))) continue;

        const node = this.mesh.addKnowledge({
          id: record.id,
          dimension: record.dimension,
          gate: record.gate,
          text: record.text,
          source: { ...record.source, bookId: meta.bookId || record.attributes?.bookId || null },
          attributes: record.attributes,
          provenance: [{ bookId: meta.bookId || record.attributes?.bookId || null, parser: name, section: record.source?.section ?? null, page: record.source?.page ?? null }],
        }, { createProxyEdges: meta.createProxyEdges !== false });
        inserted.add(node.id);
        if (meta.enrich !== false) {
          for (const enrich of this.enrichers) enrich(node, record, { parser: name, meta });
        }
        added.push(node);
        pending.splice(i, 1);
        progressed = true;

        for (const depId of deps) {
          this.mesh.addDependency(node.id, depId, {
            relation: record.relation || 'depends-on',
            evidence: [{ parser: name, bookId: meta.bookId || null }],
          });
        }

        // Populate the existing per-dimension word registry as a parallel,
        // strict dependency representation. Only same-dimension dependencies
        // can live there; cross-dimension dependencies remain mesh edges.
        // Only genuine word-level parser records enter the strict per-dimension
        // word registry. Coarse pages/sections remain mesh knowledge and must not
        // masquerade as individual words.
        if (record.wordLevel === true || record.kind === 'word') {
          const layer = this.mesh.stateSpace.dimensions[record.dimension];
          const sameDimensionDeps = deps.filter((depId) => {
            const dep = this.mesh.node(depId);
            return dep?.dimension === record.dimension;
          });
          layer.addWord(record.gate, {
            id: record.id,
            text: record.text,
            dependsOn: sameDimensionDeps,
            relation: record.relation || null,
          });
        }
      }
    }

    const unresolved = pending.map((record) => ({
      id: record.id,
      missing: (record.dependsOn || []).filter((id) => !inserted.has(id) && !byRequestedId.has(id)),
      blockedBy: (record.dependsOn || []).filter((id) => !inserted.has(id) && byRequestedId.has(id)),
    }));

    const result = { parsed: records.length, added, unresolved };
    for (const hook of this.postIngestHooks) hook(result, { parser: name, meta });
    return result;
  }
}
