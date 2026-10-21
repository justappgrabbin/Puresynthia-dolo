/**
 * State Space Model (SSM) - The System Memory
 * ===========================================
 *
 * Based on Mamba/S4 architecture.
 *
 * The SSM is the "brain" that persists the mesh state across time.
 * It remembers past states, evolves the mesh, and predicts next states.
 *
 * State equation:
 *   h(t+1) = A * h(t) + B * x(t)
 *   y(t)   = C * h(t) + D * x(t)
 *
 * Where:
 *   h(t) = hidden state (the mesh at time t)
 *   x(t) = input (new events, user actions, tool outputs)
 *   y(t) = output (predictions, next states, recommendations)
 *   A    = state transition matrix (how the mesh evolves)
 *   B    = input projection (how inputs affect the mesh)
 *   C    = output projection (how state produces output)
 *   D    = skip connection (direct input to output)
 *
 * The A matrix is structured using HiPPO (High-order Polynomial
 * Projection Operator) theory so that the state remembers the
 * past efficiently. In our case, A is derived from the I Ching
 * hexagram transitions.
 */

const ATO = require('./layer1_ato_core.js');

// ============================================================
// SECTION 1: SSM CORE
// ============================================================

class StateSpaceModel {
  /**
   * Create a State Space Model.
   *
   * @param stateDim - dimension of hidden state (default 64 for 64 hexagrams)
   * @param inputDim - dimension of input (default 6 for feature vectors)
   * @param outputDim - dimension of output (default 6 for predictions)
   */
  constructor(stateDim = 64, inputDim = 6, outputDim = 6) {
    this.stateDim = stateDim;
    this.inputDim = inputDim;
    this.outputDim = outputDim;

    // Initialize state (all zeros)
    this.h = new Array(stateDim).fill(0);

    // Initialize matrices
    this.A = this._buildA();  // State transition (structured)
    this.B = this._buildB();  // Input projection
    this.C = this._buildC();  // Output projection
    this.D = this._buildD();  // Skip connection

    // Time tracking
    this.time = 0;
    this.history = [];

    // Memory buffer (for long-term recall)
    this.memory = [];
    this.memorySize = 1000;
  }

  // ============================================================
  // MATRIX CONSTRUCTION
  // ============================================================

  /**
   * Build the A matrix (state transition).
   * This is structured using HiPPO theory.
   * In our case, we use a simple decay structure where:
   * - Diagonal elements = decay rates (how fast each state fades)
   * - Off-diagonal = coupling (how states influence each other)
   *
   * The structure is based on I Ching transitions:
   * - Each state dimension corresponds to a hexagram
   * - Transitions between hexagrams define the coupling
   */
  _buildA() {
    const A = [];
    for (let i = 0; i < this.stateDim; i++) {
      const row = [];
      for (let j = 0; j < this.stateDim; j++) {
        if (i === j) {
          // Diagonal: decay rate (slightly less than 1 for stability)
          row.push(0.99);
        } else {
          // Off-diagonal: coupling based on hexagram distance
          // Hexagrams that are close (few line changes) have strong coupling
          const distance = this._hexagramDistance(i, j);
          const coupling = Math.exp(-distance / 2) * 0.01;
          row.push(coupling);
        }
      }
      A.push(row);
    }
    return A;
  }

  /**
   * Build the B matrix (input projection).
   * Maps input features (6D) to state space (64D).
   */
  _buildB() {
    const B = [];
    for (let i = 0; i < this.stateDim; i++) {
      const row = [];
      for (let j = 0; j < this.inputDim; j++) {
        // Random initialization with small values
        row.push((Math.random() - 0.5) * 0.1);
      }
      B.push(row);
    }
    return B;
  }

  /**
   * Build the C matrix (output projection).
   * Maps state space (64D) to output (6D).
   */
  _buildC() {
    const C = [];
    for (let i = 0; i < this.outputDim; i++) {
      const row = [];
      for (let j = 0; j < this.stateDim; j++) {
        row.push((Math.random() - 0.5) * 0.1);
      }
      C.push(row);
    }
    return C;
  }

  /**
   * Build the D matrix (skip connection).
   * Maps input directly to output.
   */
  _buildD() {
    const D = [];
    for (let i = 0; i < this.outputDim; i++) {
      const row = [];
      for (let j = 0; j < this.inputDim; j++) {
        row.push(i === j ? 0.5 : 0);  // Identity-like
      }
      D.push(row);
    }
    return D;
  }

  /**
   * Compute Hamming distance between two hexagram indices.
   * Used for structuring the A matrix.
   */
  _hexagramDistance(i, j) {
    // Convert indices to 6-bit vectors
    const vi = this._indexToVector(i);
    const vj = this._indexToVector(j);
    return ATO.hammingDistance(vi, vj);
  }

  /**
   * Convert hexagram index to 6-bit vector.
   */
  _indexToVector(index) {
    // Index 0 = all zeros (Receptive)
    // Index 63 = all ones (Creative)
    const vec = [];
    for (let i = 0; i < 6; i++) {
      vec.push((index >> i) & 1);
    }
    return vec;
  }

