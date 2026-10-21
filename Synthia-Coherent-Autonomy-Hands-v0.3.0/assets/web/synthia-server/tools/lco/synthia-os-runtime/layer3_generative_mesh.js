/**
 * Generative Mesh - Living Hypercube of Concepts
 * ================================================
 *
 * The mesh is a dynamic graph where:
 * - Each vertex is a concept with a binary feature vector
 * - Each edge is an analogical relationship
 * - New vertices spawn from ATO operations
 * - Edges have weights that evolve over time
 * - Klein tools clip in by registering their feature spaces
 *
 * The mesh is GENERATIVE because:
 * 1. Analogies create new vertices (new concepts)
 * 2. Usage strengthens edges (learning)
 * 3. Disuse weakens edges (forgetting)
 * 4. Tools add new dimensions (growth)
 *
 * Semantic Triples:
 * The mesh organizes concepts into triples:
 *   Subject - Predicate - Object
 * Or in our terms:
 *   Mind - Body - Heart
 *   Impulse - Polarity - Witness - Context - Meaning
 *
 * Each triple is a path through the hypercube:
 *   Mind (subject) -> relates_to (predicate) -> Heart (object)
 * This path IS an analogy that can be computed.
 */

const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');

// ============================================================
// SECTION 1: MESH VERTEX (A Concept in the Hypercube)
// ============================================================

class MeshVertex {
  /**
   * A vertex represents a concept in the hypercube.
   * It has:
   * - id: unique identifier
   * - vector: binary feature vector (its position in hypercube)
   * - label: human-readable name
   * - type: what kind of concept (hexagram, word, code, scenario)
   * - weight: importance (0-1, grows with use, decays with disuse)
   * - edges: connections to other vertices
   * - metadata: additional data (trigram, center, gate, etc.)
   */
  constructor(id, vector, label, type = "concept", metadata = {}) {
    this.id = id;
    this.vector = vector;  // Binary feature vector
    this.label = label;
    this.type = type;
    this.weight = 0.5;  // Initial weight
    this.edges = new Map();  // vertex_id -> MeshEdge
    this.metadata = metadata;
    this.created = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 0;
  }

