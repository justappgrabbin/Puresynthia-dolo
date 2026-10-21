/**
 * AutoLink - Natural Language Parser and Semantic Interface
 * ===========================================================
 *
 * Based on Sheldon Klein's AUTOLING system (1970s).
 *
 * AutoLink parses natural language into semantic deep structures
 * using analogical transformation operators (ATOs).
 *
 * What it does:
 * 1. Tokenizes input text
 * 2. Maps tokens to feature vectors in hypercube space
 * 3. Uses ATOs to derive semantic relationships
 * 4. Outputs structured intent frames
 *
 * Feature space: [subject, action, object, emotion, urgency, domain]
 *   subject:  who is acting (self, other, system, unknown)
 *   action:   what is happening (explore, create, avoid, learn, etc.)
 *   object:   what is being acted upon (concept, person, task, feeling)
 *   emotion:  emotional valence (positive, negative, neutral, mixed)
 *   urgency:  how immediate (low, normal, high, critical)
 *   domain:   which life area (work, relationship, health, creativity, etc.)
 *
 * Each dimension is a binary feature (or multi-bit encoding).
 * The full vector is the "semantic signature" of the input.
 */

const ATO = require('./layer1_ato_core.js');

class AutoLink {
  constructor() {
    this.name = "AutoLink";
    this.version = "1.0";
    this.featureSpace = [1, 0, 0, 1, 0, 0];  // Tool signature in mesh

    // Lexicon: words mapped to feature vectors
    this.lexicon = this._buildLexicon();

    // Grammar rules: patterns that map to intents
    this.grammar = this._buildGrammar();

    // History of parsed inputs (for learning)
    this.history = [];
  }

  // ============================================================
  // LEXICON (Word -> Feature Vector Mapping)
  // ============================================================

  _buildLexicon() {
    /**
     * The lexicon maps words to binary feature vectors.
     * Each word is a point in the semantic hypercube.
     *
     * Feature dimensions:
     *   [0-1]: subject (00=self, 01=other, 10=system, 11=unknown)
     *   [2-3]: action (00=explore, 01=create, 10=avoid, 11=learn)
     *   [4-5]: object (00=concept, 01=person, 10=task, 11=feeling)
     *   [6-7]: emotion (00=neutral, 01=positive, 10=negative, 11=mixed)
     *   [8-9]: urgency (00=low, 01=normal, 10=high, 11=critical)
     *   [10-11]: domain (00=work, 01=relationship, 10=health, 11=creativity)
     *
     * For simplicity, we use 6-bit vectors (one bit per dimension)
     * and expand to 12 bits for richer encoding.
     */
    return {
      // Subjects
      "i":       [1,0,0,0,0,0],      // self
      "me":      [1,0,0,0,0,0],
      "my":      [1,0,0,0,0,0],
      "you":     [0,1,0,0,0,0],      // other
      "we":      [1,1,0,0,0,0],      // self+other

      // Actions
      "want":    [0,0,1,0,0,0],      // explore
      "need":    [0,0,1,0,0,0],
      "explore": [0,0,1,0,0,0],
      "create":  [0,0,0,1,0,0],      // create
      "make":    [0,0,0,1,0,0],
      "build":   [0,0,0,1,0,0],
      "avoid":   [0,0,1,1,0,0],      // avoid
      "skip":    [0,0,1,1,0,0],
      "learn":   [0,0,0,0,1,0],      // learn
      "study":   [0,0,0,0,1,0],
      "understand": [0,0,0,0,1,0],

      // Objects
      "something": [0,0,0,0,0,1],    // concept
      "idea":      [0,0,0,0,0,1],
      "concept":   [0,0,0,0,0,1],
      "person":    [0,0,0,0,1,0],    // person
      "people":    [0,0,0,0,1,0],
      "task":      [0,0,0,0,1,1],    // task
      "work":      [0,0,0,0,1,1],
      "feeling":   [0,0,0,1,0,0],    // feeling
      "emotion":   [0,0,0,1,0,0],

      // Emotions
      "happy":   [0,0,0,0,0,1],      // positive
      "good":    [0,0,0,0,0,1],
      "excited": [0,0,0,0,0,1],
      "sad":     [0,0,0,0,1,0],      // negative
      "bad":     [0,0,0,0,1,0],
      "angry":   [0,0,0,0,1,0],
      "scared":  [0,0,0,0,1,0],
      "worried": [0,0,0,0,1,0],
      "anxious": [0,0,0,0,1,0],
      "afraid":  [0,0,0,0,1,0],
      "avoiding": [0,0,0,0,1,0],

      // Urgency
      "now":     [0,0,0,0,0,1],      // high
      "urgent":  [0,0,0,0,0,1],
      "later":   [0,0,0,0,0,0],      // low
      "soon":    [0,0,0,0,0,0],

      // Domains
      "work":      [0,0,0,0,0,0],    // work
      "job":       [0,0,0,0,0,0],
      "career":    [0,0,0,0,0,0],
      "relationship": [0,0,0,0,0,1], // relationship
      "partner":   [0,0,0,0,0,1],
      "love":      [0,0,0,0,0,1],
      "friend":    [0,0,0,0,0,1],
      "health":    [0,0,0,0,1,0],    // health
      "body":      [0,0,0,0,1,0],
      "creative":  [0,0,0,0,1,1],    // creativity
      "art":       [0,0,0,0,1,1],
      "project":   [0,0,0,0,1,1],

      // Special
      "difficult": [0,0,0,0,1,0],    // negative + task
      "conversation": [0,0,0,0,1,0], // person + task
      "talk":      [0,0,0,0,1,0],
      "speak":     [0,0,0,0,1,0],
      "say":       [0,0,0,0,1,0]
    };
  }

