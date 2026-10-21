/**
 * Edge Function Engine
 * ====================
 *
 * Computation lives on connections, not nodes.
 *
 * The pattern is:
 *   source state → edge function → target state
 *
 * Every edge has:
 * - transform: function that maps source to target
 * - conditions: when this edge can fire
 * - energy: cost to traverse
 * - probability: likelihood of firing
 * - history: past traversals
 * - type: what kind of relationship (channel, gate, line, etc.)
 */

const ATO = require('./layer1_ato_core.js');

class EdgeFunction {
  /**
   * An edge function transforms one state into another.
   */
  constructor(config) {
    this.id = config.id || `edge_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.type = config.type || 'connection';  // channel, gate, line, color, etc.
    this.source = config.source;              // source state ID
    this.target = config.target;            // target state ID

    // The transform function: (sourceState, context) => targetState
    this.transform = config.transform || ((s, ctx) => s);

    // Conditions: when can this edge fire?
    this.conditions = config.conditions || [];

    // Energy cost to traverse
    this.energyCost = config.energyCost || 0.1;

    // Probability of firing (0-1)
    this.probability = config.probability || 1.0;

    // History of traversals
    this.traversals = [];

    // Metadata
    this.created = Date.now();
    this.metadata = config.metadata || {};
  }

  /**
   * Can this edge fire from the given state?
   */
  canFire(sourceState, context) {
    // Check energy
    if (sourceState.energy && sourceState.energy.level < this.energyCost) {
      return false;
    }

    // Check conditions
    for (const condition of this.conditions) {
      if (!condition(sourceState, context)) {
        return false;
      }
    }

    // Check probability
    if (Math.random() > this.probability) {
      return false;
    }

    return true;
  }

  /**
   * Fire the edge: transform source to target.
   */
  fire(sourceState, context) {
    // Deduct energy
    if (sourceState.energy) {
      sourceState.energy.level -= this.energyCost;
    }

    // Apply transform
    const targetState = this.transform(sourceState, context);

    // Record traversal
    this.traversals.push({
      time: Date.now(),
      sourceEnergy: sourceState.energy?.level,
      context: context
    });

    return targetState;
  }

  /**
   * Get traversal statistics.
   */
  getStats() {
    return {
      id: this.id,
      type: this.type,
      traversals: this.traversals.length,
      avgEnergy: this.traversals.length > 0
        ? this.traversals.reduce((s, t) => s + (t.sourceEnergy || 0), 0) / this.traversals.length
        : 0,
      lastTraversal: this.traversals.length > 0
        ? this.traversals[this.traversals.length - 1].time
        : null
    };
  }
}

class EdgeFunctionEngine {
  constructor() {
    this.edges = new Map();     // edgeId -> EdgeFunction
    this.edgesByType = new Map(); // type -> EdgeFunction[]
    this.edgesBySource = new Map(); // sourceId -> EdgeFunction[]
    this.edgesByTarget = new Map(); // targetId -> EdgeFunction[]
    this.history = [];
  }

  /**
   * Register an edge function.
   */
  registerEdge(edge) {
    this.edges.set(edge.id, edge);

    // Index by type
    if (!this.edgesByType.has(edge.type)) {
      this.edgesByType.set(edge.type, []);
    }
    this.edgesByType.get(edge.type).push(edge);

    // Index by source
    if (!this.edgesBySource.has(edge.source)) {
      this.edgesBySource.set(edge.source, []);
    }
    this.edgesBySource.get(edge.source).push(edge);

    // Index by target
    if (!this.edgesByTarget.has(edge.target)) {
      this.edgesByTarget.set(edge.target, []);
    }
    this.edgesByTarget.get(edge.target).push(edge);
  }

  /**
   * Find edges that can fire from a given state.
   */
  findFireableEdges(sourceState, context = {}) {
    const sourceId = sourceState.identity?.id;
    const candidates = this.edgesBySource.get(sourceId) || [];

    return candidates.filter(edge => edge.canFire(sourceState, context));
  }

  /**
   * Fire the best edge from a state.
   */
  fireBestEdge(sourceState, context = {}) {
    const fireable = this.findFireableEdges(sourceState, context);

    if (fireable.length === 0) return null;

    // Select edge with highest probability that has energy
    const best = fireable.reduce((best, edge) => {
      if (edge.probability > best.probability) return edge;
      return best;
    }, fireable[0]);

    const result = best.fire(sourceState, context);

    this.history.push({
      time: Date.now(),
      edge: best.id,
      source: sourceState.identity?.id,
      target: result.identity?.id
    });

    return { edge: best, result };
  }

  /**
   * Create a channel edge (Human Design channel).
   */
  createChannelEdge(gateA, gateB, config = {}) {
    const edge = new EdgeFunction({
      id: `channel_${gateA}_${gateB}`,
      type: 'channel',
      source: `gate_${gateA}`,
      target: `gate_${gateB}`,
      transform: (sourceState, ctx) => {
        // Channel transformation: combine energies
        const result = { ...sourceState };
        if (result.energy) {
          result.energy.level = Math.min(1, result.energy.level + 0.1);
        }
        return result;
      },
      conditions: [
        (s, ctx) => s.energy && s.energy.level > 0.2
      ],
      energyCost: 0.05,
      probability: 0.8,
      metadata: { gateA, gateB, ...config }
    });

    this.registerEdge(edge);
    return edge;
  }

  /**
   * Create a gate edge (Human Design gate).
   */
  createGateEdge(gateNumber, config = {}) {
    const edge = new EdgeFunction({
      id: `gate_${gateNumber}`,
      type: 'gate',
      source: `center_${config.center || 'unknown'}`,
      target: `state_${gateNumber}`,
      transform: (sourceState, ctx) => {
        // Gate transformation: activate specific energy
        const result = { ...sourceState };
        if (result.coordinates) {
          result.coordinates.gate = gateNumber % 64;
        }
        if (result.energy) {
          result.energy.level = Math.min(1, result.energy.level + 0.2);
        }
        return result;
      },
      conditions: [
        (s, ctx) => s.coordinates && s.coordinates.center === config.center
      ],
      energyCost: 0.1,
      probability: 0.9,
      metadata: { gateNumber, ...config }
    });

    this.registerEdge(edge);
    return edge;
  }

  /**
   * Create a line edge (I Ching line transformation).
   */
  createLineEdge(lineNumber, config = {}) {
    const edge = new EdgeFunction({
      id: `line_${lineNumber}`,
      type: 'line',
      source: `hexagram_${config.hexagram || 1}`,
      target: `state_line_${lineNumber}`,
      transform: (sourceState, ctx) => {
        // Line transformation: flip one bit
        const result = { ...sourceState };
        if (result.geometry && result.geometry.vector) {
          const vec = [...result.geometry.vector];
          const bitIndex = lineNumber % vec.length;
          vec[bitIndex] = vec[bitIndex] === 1 ? 0 : 1;
          result.geometry.vector = vec;
        }
        return result;
      },
      conditions: [
        (s, ctx) => s.geometry && s.geometry.vector && s.geometry.vector.length > lineNumber
      ],
      energyCost: 0.15,
      probability: 0.7,
      metadata: { lineNumber, ...config }
    });

    this.registerEdge(edge);
    return edge;
  }

  /**
   * Get all edges of a specific type.
   */
  getEdgesByType(type) {
    return this.edgesByType.get(type) || [];
  }

  /**
   * Get stats for all edges.
   */
  getStats() {
    const stats = {};
    for (const [type, edges] of this.edgesByType) {
      stats[type] = {
        count: edges.length,
        totalTraversals: edges.reduce((s, e) => s + e.traversals.length, 0),
        avgProbability: edges.reduce((s, e) => s + e.probability, 0) / edges.length
      };
    }
    return stats;
  }
}

const EdgeFunctionModule = { EdgeFunction, EdgeFunctionEngine };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EdgeFunctionModule;
}

if (typeof window !== 'undefined') {
  window.EdgeFunction = EdgeFunctionModule;
}