  /**
   * Access this vertex (called when used).
   * Weight increases, lastAccessed updates.
   */
  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
    this.weight = Math.min(1.0, this.weight + 0.05);
  }

  /**
   * Decay weight over time (called periodically).
   * Unused vertices fade but don't disappear.
   */
  decay(factor = 0.01) {
    this.weight = Math.max(0.1, this.weight - factor);
  }

  /**
   * Add an edge to another vertex.
   */
  addEdge(targetVertex, transform, strength = 0.5) {
    const edge = new MeshEdge(this, targetVertex, transform, strength);
    this.edges.set(targetVertex.id, edge);
    return edge;
  }

  /**
   * Get the Hamming distance to another vertex.
   */
  distanceTo(other) {
    return ATO.hammingDistance(this.vector, other.vector);
  }

  /**
   * Compute analogy: this : other :: target : ?
   */
  analogy(other, target) {
    const result = ATO.atoFull(this.vector, other.vector, target.vector);
    return result;
  }


  // ============================================================
  // PHASE-SPACE INTEGRATION
  // ============================================================

  /**
   * Receive a final state and complete trace from the phase-space engine.
   * Create/update vertices from computed states.
   * Create edges from actual transformations.
   */
  integratePhaseTrace(finalState, trace) {
    // Create vertex from final state
    const finalVector = finalState.vector || finalState.geometry?.vector || [0,0,0,0,0,0];
    const finalVertex = this.addVertex(
      finalState.identity?.id || `phase_${Date.now()}`,
      finalVector,
      finalState.identity?.name || 'PhaseState',
      'phase_state',
      {
        trace: trace,
        situation: finalState.situation,
        identity: finalState.identity
      }
    );

    // Create edges from trace transformations
    for (let i = 1; i < trace.length; i++) {
      const prev = trace[i-1];
      const curr = trace[i];
      if (prev.output && curr.output) {
        const prevVector = prev.output.vector || prev.output.geometry?.vector || [0,0,0,0,0,0];
        const currVector = curr.output.vector || curr.output.geometry?.vector || [0,0,0,0,0,0];
        if (Array.isArray(prevVector) && Array.isArray(currVector) && prevVector.length === currVector.length) {
          const transform = ATO.xor(prevVector, currVector);
          this.addEdge(
            `phase_${prev.stage}`,
            `phase_${curr.stage}`,
            'transformation',
            ATO.similarity(prevVector, currVector)
          );
        }
      }
    }

    // Create semantic triples from state relations
    if (finalState.relations) {
      finalState.relations.forEach(rel => {
        this.addTriple(
          finalState.identity?.id || 'state',
          'relates_to',
          rel.target
        );
      });
    }

    return finalVertex;
  }

  /**
   * Find tools that can provide operators for a specific stage.
   * Capability-based routing, not just Hamming distance.
   */
  findToolsForStage(stageName, state, context) {
    const applicable = [];

    for (const [toolName, tool] of this.tools) {
      if (tool.featureSpace && tool.handler) {
        // Check if tool has getOperators method
        if (typeof tool.handler.getOperators === 'function') {
          const operators = tool.handler.getOperators(context);
          const hasStage = this._hasStageOperator(operators, stageName);
          if (hasStage) {
            applicable.push({
              name: toolName,
              operators: operators,
              priority: this._computePriority(tool, state, stageName)
            });
          }
        }
      }
    }

    // Sort by priority
    applicable.sort((a, b) => b.priority - a.priority);
    return applicable;
  }

  _hasStageOperator(operators, stageName) {
    const stageMap = {
      'Movement': 'movementFn',
      'Evolution': 'trajectoryFn',
      'Being': 'beingFn',
      'Design': 'designFn',
      'Space': 'spaceFn'
    };
    return !!operators[stageMap[stageName]];
  }

  _computePriority(tool, state, stageName) {
    // Priority based on how well the tool's feature space aligns with the state
    if (tool.featureSpace && state.vector) {
      return ATO.similarity(tool.featureSpace, state.vector);
    }
    return 0.5;
  }

  toString() {
    return `${this.label} (${this.type}) [${ATO.vectorToString(this.vector)}] w=${this.weight.toFixed(2)}`;
  }
}

// ============================================================
// SECTION 2: MESH EDGE (An Analogical Relationship)
// ============================================================

class MeshEdge {
  /**
   * An edge represents an analogical relationship between two vertices.
   * It stores:
   * - source, target: the two connected vertices
   * - transform: the ATO that maps source to target
   * - strength: how strong the connection is (0-1)
   * - type: what kind of relationship (analogy, contrast, sequence, etc.)
   * - usage: how often this edge is traversed
   */
  constructor(source, target, transform, strength = 0.5) {
    this.source = source;
    this.target = target;
    this.transform = transform;  // The ATO vector
    this.strength = strength;
    this.type = "analogy";  // analogy, contrast, sequence, cause, part-of
    this.usage = 0;
    this.created = Date.now();
  }

  /**
   * Traverse this edge (called when a genome travels it).
   */
  traverse() {
    this.usage++;
    this.strength = Math.min(1.0, this.strength + 0.02);
    this.source.access();
    this.target.access();
  }

  /**
   * Decay strength over time.
   */
  decay(factor = 0.005) {
    this.strength = Math.max(0.0, this.strength - factor);
  }

  /**
   * Apply the transform to a new vector.
   * This is how analogies propagate through the mesh.
   */
  applyTransform(vector) {
    return ATO.xor(vector, this.transform);
  }


  // ============================================================
  // PHASE-SPACE INTEGRATION
  // ============================================================

