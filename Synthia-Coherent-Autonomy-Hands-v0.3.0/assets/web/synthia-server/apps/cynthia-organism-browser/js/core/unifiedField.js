// UNIFIED FIELD TENSOR
// One computational field. Five operator projections.
// No separate dimensions. All operators act simultaneously on shared node-field.

class UnifiedField {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.operators = {
      being: new BeingOperator(),
      design: new DesignOperator(),
      movement: new MovementOperator(),
      evolution: new EvolutionOperator(),
      space: new SpaceOperator()
    };
    this.state = {
      timestamp: Date.now(),
      activeNodes: new Set(),
      activeEdges: new Set(),
      fieldPressure: 0,
      resonanceSignature: null
    };
  }

  project(nodeId, context) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    return {
      being: this.operators.being.apply(node, context),
      design: this.operators.design.apply(node, context),
      movement: this.operators.movement.apply(node, context),
      evolution: this.operators.evolution.apply(node, context),
      space: this.operators.space.apply(node, context)
    };
  }

  coherence() {
    const active = Array.from(this.state.activeNodes);
    if (active.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        total += this.nodeResonance(active[i], active[j]);
      }
    }
    return total / (active.length * (active.length - 1) / 2);
  }

  nodeResonance(a, b) {
    const nodeA = this.nodes.get(a);
    const nodeB = this.nodes.get(b);
    if (!nodeA || !nodeB) return 0;
    const trigramOverlap = this.trigramMatch(nodeA, nodeB);
    const circuitAlign = nodeA.circuit === nodeB.circuit ? 1 : 0.5;
    const elementHarmony = this.elementHarmony(nodeA.element, nodeB.element);
    return (trigramOverlap + circuitAlign + elementHarmony) / 3;
  }

  trigramMatch(a, b) {
    const ta = [a.upperTrigram, a.lowerTrigram];
    const tb = [b.upperTrigram, b.lowerTrigram];
    const overlap = ta.filter(t => tb.includes(t)).length;
    return overlap / 4;
  }

  elementHarmony(e1, e2) {
    const harmony = {
      'Wood': { 'Fire': 1, 'Water': 1, 'Earth': 0.5, 'Metal': 0 },
      'Fire': { 'Earth': 1, 'Wood': 1, 'Metal': 0.5, 'Water': 0 },
      'Earth': { 'Metal': 1, 'Fire': 1, 'Water': 0.5, 'Wood': 0 },
      'Metal': { 'Water': 1, 'Earth': 1, 'Wood': 0.5, 'Fire': 0 },
      'Water': { 'Wood': 1, 'Metal': 1, 'Fire': 0.5, 'Earth': 0 }
    };
    return harmony[e1]?.[e2] || 0.5;
  }
}

class BeingOperator {
  apply(node, context) {
    return {
      exists: node !== null,
      persistence: node.state?.recursionDepth || 0,
      matterState: node.element || 'unknown',
      incarnation: context?.time || Date.now()
    };
  }
}

class DesignOperator {
  apply(node, context) {
    return {
      topology: [node.upperTrigram, node.lowerTrigram],
      architecture: node.circuit || 'unknown',
      continuity: node.state?.activationHistory?.length || 0,
      organization: node.state?.binary?.join('') || '000000'
    };
  }
}

class MovementOperator {
  apply(node, context) {
    return {
      propagation: context?.signal || 0,
      orientation: context?.direction || 'neutral',
      dynamics: node.state?.tension || 0,
      routing: context?.source || 'unknown'
    };
  }
}

class EvolutionOperator {
  apply(node, context) {
    return {
      memoryGravity: node.state?.memoryGravity || 0,
      recurrence: node.state?.recursionDepth || 0,
      curvature: node.state?.attractorWeight || 0,
      integration: context?.history?.length || 0
    };
  }
}

class SpaceOperator {
  apply(node, context) {
    return {
      framing: context?.observer || 'default',
      awareness: node.state?.consciousness || 0.5,
      manifold: context?.dimension || 3,
      projection: node.state?.space || 'local'
    };
  }
}

window.UnifiedField = UnifiedField;