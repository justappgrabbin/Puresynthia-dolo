/**
 * STATE TRANSITION ENGINE
 * Orchestrates movement through 5D dimensional state space
 * Maps transitions to specific visual/audio sequences
 * 
 * Based on:
 * - Gate transitions (I Ching 64 gates)
 * - Dimensional resonances
 * - Harmonic progressions (Circle of Fifths)
 * - Temporal sequences
 */

export class StateTransitionEngine {
  constructor(geometry) {
    this.geometry = geometry;
    this.trajectories = new Map();
    this.harmonicGraph = this.buildHarmonicGraph();
  }

  /**
   * Define transition rules based on dimensional resonance
   * Maps current state to next state(s) and transition parameters
   */
  buildTransitionRules() {
    return {
      // Movement dominates: energy increases
      energeticShift: (currentState) => {
        return {
          targetState: {
            ...currentState,
            movement: Math.min(1, (currentState.movement || 0) + 0.2),
          },
          duration: 500, // milliseconds
          easing: 'easeOut',
          audio: { type: 'ascending', frequency: 'high' },
        };
      },

      // Evolution focus: temporal/spiral progression
      evolutionaryShift: (currentState) => {
        return {
          targetState: {
            ...currentState,
            evolution: Math.min(1, (currentState.evolution || 0) + 0.15),
          },
          duration: 1000,
          easing: 'easeInOut',
          audio: { type: 'spiral', frequency: 'medium' },
        };
      },

      // Being grounding: matter/substance increases
      materializationShift: (currentState) => {
        return {
          targetState: {
            ...currentState,
            being: Math.min(1, (currentState.being || 0) + 0.1),
          },
          duration: 800,
          easing: 'easeIn',
          audio: { type: 'grounding', frequency: 'low' },
        };
      },

      // Design coherence: structure/pattern emerges
      designShift: (currentState) => {
        return {
          targetState: {
            ...currentState,
            design: Math.min(1, (currentState.design || 0) + 0.25),
          },
          duration: 1200,
          easing: 'cubic',
          audio: { type: 'harmonic', frequency: 'varied' },
        };
      },

      // Space illusion: perceptual shift
      spaceShift: (currentState) => {
        return {
          targetState: {
            ...currentState,
            space: (currentState.space || 0 + 0.2) % 1.0,
          },
          duration: 600,
          easing: 'easeOut',
          audio: { type: 'shimmer', frequency: 'high' },
        };
      },

      // Harmonic progression: Circle of Fifths movement
      harmonicProgression: (currentState, step = 1) => {
        const newEvolution = ((currentState.evolution || 0) * 12 + 7 * step) % 12; // Perfect fifth
        return {
          targetState: {
            ...currentState,
            evolution: newEvolution / 12,
          },
          duration: 800,
          easing: 'easeInOut',
          audio: { type: 'fifthprogression', note: newEvolution },
        };
      },

      // I Ching gate transition: jump to different hexagram quality
      gateTransition: (currentState, fromGate, toGate) => {
        const gateDiff = (toGate - fromGate) / 64;
        return {
          targetState: {
            ...currentState,
            movement: (currentState.movement || 0) + gateDiff * 0.1,
            evolution: (currentState.evolution || 0) + gateDiff * 0.15,
          },
          duration: 1500,
          easing: 'easeInOut',
          audio: { type: 'gateshift', from: fromGate, to: toGate },
        };
      },

      // Return to origin (reset)
      returnToOrigin: (currentState) => {
        return {
          targetState: {
            movement: 0.5,
            evolution: 0.5,
            being: 0.5,
            design: 0.5,
            space: 0.5,
          },
          duration: 2000,
          easing: 'easeInOut',
          audio: { type: 'resolution', frequency: 'convergent' },
        };
      },
    };
  }

  /**
   * Build harmonic graph based on Circle of Fifths relationships
   * Maps dimensional states to musical/visual harmonics
   */
  buildHarmonicGraph() {
    const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // Perfect fifths cycle
    const graph = new Map();

    for (let i = 0; i < 12; i++) {
      const note = fifths[i];
      graph.set(i, {
        note,
        color: this.noteToColor(note),
        frequency: this.noteToFrequency(note),
        nextFifth: fifths[(i + 1) % 12],
      });
    }

    return graph;
  }

  /**
   * Convert MIDI note to color
   */
  noteToColor(note) {
    const spectrum = [
      '#FF0000', // C - Red
      '#FF7F00', // C#
      '#FFFF00', // D - Yellow
      '#00FF00', // D# - Green
      '#0000FF', // E - Blue
      '#4B0082', // F - Indigo
      '#9400D3', // F# - Violet
      '#FF1493', // G - Pink
      '#FF69B4', // G#
      '#FFB6C1', // A - Light Pink
      '#FFD700', // A# - Gold
      '#FFA500', // B - Orange
    ];
    return spectrum[note % 12];
  }