  /**
   * Receive a final state and complete trace from the phase-space engine.
   * Create/update vertices from computed states.
   * Create edges from actual transformations.
   */
  integratePhaseTrace(finalState, trace) {
    // Create vertex from final state
    const finalVector = finalState.vector || finalState.geometry?.vector || [0,0,0,0,0,0];
    const finalVertex = this.addVertex(
      finalState.identity?.id || `phase_${Date.now()}`,
      finalVector,
      finalState.identity?.name || 'PhaseState',
      'phase_state',
      {
        trace: trace,
        situation: finalState.situation,
        identity: finalState.identity
      }
    );

    // Create edges from trace transformations
    for (let i = 1; i < trace.length; i++) {
      const prev = trace[i-1];
      const curr = trace[i];
      if (prev.output && curr.output) {
        const prevVector = prev.output.vector || prev.output.geometry?.vector || [0,0,0,0,0,0];
        const currVector = curr.output.vector || curr.output.geometry?.vector || [0,0,0,0,0,0];
        if (Array.isArray(prevVector) && Array.isArray(currVector) && prevVector.length === currVector.length) {
          const transform = ATO.xor(prevVector, currVector);
          this.addEdge(
            `phase_${prev.stage}`,
            `phase_${curr.stage}`,
            'transformation',
            ATO.similarity(prevVector, currVector)
          );
        }
      }
    }

    // Create semantic triples from state relations
    if (finalState.relations) {
      finalState.relations.forEach(rel => {
        this.addTriple(
          finalState.identity?.id || 'state',
          'relates_to',
          rel.target
        );
      });
    }

    return finalVertex;
  }

  /**
   * Find tools that can provide operators for a specific stage.
   * Capability-based routing, not just Hamming distance.
   */
  findToolsForStage(stageName, state, context) {
    const applicable = [];

    for (const [toolName, tool] of this.tools) {
      if (tool.featureSpace && tool.handler) {
        // Check if tool has getOperators method
        if (typeof tool.handler.getOperators === 'function') {
          const operators = tool.handler.getOperators(context);
          const hasStage = this._hasStageOperator(operators, stageName);
          if (hasStage) {
            applicable.push({
              name: toolName,
              operators: operators,
              priority: this._computePriority(tool, state, stageName)
            });
          }
        }
      }
    }

    // Sort by priority
    applicable.sort((a, b) => b.priority - a.priority);
    return applicable;
  }

  _hasStageOperator(operators, stageName) {
    const stageMap = {
      'Movement': 'movementFn',
      'Evolution': 'trajectoryFn',
      'Being': 'beingFn',
      'Design': 'designFn',
      'Space': 'spaceFn'
    };
    return !!operators[stageMap[stageName]];
  }

  _computePriority(tool, state, stageName) {
    // Priority based on how well the tool's feature space aligns with the state
    if (tool.featureSpace && state.vector) {
      return ATO.similarity(tool.featureSpace, state.vector);
    }
    return 0.5;
  }

  toString() {
    return `${this.source.label} --[${this.type}, s=${this.strength.toFixed(2)}]--> ${this.target.label}`;
  }
}

// ============================================================
// SECTION 3: SEMANTIC TRIPLE (Mind-Body-Heart)
// ============================================================

class SemanticTriple {
  /**
   * A semantic triple is a path through the mesh:
   *   Subject -> Predicate -> Object
   *
   * In our system:
   *   Mind (subject) -> relates_to (predicate) -> Heart (object)
   *   Or: Impulse -> Polarity -> Witness -> Context -> Meaning
   *
   * The triple IS an analogy. It can be computed.
   * It can also be traversed by genomes.
   */
  constructor(subject, predicate, object) {
    this.subject = subject;     // MeshVertex
    this.predicate = predicate; // MeshEdge (or string label)
    this.object = object;       // MeshVertex
    this.weight = 0.5;
    this.created = Date.now();
  }

  /**
   * Compute the analogy implied by this triple.
   * If subject : object :: x : ?, what is the result?
   */
  computeAnalogy(x) {
    return this.subject.analogy(this.object, x);
  }

  /**
   * Check if this triple matches a pattern.
   * Pattern: {subject_type, predicate_type, object_type}
   */
  matches(pattern) {
    const sMatch = !pattern.subject || this.subject.type === pattern.subject;
    const pMatch = !pattern.predicate || this.predicate === pattern.predicate;
    const oMatch = !pattern.object || this.object.type === pattern.object;
    return sMatch && pMatch && oMatch;
  }


  // ============================================================
  // PHASE-SPACE INTEGRATION
  // ============================================================

