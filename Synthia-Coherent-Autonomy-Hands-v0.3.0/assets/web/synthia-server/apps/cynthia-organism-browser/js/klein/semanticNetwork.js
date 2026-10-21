// SEMANTIC NETWORK: Deep Structure Extraction
// Extracts implicit semantic networks from discourse

const SEMANTIC_NETWORK = {
  name: 'SemanticNetwork',
  description: 'Deep structure extraction from symbolic content',

  process(signal, gateA, gateB, state) {
    const network = this.extractNetwork(signal, gateA, gateB);

    return {
      type: 'network',
      content: network,
      depth: this.computeDepth(gateA, gateB),
      source: 'SemanticNetwork',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  extractNetwork(signal, gateA, gateB) {
    // Extract semantic relations
    const nodes = this.tokenize(signal.content);
    const edges = this.connect(nodes, gateA, gateB);
    const structure = this.inferStructure(edges);

    return `Semantic network of "${signal.content}": ` +
           `Nodes: ${nodes.join(', ')}. ` +
           `Relations: ${edges.map(e => `${e.from}→${e.to}`).join(', ')}. ` +
           `Structure: ${structure}.`;
  },

  tokenize(content) {
    return content.split(/\s+/).filter(t => t.length > 2);
  },

  connect(nodes, gateA, gateB) {
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i],
        to: nodes[i + 1],
        weight: (gateA.state.tension + gateB.state.tension) / 2
      });
    }
    return edges;
  },

  inferStructure(edges) {
    if (edges.length === 0) return 'isolated';
    if (edges.length === 1) return 'binary';
    if (edges.every(e => e.weight > 0.5)) return 'dense';
    return 'sparse';
  },

  computeDepth(gateA, gateB) {
    return Math.abs(gateA.num - gateB.num) / 64;
  },

  aggregate(signals, centerName) {
    const networks = signals.map(s => s.content).join(' | ');
    return {
      type: 'structure',
      content: `${centerName} networks: ${networks}`,
      source: 'SemanticNetwork'
    };
  }
};

window.KLEIN_TOOLS.semanticNetwork = SEMANTIC_NETWORK;