  // ============================================================
  // CORE OPERATIONS
  // ============================================================

  /**
   * Step the SSM forward one time step.
   *
   * h(t+1) = A * h(t) + B * x(t)
   * y(t)   = C * h(t) + D * x(t)
   */
  step(input) {
    // Ensure input is the right size
    const x = this._padOrTrim(input, this.inputDim);

    // Compute new state: h_new = A * h + B * x
    const Ah = this._matVecMul(this.A, this.h);
    const Bx = this._matVecMul(this.B, x);
    const hNew = Ah.map((val, i) => val + Bx[i]);

    // Apply nonlinearity (tanh for stability)
    this.h = hNew.map(v => Math.tanh(v));

    // Compute output: y = C * h + D * x
    const Ch = this._matVecMul(this.C, this.h);
    const Dx = this._matVecMul(this.D, x);
    const y = Ch.map((val, i) => val + Dx[i]);

    // Apply nonlinearity to output
    const yOut = y.map(v => Math.tanh(v));

    // Store in history
    this.history.push({
      time: this.time,
      input: x,
      state: [...this.h],
      output: yOut
    });

    // Store in memory (circular buffer)
    this.memory.push({
      time: this.time,
      input: x,
      state: [...this.h],
      output: yOut
    });
    if (this.memory.length > this.memorySize) {
      this.memory.shift();
    }

    this.time++;

    return yOut;
  }

  /**
   * Process a mesh event through the SSM.
   * Converts a mesh vertex into input and updates state.
   */
  processMeshEvent(vertex) {
    // Convert vertex vector to input (pad or trim to inputDim)
    const input = this._padOrTrim(vertex.vector, this.inputDim);

    // Step the SSM
    const output = this.step(input);

    // Store association between vertex and state
    this.history[this.history.length - 1].vertexId = vertex.id;

    return {
      output: output,
      state: [...this.h],
      time: this.time - 1
    };
  }

  /**
   * Predict the next state given current input.
   */
  predict(input) {
    // Save current state
    const hSaved = [...this.h];

    // Step with input
    const output = this.step(input);

    // Restore state (prediction doesn't change actual state)
    this.h = hSaved;
    this.history.pop();  // Remove the prediction from history
    this.time--;  // Roll back time

    return output;
  }

  /**
   * Recall past states similar to current input.
   * This is "memory retrieval" — finding relevant past experiences.
   */
  recall(input, topK = 5) {
    const x = this._padOrTrim(input, this.inputDim);

    // Find most similar past inputs
    const similarities = this.memory.map((mem, idx) => {
      const sim = this._cosineSimilarity(x, mem.input);
      return { index: idx, similarity: sim, memory: mem };
    });

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }

  /**
   * Get the "mood" of the current state.
   * Derived from the dominant hexagrams in the state.
   */
  getMood() {
    // Find the top 3 active hexagrams (highest state values)
    const hexActivations = this.h.map((val, idx) => ({ idx, val }));
    hexActivations.sort((a, b) => b.val - a.val);

    const top3 = hexActivations.slice(0, 3);

    return {
      dominant: top3[0].idx,
      secondary: top3[1]?.idx,
      tertiary: top3[2]?.idx,
      activation: top3[0].val,
      mood: this._interpretMood(top3[0].val)
    };
  }

  /**
   * Interpret the mood from activation level.
   */
  _interpretMood(activation) {
    if (activation > 0.8) return "intense";
    if (activation > 0.5) return "active";
    if (activation > 0.2) return "calm";
    if (activation > -0.2) return "neutral";
    if (activation > -0.5) return "subdued";
    return "dormant";
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Matrix-vector multiplication.
   */
  _matVecMul(matrix, vector) {
    return matrix.map(row => {
      return row.reduce((sum, val, i) => sum + val * vector[i], 0);
    });
  }

  /**
   * Pad or trim a vector to target length.
   */
  _padOrTrim(vec, targetLength) {
    if (vec.length === targetLength) return vec;
    if (vec.length < targetLength) {
      // Pad with zeros
      return [...vec, ...new Array(targetLength - vec.length).fill(0)];
    }
    // Trim
    return vec.slice(0, targetLength);
  }

  /**
   * Cosine similarity between two vectors.
   */
  _cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  }

  // ============================================================
  // MESH INTEGRATION
  // ============================================================

  /**
   * Handler for when the SSM is called from the mesh.
   */
  handle(vertex, params = {}) {
    if (params.step) {
      return this.step(params.input);
    }
    if (params.predict) {
      return this.predict(params.input);
    }
    if (params.recall) {
      return this.recall(params.input, params.topK);
    }
    if (params.mood) {
      return this.getMood();
    }
    return {
      stateDim: this.stateDim,
      time: this.time,
      mood: this.getMood(),
      historyLength: this.history.length
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================

  toString() {
    return `SSM(dim=${this.stateDim}, time=${this.time}, mood=${this.getMood().mood})`;
  }
}

const SSMModule = { StateSpaceModel };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SSMModule;
}

if (typeof window !== 'undefined') {
  window.SSM = SSMModule;
}