  /**
   * Receive a final state and complete trace from the phase-space engine.
   * Create/update vertices from computed states.
   * Create edges from actual transformations.
   */
  integratePhaseTrace(finalState, trace) {
    // Create vertex from final state
    const finalVector = finalState.vector || finalState.geometry?.vector || [0,0,0,0,0,0];
    const finalVertex = this.addVertex(
      finalState.identity?.id || `phase_${Date.now()}`,
      finalVector,
      finalState.identity?.name || 'PhaseState',
      'phase_state',
      {
        trace: trace,
        situation: finalState.situation,
        identity: finalState.identity
      }
    );

    // Create edges from trace transformations
    for (let i = 1; i < trace.length; i++) {
      const prev = trace[i-1];
      const curr = trace[i];
      if (prev.output && curr.output) {
        const prevVector = prev.output.vector || prev.output.geometry?.vector || [0,0,0,0,0,0];
        const currVector = curr.output.vector || curr.output.geometry?.vector || [0,0,0,0,0,0];
        if (Array.isArray(prevVector) && Array.isArray(currVector) && prevVector.length === currVector.length) {
          const transform = ATO.xor(prevVector, currVector);
          this.addEdge(
            `phase_${prev.stage}`,
            `phase_${curr.stage}`,
            'transformation',
            ATO.similarity(prevVector, currVector)
          );
        }
      }
    }

    // Create semantic triples from state relations
    if (finalState.relations) {
      finalState.relations.forEach(rel => {
        this.addTriple(
          finalState.identity?.id || 'state',
          'relates_to',
          rel.target
        );
      });
    }

    return finalVertex;
  }

  /**
   * Find tools that can provide operators for a specific stage.
   * Capability-based routing, not just Hamming distance.
   */
  findToolsForStage(stageName, state, context) {
    const applicable = [];

    for (const [toolName, tool] of this.tools) {
      if (tool.featureSpace && tool.handler) {
        // Check if tool has getOperators method
        if (typeof tool.handler.getOperators === 'function') {
          const operators = tool.handler.getOperators(context);
          const hasStage = this._hasStageOperator(operators, stageName);
          if (hasStage) {
            applicable.push({
              name: toolName,
              operators: operators,
              priority: this._computePriority(tool, state, stageName)
            });
          }
        }
      }
    }

    // Sort by priority
    applicable.sort((a, b) => b.priority - a.priority);
    return applicable;
  }

  _hasStageOperator(operators, stageName) {
    const stageMap = {
      'Movement': 'movementFn',
      'Evolution': 'trajectoryFn',
      'Being': 'beingFn',
      'Design': 'designFn',
      'Space': 'spaceFn'
    };
    return !!operators[stageMap[stageName]];
  }

  _computePriority(tool, state, stageName) {
    // Priority based on how well the tool's feature space aligns with the state
    if (tool.featureSpace && state.vector) {
      return ATO.similarity(tool.featureSpace, state.vector);
    }
    return 0.5;
  }

  toString() {
    const pred = typeof this.predicate === 'string' ? this.predicate : this.predicate.type;
    return `${this.subject.label} --${pred}--> ${this.object.label}`;
  }
}

// ============================================================
// SECTION 4: THE GENERATIVE MESH
// ============================================================

class GenerativeMesh {
  constructor(dimensions = 6) {
    this.dimensions = dimensions;
    this.vertices = new Map();  // id -> MeshVertex
    this.edges = new Map();     // id -> MeshEdge
    this.triples = [];          // SemanticTriple[]
    this.tools = new Map();     // tool_name -> {feature_space, handler}
    this.generation = 0;        // How many generations of evolution
    this.history = [];          // Log of all operations
  }

  // ============================================================
  // VERTEX MANAGEMENT
  // ============================================================

  /**
   * Add a vertex to the mesh.
   */
  addVertex(id, vector, label, type = "concept", metadata = {}) {
    if (this.vertices.has(id)) {
      return this.vertices.get(id);  // Already exists
    }
    const vertex = new MeshVertex(id, vector, label, type, metadata);
    this.vertices.set(id, vertex);
    this.log("add_vertex", { id, label, type });
    return vertex;
  }