  _buildGrammar() {
    /**
     * Grammar rules map syntactic patterns to semantic frames.
     * Each rule is a pattern of feature vectors that produces
     * a structured output.
     */
    return {
      "explore_pattern": {
        pattern: [[1,0,0,0,0,0], [0,0,1,0,0,0]],  // self + explore
        intent: "explore",
        confidence: 0.8
      },
      "avoid_pattern": {
        pattern: [[1,0,0,0,0,0], [0,0,1,1,0,0]],  // self + avoid
        intent: "avoid",
        confidence: 0.9
      },
      "create_pattern": {
        pattern: [[1,0,0,0,0,0], [0,0,0,1,0,0]],  // self + create
        intent: "create",
        confidence: 0.8
      },
      "learn_pattern": {
        pattern: [[1,0,0,0,0,0], [0,0,0,0,1,0]],  // self + learn
        intent: "learn",
        confidence: 0.8
      }
    };
  }

  // ============================================================
  // CORE PARSING
  // ============================================================

  /**
   * Parse input text into a semantic frame.
   * This is the main entry point.
   */
  parse(text) {
    // Step 1: Tokenize
    const tokens = this._tokenize(text);

    // Step 2: Map tokens to feature vectors
    const vectors = tokens.map(t => this._vectorize(t));

    // Step 3: Aggregate vectors (analogical blending)
    const aggregate = this._aggregate(vectors);

    // Step 4: Match against grammar patterns
    const intent = this._matchIntent(aggregate);

    // Step 5: Extract entities
    const entities = this._extractEntities(tokens, vectors);

    // Step 6: Build semantic frame
    const frame = this._buildFrame(aggregate, intent, entities, text);

    // Step 7: Log for learning
    this.history.push({ text, frame, timestamp: Date.now() });

    return frame;
  }

  /**
   * Tokenize text into words.
   */
  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Map a word to its feature vector.
   * If word not in lexicon, use analogical inference.
   */
  _vectorize(word) {
    if (this.lexicon[word]) {
      return this.lexicon[word];
    }

    // Try to infer from similar words using ATO
    let bestMatch = null;
    let bestDist = Infinity;

    for (const [lexWord, lexVec] of Object.entries(this.lexicon)) {
      // Simple string similarity (would be phonological in full AUTOLING)
      if (word.includes(lexWord) || lexWord.includes(word)) {
        const dist = ATO.hammingDistance([0,0,0,0,0,0], lexVec);  // placeholder
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = lexVec;
        }
      }
    }

