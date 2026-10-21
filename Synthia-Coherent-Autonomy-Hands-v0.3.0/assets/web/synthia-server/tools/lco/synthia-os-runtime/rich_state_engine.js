/**
 * Rich State Engine
 * =================
 *
 * The state is NOT just a vector.
 *
 * State = {
 *   identity:   who this state is
 *   geometry:   where it lives in the hypercube
 *   semantics:  what it means (triples, relations)
 *   energy:     how active it is (0-1)
 *   memory:     past traces, history
 *   coordinates: 13-layer address (Planet, Gate, Line, Color, Tone, Base,
 *                Degree, Minute, Second, Arc, Zodiac, House, Season)
 *   edges:      connections to other states
 *   affordances: what actions are possible from here
 *   potential:  what this state could become
 *   constraints: what limits this state
 * }
 *
 * The vector is just ONE component of the state.
 */

const ATO = require('./layer1_ato_core.js');

class RichState {
  constructor(initial = {}) {
    // Identity: who this state is
    this.identity = initial.identity || {
      id: `state_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name: 'unnamed',
      type: 'emergent',
      version: 1
    };

    // Geometry: position in hypercube
    this.geometry = initial.geometry || {
      vector: initial.vector || [0, 0, 0, 0, 0, 0],
      position: { x: 0, y: 0, z: 0 },
      orientation: { theta: 0, phi: 0 },
      velocity: { dx: 0, dy: 0, dz: 0 }
    };

    // Semantics: meaning through triples
    this.semantics = initial.semantics || {
      triples: [],        // (subject, predicate, object)
      relations: [],      // connections to other states
      archetype: null,    // I Ching hexagram mapping
      narrative: null     // story context
    };

    // Energy: activation level
    this.energy = initial.energy || {
      level: 0.5,         // 0-1
      potential: 0.5,     // available energy
      dissipation: 0.01,  // rate of energy loss
      source: 'internal'   // where energy comes from
    };

    // Memory: past traces
    this.memory = initial.memory || {
      traces: [],         // previous states
      depth: 10,          // how many traces to keep
      decay: 0.9          // memory decay rate
    };

    // Coordinates: 13-layer address
    this.coordinates = initial.coordinates || this._defaultCoordinates();

    // Edges: connections to other states
    this.edges = initial.edges || {
      active: [],         // currently active connections
      potential: [],      // possible connections
      history: []         // past connections
    };

    // Affordances: what actions are possible
    this.affordances = initial.affordances || {
      available: [],       // currently possible actions
      conditional: [],   // possible under certain conditions
      forbidden: []       // impossible actions
    };

    // Potential: what this state could become
    this.potential = initial.potential || {
      forms: [],         // possible next states
      probabilities: [], // likelihood of each form
      attractors: []     // states that pull this one
    };

    // Constraints: what limits this state
    this.constraints = initial.constraints || {
      rules: [],         // applied rules
      boundaries: [],    // hard limits
      dependencies: []    // states this depends on
    };

    // Timestamp
    this.created = Date.now();
    this.modified = Date.now();
  }

  _defaultCoordinates() {
    return {
      planet: 0,      // 0-12 (13 planets)
      gate: 0,        // 0-63 (64 gates)
      line: 0,        // 0-5 (6 lines)
      color: 0,       // 0-5 (6 colors)
      tone: 0,        // 0-5 (6 tones)
      base: 0,        // 0-4 (5 bases)
      degree: 0,      // 0-359 (360 degrees)
      minute: 0,      // 0-59 (60 minutes)
      second: 0,      // 0-59 (60 seconds)
      arc: 0,         // 0-359 (360 arc minutes)
      zodiac: 0,      // 0-11 (12 zodiac signs)
      house: 0,       // 0-11 (12 houses)
      season: 0       // 0-3 (4 seasons)
    };
  }

  /**
   * Compute the 13-layer address as a single number.
   * This is the "coordinate" that addresses the 3.35 quintillion state space.
   */
  getAddress() {
    const c = this.coordinates;
    // Each coordinate is multiplied by the product of all previous coordinate ranges
    let address = c.planet;
    address = address * 64 + c.gate;
    address = address * 6 + c.line;
    address = address * 6 + c.color;
    address = address * 6 + c.tone;
    address = address * 5 + c.base;
    address = address * 360 + c.degree;
    address = address * 60 + c.minute;
    address = address * 60 + c.second;
    address = address * 360 + c.arc;
    address = address * 12 + c.zodiac;
    address = address * 12 + c.house;
    address = address * 4 + c.season;
    return address;
  }

  /**
   * Set coordinates from a single address number.
   */
  setFromAddress(address) {
    const c = {};
    c.season = address % 4; address = Math.floor(address / 4);
    c.house = address % 12; address = Math.floor(address / 12);
    c.zodiac = address % 12; address = Math.floor(address / 12);
    c.arc = address % 360; address = Math.floor(address / 360);
    c.second = address % 60; address = Math.floor(address / 60);
    c.minute = address % 60; address = Math.floor(address / 60);
    c.degree = address % 360; address = Math.floor(address / 360);
    c.base = address % 5; address = Math.floor(address / 5);
    c.tone = address % 6; address = Math.floor(address / 6);
    c.color = address % 6; address = Math.floor(address / 6);
    c.line = address % 6; address = Math.floor(address / 6);
    c.gate = address % 64; address = Math.floor(address / 64);
    c.planet = address % 13;
    this.coordinates = c;
    this.modified = Date.now();
  }

  /**
   * Compute energy based on coordinate alignment.
   */
  computeEnergy() {
    const c = this.coordinates;
    // Energy is highest when coordinates are aligned (resonant)
    const alignment = (
      (c.planet === c.zodiac % 13 ? 1 : 0) +
      (c.gate === c.house * 5 + c.line ? 1 : 0) +
      (c.color === c.tone ? 1 : 0)
    ) / 3;
    this.energy.level = 0.3 + alignment * 0.7;
    this.energy.potential = this.energy.level * (1 - this.energy.dissipation);
    return this.energy;
  }

  /**
   * Add a semantic triple.
   */
  addTriple(subject, predicate, object) {
    this.semantics.triples.push({ subject, predicate, object, time: Date.now() });
    this.modified = Date.now();
  }

  /**
   * Add an edge to another state.
   */
  addEdge(targetId, type = 'connection', strength = 0.5) {
    this.edges.active.push({ target: targetId, type, strength, created: Date.now() });
    this.modified = Date.now();
  }

  /**
   * Store a trace in memory.
   */
  remember(trace) {
    this.memory.traces.push({ trace, time: Date.now() });
    if (this.memory.traces.length > this.memory.depth) {
      this.memory.traces.shift();
    }
    this.modified = Date.now();
  }

  /**
   * Compute affordances based on current state.
   */
  computeAffordances() {
    const available = [];

    // Movement affordances
    if (this.energy.level > 0.2) {
      available.push('move');
    }

    // Transformation affordances
    if (this.energy.potential > 0.5) {
      available.push('transform');
    }

    // Connection affordances
    if (this.edges.active.length < 36) {
      available.push('connect');
    }

    // Memory affordances
    if (this.memory.traces.length > 0) {
      available.push('recall');
    }

    this.affordances.available = available;
    return available;
  }

  toJSON() {
    return {
      identity: this.identity,
      geometry: this.geometry,
      semantics: this.semantics,
      energy: this.energy,
      coordinates: this.coordinates,
      edges: this.edges,
      affordances: this.affordances,
      created: this.created,
      modified: this.modified
    };
  }
}

const RichStateModule = { RichState };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RichStateModule;
}

if (typeof window !== 'undefined') {
  window.RichState = RichStateModule;
}