  /**
   * Get a vertex by ID.
   */
  getVertex(id) {
    const v = this.vertices.get(id);
    if (v) v.access();
    return v;
  }

  /**
   * Find vertices by type.
   */
  findByType(type) {
    return Array.from(this.vertices.values()).filter(v => v.type === type);
  }

  /**
   * Find vertices by label (fuzzy match).
   */
  findByLabel(label) {
    return Array.from(this.vertices.values()).filter(v => 
      v.label.toLowerCase().includes(label.toLowerCase())
    );
  }

  /**
   * Find nearest neighbors to a vector.
   */
  findNearest(vector, maxDistance = 2) {
    const results = [];
    for (const vertex of this.vertices.values()) {
      const dist = ATO.hammingDistance(vector, vertex.vector);
      if (dist <= maxDistance) {
        results.push({ vertex, distance: dist });
      }
    }
    return results.sort((a, b) => a.distance - b.distance);
  }

  // ============================================================
  // EDGE MANAGEMENT
  // ============================================================

  /**
   * Add an edge between two vertices.
   * The edge represents an analogical relationship.
   */
  addEdge(sourceId, targetId, type = "analogy", strength = 0.5) {
    const source = this.vertices.get(sourceId);
    const target = this.vertices.get(targetId);
    if (!source || !target) return null;

    const transform = ATO.xor(source.vector, target.vector);
    const edge = source.addEdge(target, transform, strength);
    edge.type = type;
    this.edges.set(`${sourceId}:${targetId}`, edge);
    this.log("add_edge", { source: sourceId, target: targetId, type, strength });
    return edge;
  }

  /**
   * Get edge between two vertices.
   */
  getEdge(sourceId, targetId) {
    return this.edges.get(`${sourceId}:${targetId}`);
  }

  /**
   * Find all edges from a vertex.
   */
  getEdgesFrom(vertexId) {
    const vertex = this.vertices.get(vertexId);
    if (!vertex) return [];
    return Array.from(vertex.edges.values());
  }

  // ============================================================
  // TRIPLE MANAGEMENT
  // ============================================================

  /**
   * Add a semantic triple.
   */
  addTriple(subjectId, predicate, objectId) {
    const subject = this.vertices.get(subjectId);
    const object = this.vertices.get(objectId);
    if (!subject || !object) return null;

    const triple = new SemanticTriple(subject, predicate, object);
    this.triples.push(triple);
    this.log("add_triple", { subject: subjectId, predicate, object: objectId });
    return triple;
  }

  /**
   * Find triples matching a pattern.
   */
  findTriples(pattern) {
    return this.triples.filter(t => t.matches(pattern));
  }

  // ============================================================
  // GENERATIVE OPERATIONS (The Core Magic)
  // ============================================================

  /**
   * GENERATE a new vertex from an analogy.
   * Given: a : b :: c : ?
   * Compute d and add it to the mesh.
   */
  generateFromAnalogy(aId, bId, cId, label, type = "generated") {
    const a = this.vertices.get(aId);
    const b = this.vertices.get(bId);
    const c = this.vertices.get(cId);
    if (!a || !b || !c) return null;

    const result = a.analogy(b, c);
    const dVector = result.result;

    // Check if this vector already exists
    const existing = this.findNearest(dVector, 0);
    if (existing.length > 0) {
      return existing[0].vertex;  // Return existing vertex
    }

    // Create new vertex
    const dId = `gen_${this.generation}_${Date.now()}`;
    const d = this.addVertex(dId, dVector, label, type, {
      generated_from: { a: aId, b: bId, c: cId },
      transform: result.transform
    });

    // Add edges
    this.addEdge(aId, dId, "analogy_generated", 0.3);
    this.addEdge(cId, dId, "analogy_result", 0.3);

    this.generation++;
    this.log("generate", { a: aId, b: bId, c: cId, d: dId, label });
    return d;
  }