    return bestMatch || [0,0,0,0,0,0];  // Unknown word
  }

  /**
   * Aggregate multiple vectors into one.
   * Uses analogical blending (like genetic crossover).
   */
  _aggregate(vectors) {
    if (vectors.length === 0) return [0,0,0,0,0,0];
    if (vectors.length === 1) return vectors[0];

    // Blend all vectors
    const result = [0,0,0,0,0,0];
    for (let i = 0; i < 6; i++) {
      const sum = vectors.reduce((s, v) => s + v[i], 0);
      result[i] = sum > vectors.length / 2 ? 1 : 0;  // Majority vote
    }
    return result;
  }

  /**
   * Match aggregate vector against grammar patterns.
   */
  _matchIntent(aggregate) {
    let bestIntent = "unknown";
    let bestConfidence = 0.0;

    for (const [ruleName, rule] of Object.entries(this.grammar)) {
      // Check if aggregate matches pattern
      const patternVec = rule.pattern[0];  // Simplified: check first element
      const dist = ATO.hammingDistance(aggregate, patternVec);
      const similarity = ATO.similarity(aggregate, patternVec);

      if (similarity > bestConfidence) {
        bestConfidence = similarity;
        bestIntent = rule.intent;
      }
    }

    return {
      intent: bestIntent,
      confidence: bestConfidence
    };
  }

  /**
   * Extract entities from tokens and vectors.
   */
  _extractEntities(tokens, vectors) {
    const entities = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const vec = vectors[i];

      // Check each dimension for entity type
      if (vec[0] === 1) entities.push({ type: "subject", value: token, role: "self" });
      if (vec[2] === 1 || vec[3] === 1) entities.push({ type: "action", value: token });
      if (vec[4] === 1) entities.push({ type: "object", value: token, subtype: "person" });
      if (vec[5] === 1) entities.push({ type: "object", value: token, subtype: "concept" });
    }

    return entities;
  }

  /**
   * Build the final semantic frame.
   */
  _buildFrame(aggregate, intent, entities, rawText) {
    // Map aggregate bits to semantic dimensions
    const subject = aggregate[0] === 1 ? "self" : (aggregate[1] === 1 ? "other" : "unknown");
    const action = aggregate[2] === 1 ? "explore" : (aggregate[3] === 1 ? "create" : (aggregate[4] === 1 ? "learn" : "avoid"));
    const object = aggregate[5] === 1 ? "concept" : "unknown";
    const emotion = aggregate[4] === 1 ? "negative" : "neutral";
    const urgency = aggregate[5] === 1 ? "high" : "normal";

    return {
      processor: "AutoLink",
      version: this.version,
      raw: rawText,
      intent: intent.intent,
      confidence: intent.confidence,
      semantic: {
        subject: subject,
        action: action,
        object: object,
        emotion: emotion,
        urgency: urgency
      },
      entities: entities,
      vector: aggregate,
      timestamp: Date.now()
    };
  }

  // ============================================================
  // MESH INTEGRATION
  // ============================================================

  /**
   * Handler for when this tool is called from the mesh.
   */
  handle(vertex, params = {}) {
    const text = params.text || vertex.label || "";
    return this.parse(text);
  }

  /**
   * Learn from new input (update lexicon).
   */
  learn(text, correction) {
    // In production: use correction to update lexicon
    this.history.push({ text, correction, learned: true });
  }

  // ============================================================
  // EXPORT
  // ============================================================


  // ============================================================
  // PHASE-SPACE OPERATOR HOOKS
  // ============================================================

  /**
   * Return operators for the five phase-space stages.
   * AutoLink contributes primarily to Movement (initial state from language).
   */
  getOperators(context) {
    return {
      // Movement: Convert parsed text into initial movable state
      movementFn: (state, ctx) => {
        const parsed = this.parse(ctx.text || state.text || '');
        return {
          state: {
            ...state,
            vector: parsed.vector,
            parsed: parsed,
            actors: parsed.entities.filter(e => e.type === 'subject'),
            actions: parsed.entities.filter(e => e.type === 'action'),
            relations: parsed.entities.filter(e => e.type === 'object')
          },
          events: [{ type: 'autolink_movement', intent: parsed.intent, vector: parsed.vector }]
        };
      },

      // Being: Detect unresolved questions from parsed text
      beingFn: (state, ctx) => {
        const text = state.parsed?.raw || '';
        const questions = [];

        // Detect question words
        if (/\bwhat\b/i.test(text)) questions.push({ type: 'what', unresolved: true });
        if (/\bwhy\b/i.test(text)) questions.push({ type: 'why', unresolved: true });
        if (/\bhow\b/i.test(text)) questions.push({ type: 'how', unresolved: true });
        if (/\bwhere\b/i.test(text)) questions.push({ type: 'where', unresolved: true });
        if (/\bwhen\b/i.test(text)) questions.push({ type: 'when', unresolved: true });
        if (/\bwho\b/i.test(text)) questions.push({ type: 'who', unresolved: true });

        return {
          state: {
            ...state,
            unresolvedQuestions: questions
          },
          events: [{ type: 'autolink_being', questions_detected: questions.length }]
        };
      }
    };
  }

  toString() {
    return `AutoLink(v=${this.version}, lexicon=${Object.keys(this.lexicon).length}, history=${this.history.length})`;
  }
}

const AutoLinkModule = { AutoLink };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoLinkModule;
}

if (typeof window !== 'undefined') {
  window.AutoLink = AutoLinkModule;
}
