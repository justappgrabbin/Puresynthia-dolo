/**
 * LCM - Language-Cognition Model
 * ==============================
 *
 * Based on Sheldon Klein's MESSY (Meta-Symbolic Simulation System, 1976).
 *
 * The LCM is a cognitive architecture that:
 * 1. THINKS in semantic triples (subject-relation-object)
 * 2. REASONS through probabilistic rules with subrule conditions
 * 3. CREATES by generating new triples, rules, and worlds
 * 4. LEARNS by modifying its own rules from experience
 * 5. COMMUNICATES through natural language generation
 * 6. ACTS by calling external tools (MCP hub)
 *
 * The 5W1H Framework:
 * - WHO:   subject (agent, entity, self)
 * - WHAT:  action (relation, event, transformation)
 * - WHERE: context (location, environment, state)
 * - WHEN:  time (sequence, rhythm, timing)
 * - WHY:   purpose (goal, motivation, meaning)
 * - HOW:   method (process, tool, mechanism)
 *
 * Each of these is a dimension in the semantic hypercube.
 * Each dimension is a binary feature (or multi-bit encoding).
 *
 * The LCM operates in simulated time:
 * - Each "tick" is a moment of cognition
 * - Rules fire based on conditions and probabilities
 * - The semantic network evolves
 * - New rules emerge from patterns
 */

const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');
const GenerativeMesh = require('./layer3_generative_mesh.js');
const SSM = require('./layer5_ssm.js');

// ============================================================
// SECTION 1: SEMANTIC TRIPLE (The Fundamental Data Structure)
// ============================================================