  /**
   * BLEND two vertices to create a new one.
   * This is like genetic crossover.
   */
  blendVertices(v1Id, v2Id, label, type = "blend") {
    const v1 = this.vertices.get(v1Id);
    const v2 = this.vertices.get(v2Id);
    if (!v1 || !v2) return null;

    // Blend: for each bit, choose from v1 or v2 randomly
    const blended = v1.vector.map((bit, i) => Math.random() < 0.5 ? bit : v2.vector[i]);

    const bId = `blend_${this.generation}_${Date.now()}`;
    const b = this.addVertex(bId, blended, label, type, {
      parents: [v1Id, v2Id]
    });

    this.addEdge(v1Id, bId, "parent", 0.5);
    this.addEdge(v2Id, bId, "parent", 0.5);

    this.generation++;
    return b;
  }

  /**
   * MUTATE a vertex slightly.
   * Flip one random bit.
   */
  mutateVertex(vId, label, type = "mutant") {
    const v = this.vertices.get(vId);
    if (!v) return null;

    const mutated = [...v.vector];
    const bitToFlip = Math.floor(Math.random() * mutated.length);
    mutated[bitToFlip] = mutated[bitToFlip] === 1 ? 0 : 1;

    const mId = `mutant_${this.generation}_${Date.now()}`;
    const m = this.addVertex(mId, mutated, label, type, {
      parent: vId,
      flipped_bit: bitToFlip
    });

    this.addEdge(vId, mId, "mutation", 0.3);

    this.generation++;
    return m;
  }

  // ============================================================
  // TOOL INTEGRATION (Klein Tools Clip In Here)
  // ============================================================

  /**
   * Register a Klein tool with the mesh.
   * The tool provides a feature space and a handler function.
   * When the mesh needs that tool, it calls the handler.
   */
  registerTool(name, featureSpace, handler) {
    this.tools.set(name, { featureSpace, handler });
    this.log("register_tool", { name });
  }

  /**
   * Call a tool to process a concept.
   * The tool receives the vertex and returns a result.
   */
  callTool(name, vertexId, params = {}) {
    const tool = this.tools.get(name);
    const vertex = this.vertices.get(vertexId);
    if (!tool || !vertex) return null;

    const result = tool.handler(vertex, params);
    this.log("tool_call", { tool: name, vertex: vertexId, result: !!result });
    return result;
  }

  /**
   * Find the best tool for a given vertex.
   * Based on which tool's feature space is closest to the vertex.
   */
  findBestTool(vertexId) {
    const vertex = this.vertices.get(vertexId);
    if (!vertex) return null;

    let bestTool = null;
    let bestDistance = Infinity;

    for (const [name, tool] of this.tools) {
      // Simple distance check: how close is the tool's feature space to the vertex?
      // In practice, this would be more sophisticated
      const dist = ATO.hammingDistance(vertex.vector, tool.featureSpace);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestTool = name;
      }
    }