  /**
   * Convert MIDI note to frequency in Hz
   */
  noteToFrequency(note) {
    // A4 (MIDI 69) = 440 Hz
    const A4 = 69;
    const freq440 = 440;
    return freq440 * Math.pow(2, (note - A4) / 12);
  }

  /**
   * Create a smooth trajectory through 5D state space
   * Uses parametric interpolation
   */
  createTrajectory(startState, endState, duration, pathType = 'linear') {
    const keyframes = [];
    const steps = Math.floor(duration / 16); // 60fps

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const eased = this.easeValue(t, pathType);

      const frame = {
        timestamp: i * 16,
        state: this.geometry.interpolate(startState, endState, eased),
      };

      keyframes.push(frame);
    }

    return {
      startState,
      endState,
      duration,
      pathType,
      keyframes,
    };
  }

  /**
   * Apply easing function
   */
  easeValue(t, type = 'linear') {
    switch (type) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'cubic':
        return t < 0.5 ? 4 * t * t * t : 1 + (t - 1) * (2 * (t - 2)) * (2 * (t - 2));
      case 'elastic':
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0
          ? 0
          : t === 1
            ? 1
            : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c5);
      case 'bounce':
        return t < 0.5
          ? (1 - Math.cos(Math.PI * t)) / 2
          : (1 + Math.cos(Math.PI * (t - 1))) / 2;
      default:
        return t;
    }
  }

  /**
   * Generate sequence of transitions for musical composition
   * Maps to Circle of Fifths progression
   */
  generateMusicalComposition(startState, numSteps = 8) {
    const rules = this.buildTransitionRules();
    const sequence = [];
    let currentState = startState;

    const transitionTypes = [
      'harmonicProgression',
      'designShift',
      'energeticShift',
      'evolutionaryShift',
      'spaceShift',
    ];

    for (let i = 0; i < numSteps; i++) {
      const type = transitionTypes[i % transitionTypes.length];
      const transition = rules[type](currentState, i % 12);

      sequence.push({
        type,
        ...transition,
        index: i,
      });

      currentState = transition.targetState;
    }

    return sequence;
  }

  /**
   * Generate fractal/recursive trajectory
   * Creates self-similar patterns at different scales
   */
  generateFractalTrajectory(startState, iterations = 3, scale = 0.5) {
    const trajectories = [];
    let currentState = startState;

    for (let i = 0; i < iterations; i++) {
      // Each iteration modulates the state
      const modulated = {
        movement: currentState.movement * scale + (1 - scale) * 0.5,
        evolution: currentState.evolution * scale + (1 - scale) * 0.5,
        being: currentState.being * scale + (1 - scale) * 0.5,
        design: currentState.design * scale + (1 - scale) * 0.5,
        space: currentState.space * scale + (1 - scale) * 0.5,
      };

      const trajectory = this.createTrajectory(currentState, modulated, 1000 + i * 500);
      trajectories.push(trajectory);

      currentState = modulated;
    }

    return trajectories;
  }

  /**
   * Compute resonance between current state and target state
   * Determines compatibility/harmony
   */
  computeResonance(state1, state2) {
    let resonance = 0;

    // Dimensional harmony: similar values = resonance
    resonance += 1 - Math.abs(state1.movement - state2.movement);
    resonance += 1 - Math.abs(state1.evolution - state2.evolution);
    resonance += 1 - Math.abs(state1.being - state2.being);
    resonance += 1 - Math.abs(state1.design - state2.design);
    resonance += 1 - Math.abs(state1.space - state2.space);

    return resonance / 5; // Normalize to 0-1
  }

  /**
   * Find optimal transition path using A* algorithm
   * Minimizes distance while maximizing resonance
   */
  findOptimalPath(startState, targetState, maxSteps = 10) {
    const openSet = [{ state: startState, path: [], cost: 0 }];
    const closed = new Set();

    while (openSet.length > 0 && openSet[0].path.length < maxSteps) {
      // Sort by f-score (cost + heuristic)
      openSet.sort((a, b) => {
        const fA = a.cost + this.geometry.distance(a.state, targetState);
        const fB = b.cost + this.geometry.distance(b.state, targetState);
        return fA - fB;
      });

      const current = openSet.shift();
      const stateKey = JSON.stringify(current.state);

      if (closed.has(stateKey)) continue;
      closed.add(stateKey);

      // Check if close enough to target
      if (this.geometry.distance(current.state, targetState) < 0.1) {
        return current.path;
      }

      // Generate neighbors (transitions)
      const rules = this.buildTransitionRules();
      for (const [ruleName, rule] of Object.entries(rules)) {
        const transition = rule(current.state);
        const newPath = [...current.path, { rule: ruleName, ...transition }];
        const newCost =
          current.cost +
          this.geometry.distance(current.state, transition.targetState) -
          this.computeResonance(transition.targetState, targetState) * 0.5;

        openSet.push({
          state: transition.targetState,
          path: newPath,
          cost: newCost,
        });
      }
    }

    return null; // No path found
  }
}

export default StateTransitionEngine;