class SemanticTriple {
  /**
   * A semantic triple is the atomic unit of meaning.
   * Subject - Relation - Object
   *
   * Examples:
   *   (User, wants, conversation)
   *   (System, generates, scenario)
   *   (Pattern, indicates, avoidance)
   *
   * Each triple has:
   * - subject: the entity acting
   * - relation: the action or relationship
   * - object: the entity being acted upon
   * - time: when this triple was created
   * - reality: how "real" this triple is (0-1)
   * - hypothetical: is this a hypothetical or actual triple
   */
  constructor(subject, relation, object, metadata = {}) {
    this.subject = subject;
    this.relation = relation;
    this.object = object;
    this.time = metadata.time || Date.now();
    this.reality = metadata.reality || 1.0;
    this.hypothetical = metadata.hypothetical || false;
    this.vector = this._toVector();
    this.id = `triple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert triple to binary feature vector.
   * This allows triples to exist in the hypercube.
   */
  _toVector() {
    // Hash the triple components into a 6-bit vector
    const sHash = this._hash(this.subject) % 2;
    const rHash = this._hash(this.relation) % 2;
    const oHash = this._hash(this.object) % 2;
    const tHash = (this.time % 2);
    const rvHash = this.reality > 0.5 ? 1 : 0;
    const hHash = this.hypothetical ? 1 : 0;
    return [sHash, rHash, oHash, tHash, rvHash, hHash];
  }

  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }


  // ============================================================
  // PHASE-SPACE ORCHESTRATION
  // ============================================================

  /**
   * Process input through the full phase-space pipeline.
   *
   * 1. AutoLink produces initial state
   * 2. Gather operators from registered tools
   * 3. Run through phase-space engine (Movement→Evolution→Being→Design→Space)
   * 4. Store trace in temporal SSM
   * 5. Update generative mesh
   * 6. Generate semantic triples from relations
   * 7. Route final state to appropriate tools
   * 8. Return final state, trace, projections, triples, tool outputs
   */
  processPhaseSpace(input) {
    const PhaseSpace = require('./phase_space_engine.js');
    const engine = new PhaseSpace.PhaseSpaceEngine();

    // Step 1: AutoLink produces initial state
    const initialState = this._produceInitialState(input);

    // Step 2: Gather operators from all registered tools
    const toolOperators = this._gatherOperators(input);

    // Register tool operators with the engine
    for (const [stageName, operators] of Object.entries(toolOperators)) {
      if (operators.length > 0) {
        // Compose multiple operators for same stage
        const composedOperator = this._composeOperators(operators);
        engine.registerOperator(stageName, composedOperator);
      }
    }

    // Step 3: Run through phase-space engine
    const context = {
      text: input,
      history: this.ssm.history,
      mesh: this.mesh,
      rules: this.rules
    };

    const result = engine.compose(initialState, context);

    // Step 4: Store trace in temporal SSM
    this.ssm.history.push({
      time: this.ssm.time,
      input: input,
      trace: result.trace,
      finalState: result.finalState
    });
    this.ssm.time++;

    // Step 5: Update generative mesh
    if (result.complete) {
      this.mesh.integratePhaseTrace(result.finalState, result.trace);
    }

    // Step 6: Generate semantic triples from relations
    const triples = this._generateTriplesFromState(result.finalState);
    triples.forEach(t => this.addTriple(t));

    // Step 7: Route final state to appropriate tools
    const toolOutputs = this._routeToTools(result.finalState, result.trace);

    // Step 8: Project the trace
    const projections = {
      interrogative: engine.project(result.trace, 'interrogative'),
      chronological: engine.project(result.trace, 'chronological'),
      structural: engine.project(result.trace, 'structural')
    };

    return {
      finalState: result.finalState,
      trace: result.trace,
      errors: result.errors,
      complete: result.complete,
      projections: projections,
      triples: triples.map(t => t.toJSON()),
      toolOutputs: toolOutputs,
      mood: this.ssm.getMood()
    };
  }

  _produceInitialState(input) {
    // Use AutoLink to parse input into initial state
    const parsed = this.autolink ? this.autolink.parse(input) : { vector: [0,0,0,0,0,0] };

    return {
      text: input,
      vector: parsed.vector || [0,0,0,0,0,0],
      parsed: parsed,
      timestamp: Date.now()
    };
  }

  _gatherOperators(context) {
    const operators = {
      Movement: [],
      Evolution: [],
      Being: [],
      Design: [],
      Space: []
    };

    // Gather from all registered tools
    for (const [toolName, tool] of this.tools) {
      if (tool.handler && typeof tool.handler.getOperators === 'function') {
        const toolOps = tool.handler.getOperators(context);

        if (toolOps.movementFn) operators.Movement.push(toolOps.movementFn);
        if (toolOps.trajectoryFn) operators.Evolution.push(toolOps.trajectoryFn);
        if (toolOps.beingFn) operators.Being.push(toolOps.beingFn);
        if (toolOps.designFn) operators.Design.push(toolOps.designFn);
        if (toolOps.spaceFn) operators.Space.push(toolOps.spaceFn);
      }
    }

    // Also check mesh tools
    for (const [toolName, tool] of this.mesh.tools) {
      if (tool.handler && typeof tool.handler.getOperators === 'function') {
        const toolOps = tool.handler.getOperators(context);

        if (toolOps.movementFn) operators.Movement.push(toolOps.movementFn);
        if (toolOps.trajectoryFn) operators.Evolution.push(toolOps.trajectoryFn);
        if (toolOps.beingFn) operators.Being.push(toolOps.beingFn);
        if (toolOps.designFn) operators.Design.push(toolOps.designFn);
        if (toolOps.spaceFn) operators.Space.push(toolOps.spaceFn);
      }
    }

    return operators;
  }

  _composeOperators(operators) {
    // Compose multiple operators into one
    // Each operator transforms the state, and the next receives the output
    return new (require('./phase_space_engine.js').PhaseOperator)(
      'composed',
      (state, context) => {
        let currentState = state;
        const allEvents = [];

        for (const op of operators) {
          const result = op(currentState, context);
          currentState = result.state;
          allEvents.push(...(result.events || []));
        }

        return { state: currentState, events: allEvents };
      }
    );
  }

  _generateTriplesFromState(state) {
    const triples = [];

    // Triple from identity
    if (state.identity) {
      triples.push(new SemanticTriple(
        state.identity.id,
        'is',
        state.identity.form || 'emerging'
      ));
    }

    // Triples from relations
    if (state.relations) {
      state.relations.forEach(rel => {
        triples.push(new SemanticTriple(
          state.identity?.id || 'state',
          'relates_to',
          rel.target
        ));
      });
    }

    // Triples from situation
    if (state.situation) {
      triples.push(new SemanticTriple(
        state.identity?.id || 'state',
        'situated_in',
        state.situation.type
      ));
    }

    // Triples from unresolved questions
    if (state.unresolvedQuestions) {
      state.unresolvedQuestions.forEach(q => {
        triples.push(new SemanticTriple(
          state.identity?.id || 'state',
          'questions',
          q.type
        ));
      });
    }

    return triples;
  }

  _routeToTools(finalState, trace) {
    const outputs = {};

    // Route to AutoNovel for narrative generation
    if (this.autonovel) {
      const narrative = this.autonovel._generateFromTrace(trace);
      outputs.autonovel = narrative;
    }

    // Route to WorldEngine for rendering
    if (this.worldengine) {
      const world = this.worldengine._renderFromState(finalState);
      outputs.worldengine = world;
    }

    return outputs;
  }

  toString() {
    return `(${this.subject} ${this.relation} ${this.object})`;
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      relation: this.relation,
      object: this.object,
      time: this.time,
      reality: this.reality,
      hypothetical: this.hypothetical,
      vector: this.vector
    };
  }
}

// ============================================================
// SECTION 2: 5W1H FRAMEWORK
// ============================================================

class FiveWOneH {
  /**
   * The 5W1H framework structures any cognitive operation.
   * Every thought, action, or query is analyzed through these dimensions.
   */
  constructor() {
    this.dimensions = ['who', 'what', 'where', 'when', 'why', 'how'];
  }

  /**
   * Analyze a user query into 5W1H components.
   */
  analyze(query) {
    const analysis = {
      who: this._extractWho(query),
      what: this._extractWhat(query),
      where: this._extractWhere(query),
      when: this._extractWhen(query),
      why: this._extractWhy(query),
      how: this._extractHow(query),
      raw: query
    };
    return analysis;
  }

  _extractWho(query) {
    const patterns = [/\bi\b/i, /\bme\b/i, /\bmy\b/i, /\bwe\b/i, /\byou\b/i, /\bthey\b/i];
    for (const p of patterns) {
      if (p.test(query)) return query.match(p)[0];
    }
    return 'user';
  }

  _extractWhat(query) {
    const actions = ['want', 'need', 'explore', 'create', 'avoid', 'learn', 'build', 'find', 'do'];
    for (const action of actions) {
      if (query.includes(action)) return action;
    }
    return 'unknown';
  }

  _extractWhere(query) {
    const places = ['body', 'mind', 'city', 'world', 'home', 'work', 'here', 'there'];
    for (const place of places) {
      if (query.includes(place)) return place;
    }
    return 'current_context';
  }

  _extractWhen(query) {
    const times = ['now', 'today', 'tomorrow', 'later', 'soon', 'always', 'never'];
    for (const time of times) {
      if (query.includes(time)) return time;
    }
    return 'present';
  }

  _extractWhy(query) {
    const reasons = ['because', 'since', 'as', 'for', 'to', 'in order to'];
    for (const reason of reasons) {
      if (query.includes(reason)) return 'purposeful';
    }
    return 'exploratory';
  }

  _extractHow(query) {
    const methods = ['by', 'through', 'via', 'using', 'with', 'how'];
    for (const method of methods) {
      if (query.includes(method)) return 'methodical';
    }
    return 'intuitive';
  }

  /**
   * Convert 5W1H analysis to semantic triples.
   */
  toTriples(analysis) {
    const triples = [];
    triples.push(new SemanticTriple(analysis.who, 'wants', analysis.what));
    triples.push(new SemanticTriple(analysis.who, 'located_in', analysis.where));
    triples.push(new SemanticTriple(analysis.who, 'acting_at', analysis.when));
    triples.push(new SemanticTriple(analysis.who, 'motivated_by', analysis.why));
    triples.push(new SemanticTriple(analysis.who, 'using_method', analysis.how));
    return triples;
  }
}

// ============================================================
// SECTION 3: RULE SYSTEM (MESSY-style)
// ============================================================

class LCMRule {
  /**
   * A rule in the LCM is like a MESSY rule:
   * - Conditions (subrules) test the semantic network
   * - Actions modify the network
   * - Probability determines if the rule fires
   */
  constructor(name, conditions, actions, probability = 1.0) {
    this.name = name;
    this.conditions = conditions;  // Array of condition functions
    this.actions = actions;        // Array of action functions
    this.probability = probability;
    this.firedCount = 0;
    this.created = Date.now();
  }

  /**
   * Evaluate if this rule should fire.
   */
  evaluate(network, context) {
    // Test all conditions
    for (const condition of this.conditions) {
      if (!condition(network, context)) {
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
   * Execute the rule's actions.
   */
  execute(network, context) {
    const results = [];
    for (const action of this.actions) {
      results.push(action(network, context));
    }
    this.firedCount++;
    return results;
  }
}

// ============================================================
// SECTION 4: LCM CORE
// ============================================================

class LCM {
  constructor() {
    this.name = "LCM";
    this.version = "1.0";

    // Semantic network (the "universe")
    this.network = [];  // Array of SemanticTriple

    // Rule system
    this.rules = [];    // Array of LCMRule
    this.ruleGroups = new Map();  // groupName -> LCMRule[]

    // 5W1H analyzer
    this.fiveWOneH = new FiveWOneH();

    // Simulated time
    this.time = 0;
    this.clock = 0;

    // State Space Model (memory)
    this.ssm = new SSM.StateSpaceModel(64, 6, 6);

    // Generative Mesh (concept space)
    this.mesh = new GenerativeMesh.GenerativeMesh(6);

    // MCP tools
    this.tools = new Map();

    // History
    this.history = [];

    // Initialize default rules
    this._initDefaultRules();
  }

  // ============================================================
  // DEFAULT RULES
  // ============================================================

  _initDefaultRules() {
    // Rule 1: If user expresses avoidance, detect pattern
    this.rules.push(new LCMRule(
      "detect_avoidance",
      [
        (net, ctx) => ctx.analysis && ctx.analysis.what === 'avoid',
        (net, ctx) => ctx.analysis.why === 'exploratory'
      ],
      [
        (net, ctx) => {
          const triple = new SemanticTriple(ctx.analysis.who, 'exhibits', 'avoidance_pattern');
          this.addTriple(triple);
          return { action: 'detected', pattern: 'avoidance', triple: triple.id };
        }
      ],
      0.9
    ));

    // Rule 2: If pattern detected, generate scenario
    this.rules.push(new LCMRule(
      "generate_scenario",
      [
        (net, ctx) => this.hasTriple(ctx.analysis.who, 'exhibits', 'avoidance_pattern')
      ],
      [
        (net, ctx) => {
          const scenario = this._generateScenario('avoidance');
          const triple = new SemanticTriple('system', 'generates', scenario.name);
          this.addTriple(triple);
          return { action: 'generated', scenario: scenario.name, triple: triple.id };
        }
      ],
      0.8
    ));

    // Rule 3: If scenario generated, build world
    this.rules.push(new LCMRule(
      "build_world",
      [
        (net, ctx) => this.hasTriple('system', 'generates', null)
      ],
      [
        (net, ctx) => {
          const world = this._buildWorld('avoidance');
          const triple = new SemanticTriple('system', 'creates', world.name);
          this.addTriple(triple);
          return { action: 'built', world: world.name, triple: triple.id };
        }
      ],
      0.7
    ));

    // Rule 4: Self-modification - if rule fires often, create variant
    this.rules.push(new LCMRule(
      "self_modify",
      [
        (net, ctx) => {
          // Check if any rule has fired > 10 times
          return this.rules.some(r => r.firedCount > 10);
        }
      ],
      [
        (net, ctx) => {
          const sourceRule = this.rules.find(r => r.firedCount > 10);
          if (sourceRule) {
            const newRule = this._createVariantRule(sourceRule);
            this.rules.push(newRule);
            return { action: 'self_modified', newRule: newRule.name };
          }
          return { action: 'no_modification' };
        }
      ],
      0.3  // Low probability - self-modification is rare
    ));
  }

  // ============================================================
  // CORE OPERATIONS
  // ============================================================

  /**
   * Process a user input through the full LCM pipeline.
   */
  process(input) {
    // Step 1: 5W1H Analysis
    const analysis = this.fiveWOneH.analyze(input);

    // Step 2: Convert to triples
    const triples = this.fiveWOneH.toTriples(analysis);

    // Step 3: Add to network
    triples.forEach(t => this.addTriple(t));

    // Step 4: Update SSM
    const aggregate = triples.reduce((sum, t) => {
      return sum.map((v, i) => v + t.vector[i]);
    }, [0,0,0,0,0,0]);
    const normalized = aggregate.map(v => v > triples.length / 2 ? 1 : 0);
    this.ssm.step(normalized);

    // Step 5: Evaluate rules
    const context = { analysis, input, time: this.time };
    const firedRules = [];

    for (const rule of this.rules) {
      if (rule.evaluate(this.network, context)) {
        const results = rule.execute(this.network, context);
        firedRules.push({ rule: rule.name, results });
      }
    }

    // Step 6: Update mesh
    triples.forEach(t => {
      this.mesh.addVertex(t.id, t.vector, t.toString(), "triple");
    });

    // Step 7: Advance time
    this.time++;
    this.clock += 1000; // 1 second per tick

    // Step 8: Log
    this.history.push({
      time: this.time,
      input,
      analysis,
      triples: triples.map(t => t.id),
      firedRules: firedRules.map(r => r.rule),
      mood: this.ssm.getMood()
    });

    return {
      analysis,
      triples: triples.map(t => t.toJSON()),
      firedRules,
      mood: this.ssm.getMood(),
      networkSize: this.network.length,
      ruleCount: this.rules.length
    };
  }

  /**
   * Add a triple to the network.
   */
  addTriple(triple) {
    this.network.push(triple);

    // Also add to mesh
    this.mesh.addVertex(triple.id, triple.vector, triple.toString(), "triple", {
      subject: triple.subject,
      relation: triple.relation,
      object: triple.object
    });
  }

  /**
   * Check if a triple exists in the network.
   * Wildcards (null) match any value.
   */
  hasTriple(subject, relation, object) {
    return this.network.some(t => {
      const sMatch = subject === null || t.subject === subject;
      const rMatch = relation === null || t.relation === relation;
      const oMatch = object === null || t.object === object;
      return sMatch && rMatch && oMatch;
    });
  }

  /**
   * Query the network for triples matching a pattern.
   */
  query(subject, relation, object) {
    return this.network.filter(t => {
      const sMatch = subject === null || t.subject === subject;
      const rMatch = relation === null || t.relation === relation;
      const oMatch = object === null || t.object === object;
      return sMatch && rMatch && oMatch;
    });
  }

  /**
   * Register an MCP tool.
   */
  registerTool(name, handler) {
    this.tools.set(name, handler);
  }

  /**
   * Call an MCP tool.
   */
  callTool(name, params) {
    const tool = this.tools.get(name);
    if (!tool) return null;

    const result = tool(params);

    // Log the tool call as a triple
    this.addTriple(new SemanticTriple('system', 'uses_tool', name, {
      metadata: { params, result: !!result }
    }));

    return result;
  }

  // ============================================================
  // CREATIVE OPERATIONS
  // ============================================================

  _generateScenario(archetype) {
    // In production: call AutoNovel
    // For now: generate simple scenario
    return {
      name: `Scenario_${archetype}_${this.time}`,
      archetype,
      setup: `A space shaped by ${archetype}.`,
      choices: [
        { text: 'Face it directly', line: 1 },
        { text: 'Wait and observe', line: 3 },
        { text: 'Seek guidance', line: 2 }
      ]
    };
  }

  _buildWorld(archetype) {
    // In production: call WorldEngine
    // For now: generate simple world
    return {
      name: `World_${archetype}_${this.time}`,
      archetype,
      environment: {
        sky: archetype === 'avoidance' ? 'stormy' : 'clear',
        ground: 'earth',
        lighting: 'dim'
      }
    };
  }

  _createVariantRule(sourceRule) {
    // Create a variant of a frequently-fired rule
    // This is self-modification - the system learns from its own behavior
    const variantName = `${sourceRule.name}_v${sourceRule.firedCount}`;

    // Modify probability based on success
    const newProb = Math.min(1.0, sourceRule.probability * 1.1);

    return new LCMRule(
      variantName,
      sourceRule.conditions,  // Same conditions
      sourceRule.actions,      // Same actions
      newProb                  // Higher probability
    );
  }

  // ============================================================
  // NATURAL LANGUAGE GENERATION
  // ============================================================

  /**
   * Generate natural language from the semantic network.
   * This is the inverse of parsing - triples -> text.
   */
  generateText(triplePattern) {
    const triples = this.query(triplePattern.subject, triplePattern.relation, triplePattern.object);

    if (triples.length === 0) return "I have nothing to say about that.";

    const sentences = triples.map(t => {
      // Simple template-based generation
      if (t.relation === 'wants') {
        return `${t.subject} wants ${t.object}.`;
      } else if (t.relation === 'exhibits') {
        return `${t.subject} exhibits ${t.object}.`;
      } else if (t.relation === 'generates') {
        return `I generated ${t.object} for ${t.subject}.`;
      } else {
        return `${t.subject} ${t.relation} ${t.object}.`;
      }
    });

    return sentences.join(' ');
  }

  // ============================================================
  // EXPORT
  // ============================================================


  // ============================================================
  // PHASE-SPACE ORCHESTRATION
  // ============================================================

  /**
   * Process input through the full phase-space pipeline.
   *
   * 1. AutoLink produces initial state
   * 2. Gather operators from registered tools
   * 3. Run through phase-space engine (Movement→Evolution→Being→Design→Space)
   * 4. Store trace in temporal SSM
   * 5. Update generative mesh
   * 6. Generate semantic triples from relations
   * 7. Route final state to appropriate tools
   * 8. Return final state, trace, projections, triples, tool outputs
   */
  processPhaseSpace(input) {
    const PhaseSpace = require('./phase_space_engine.js');
    const engine = new PhaseSpace.PhaseSpaceEngine();

    // Step 1: AutoLink produces initial state
    const initialState = this._produceInitialState(input);

    // Step 2: Gather operators from all registered tools
    const toolOperators = this._gatherOperators(input);

    // Register tool operators with the engine
    for (const [stageName, operators] of Object.entries(toolOperators)) {
      if (operators.length > 0) {
        // Compose multiple operators for same stage
        const composedOperator = this._composeOperators(operators);
        engine.registerOperator(stageName, composedOperator);
      }
    }

    // Step 3: Run through phase-space engine
    const context = {
      text: input,
      history: this.ssm.history,
      mesh: this.mesh,
      rules: this.rules
    };

    const result = engine.compose(initialState, context);

    // Step 4: Store trace in temporal SSM
    this.ssm.history.push({
      time: this.ssm.time,
      input: input,
      trace: result.trace,
      finalState: result.finalState
    });
    this.ssm.time++;

    // Step 5: Update generative mesh
    if (result.complete) {
      this.mesh.integratePhaseTrace(result.finalState, result.trace);
    }

    // Step 6: Generate semantic triples from relations
    const triples = this._generateTriplesFromState(result.finalState);
    triples.forEach(t => this.addTriple(t));

    // Step 7: Route final state to appropriate tools
    const toolOutputs = this._routeToTools(result.finalState, result.trace);

    // Step 8: Project the trace
    const projections = {
      interrogative: engine.project(result.trace, 'interrogative'),
      chronological: engine.project(result.trace, 'chronological'),
      structural: engine.project(result.trace, 'structural')
    };

    return {
      finalState: result.finalState,
      trace: result.trace,
      errors: result.errors,
      complete: result.complete,
      projections: projections,
      triples: triples.map(t => t.toJSON()),
      toolOutputs: toolOutputs,
      mood: this.ssm.getMood()
    };
  }

  _produceInitialState(input) {
    // Use AutoLink to parse input into initial state
    const parsed = this.autolink ? this.autolink.parse(input) : { vector: [0,0,0,0,0,0] };

    return {
      text: input,
      vector: parsed.vector || [0,0,0,0,0,0],
      parsed: parsed,
      timestamp: Date.now()
    };
  }

  _gatherOperators(context) {
    const operators = {
      Movement: [],
      Evolution: [],
      Being: [],
      Design: [],
      Space: []
    };

    // Gather from all registered tools
    for (const [toolName, tool] of this.tools) {
      if (tool.handler && typeof tool.handler.getOperators === 'function') {
        const toolOps = tool.handler.getOperators(context);

        if (toolOps.movementFn) operators.Movement.push(toolOps.movementFn);
        if (toolOps.trajectoryFn) operators.Evolution.push(toolOps.trajectoryFn);
        if (toolOps.beingFn) operators.Being.push(toolOps.beingFn);
        if (toolOps.designFn) operators.Design.push(toolOps.designFn);
        if (toolOps.spaceFn) operators.Space.push(toolOps.spaceFn);
      }
    }

    // Also check mesh tools
    for (const [toolName, tool] of this.mesh.tools) {
      if (tool.handler && typeof tool.handler.getOperators === 'function') {
        const toolOps = tool.handler.getOperators(context);

        if (toolOps.movementFn) operators.Movement.push(toolOps.movementFn);
        if (toolOps.trajectoryFn) operators.Evolution.push(toolOps.trajectoryFn);
        if (toolOps.beingFn) operators.Being.push(toolOps.beingFn);
        if (toolOps.designFn) operators.Design.push(toolOps.designFn);
        if (toolOps.spaceFn) operators.Space.push(toolOps.spaceFn);
      }
    }

    return operators;
  }

  _composeOperators(operators) {
    // Compose multiple operators into one
    // Each operator transforms the state, and the next receives the output
    return new (require('./phase_space_engine.js').PhaseOperator)(
      'composed',
      (state, context) => {
        let currentState = state;
        const allEvents = [];

        for (const op of operators) {
          const result = op(currentState, context);
          currentState = result.state;
          allEvents.push(...(result.events || []));
        }

        return { state: currentState, events: allEvents };
      }
    );
  }

  _generateTriplesFromState(state) {
    const triples = [];

    // Triple from identity
    if (state.identity) {
      triples.push(new SemanticTriple(
        state.identity.id,
        'is',
        state.identity.form || 'emerging'
      ));
    }

    // Triples from relations
    if (state.relations) {
      state.relations.forEach(rel => {
        triples.push(new SemanticTriple(
          state.identity?.id || 'state',
          'relates_to',
          rel.target
        ));
      });
    }

    // Triples from situation
    if (state.situation) {
      triples.push(new SemanticTriple(
        state.identity?.id || 'state',
        'situated_in',
        state.situation.type
      ));
    }

    // Triples from unresolved questions
    if (state.unresolvedQuestions) {
      state.unresolvedQuestions.forEach(q => {
        triples.push(new SemanticTriple(
          state.identity?.id || 'state',
          'questions',
          q.type
        ));
      });
    }

    return triples;
  }

  _routeToTools(finalState, trace) {
    const outputs = {};

    // Route to AutoNovel for narrative generation
    if (this.autonovel) {
      const narrative = this.autonovel._generateFromTrace(trace);
      outputs.autonovel = narrative;
    }

    // Route to WorldEngine for rendering
    if (this.worldengine) {
      const world = this.worldengine._renderFromState(finalState);
      outputs.worldengine = world;
    }

    return outputs;
  }

  toString() {
    return `LCM(time=${this.time}, triples=${this.network.length}, rules=${this.rules.length}, mood=${this.ssm.getMood().mood})`;
  }
}

const LCMModule = { LCM, SemanticTriple, FiveWOneH, LCMRule };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LCMModule;
}

if (typeof window !== 'undefined') {
  window.LCM = LCMModule;
}