    return { tool: bestTool, distance: bestDistance };
  }

  // ============================================================
  // EVOLUTION (The Mesh Grows and Changes)
  // ============================================================

  /**
   * Evolve the mesh one step.
   * - Decay unused vertices and edges
   * - Strengthen frequently used ones
   * - Generate new vertices from strong analogies
   */
  evolve() {
    // Decay all vertices and edges
    for (const vertex of this.vertices.values()) {
      vertex.decay();
    }
    for (const edge of this.edges.values()) {
      edge.decay();
    }

    // Find strong edges and generate new concepts
    const strongEdges = Array.from(this.edges.values()).filter(e => e.strength > 0.8);
    for (const edge of strongEdges) {
      // If two concepts are strongly connected, maybe there's a third
      // This is where "creative leaps" happen
      const neighbors = this.findNearest(edge.target.vector, 2);
      for (const { vertex: neighbor } of neighbors) {
        if (neighbor.id !== edge.source.id && neighbor.id !== edge.target.id) {
          // Try: source : target :: neighbor : ?
          const generated = this.generateFromAnalogy(
            edge.source.id, edge.target.id, neighbor.id,
            `${edge.source.label}_${neighbor.label}`,
            "evolved"
          );
          if (generated) {
            this.log("evolution", { 
              from: edge.source.id, 
              via: edge.target.id, 
              to: neighbor.id,
              result: generated.id 
            });
          }
        }
      }
    }

    this.generation++;
  }

  // ============================================================
  // UTILITY
  // ============================================================

  log(operation, data) {
    this.history.push({
      time: Date.now(),
      operation,
      data
    });
  }

  getStats() {
    return {
      vertices: this.vertices.size,
      edges: this.edges.size,
      triples: this.triples.length,
      tools: this.tools.size,
      generations: this.generation,
      history: this.history.length
    };
  }


  // ============================================================
  // PHASE-SPACE INTEGRATION
  // ============================================================

  /**
   * Receive a final state and complete trace from the phase-space engine.
   * Create/update vertices from computed states.
   * Create edges from actual transformations.
   */
  integratePhaseTrace(finalState, trace) {
    // Create vertex from final state
    const finalVector = finalState.vector || finalState.geometry?.vector || [0,0,0,0,0,0];
    const finalVertex = this.addVertex(
      finalState.identity?.id || `phase_${Date.now()}`,
      finalVector,
      finalState.identity?.name || 'PhaseState',
      'phase_state',
      {
        trace: trace,
        situation: finalState.situation,
        identity: finalState.identity
      }
    );

    // Create edges from trace transformations
    for (let i = 1; i < trace.length; i++) {
      const prev = trace[i-1];
      const curr = trace[i];
      if (prev.output && curr.output) {
        const prevVector = prev.output.vector || prev.output.geometry?.vector || [0,0,0,0,0,0];
        const currVector = curr.output.vector || curr.output.geometry?.vector || [0,0,0,0,0,0];
        if (Array.isArray(prevVector) && Array.isArray(currVector) && prevVector.length === currVector.length) {
          const transform = ATO.xor(prevVector, currVector);
          this.addEdge(
            `phase_${prev.stage}`,
            `phase_${curr.stage}`,
            'transformation',
            ATO.similarity(prevVector, currVector)
          );
        }
      }
    }

    // Create semantic triples from state relations
    if (finalState.relations) {
      finalState.relations.forEach(rel => {
        this.addTriple(
          finalState.identity?.id || 'state',
          'relates_to',
          rel.target
        );
      });
    }

    return finalVertex;
  }

  /**
   * Find tools that can provide operators for a specific stage.
   * Capability-based routing, not just Hamming distance.
   */
  findToolsForStage(stageName, state, context) {
    const applicable = [];

    for (const [toolName, tool] of this.tools) {
      if (tool.featureSpace && tool.handler) {
        // Check if tool has getOperators method
        if (typeof tool.handler.getOperators === 'function') {
          const operators = tool.handler.getOperators(context);
          const hasStage = this._hasStageOperator(operators, stageName);
          if (hasStage) {
            applicable.push({
              name: toolName,
              operators: operators,
              priority: this._computePriority(tool, state, stageName)
            });
          }
        }
      }
    }

    // Sort by priority
    applicable.sort((a, b) => b.priority - a.priority);
    return applicable;
  }

  _hasStageOperator(operators, stageName) {
    const stageMap = {
      'Movement': 'movementFn',
      'Evolution': 'trajectoryFn',
      'Being': 'beingFn',
      'Design': 'designFn',
      'Space': 'spaceFn'
    };
    return !!operators[stageMap[stageName]];
  }

  _computePriority(tool, state, stageName) {
    // Priority based on how well the tool's feature space aligns with the state
    if (tool.featureSpace && state.vector) {
      return ATO.similarity(tool.featureSpace, state.vector);
    }
    return 0.5;
  }

  toString() {
    const stats = this.getStats();
    return `GenerativeMesh(v=${stats.vertices}, e=${stats.edges}, t=${stats.triples}, tools=${stats.tools}, gen=${stats.generations})`;
  }
}

// ============================================================
// SECTION 5: EXPORT
// ============================================================

const GenerativeMeshModule = {
  MeshVertex,
  MeshEdge,
  SemanticTriple,
  GenerativeMesh
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenerativeMeshModule;
}

if (typeof window !== 'undefined') {
  window.GenerativeMesh = GenerativeMeshModule;
}
