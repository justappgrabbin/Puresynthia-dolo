/**
 * Semantic Triple Engine
 * =======================
 *
 * (Subject → Predicate → Object) as executable edges.
 *
 * A triple is not just data. It is a COMPUTATION.
 *
 * Subject acts.
 * Predicate transforms.
 * Object receives.
 *
 * Example:
 *   (User, wants, conversation)
 *   → User is the source state
 *   → "wants" is the edge function (creates desire energy)
 *   → "conversation" is the target state (the desired thing)
 *
 * The triple IS the edge. The predicate IS the transform.
 */

const ATO = require('./layer1_ato_core.js');

class SemanticTripleEngine {
  constructor() {
    this.triples = [];           // all triples
    this.predicates = new Map(); // predicate -> transform function
    this.history = [];

    // Initialize default predicates
    this._initPredicates();
  }

  _initPredicates() {
    // WANTS: creates desire energy, pulls state toward object
    this.predicates.set('wants', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.energy) {
          result.energy.level = Math.min(1, result.energy.level + 0.3);
          result.energy.potential = object;
        }
        if (result.affordances) {
          result.affordances.available.push('pursue_' + object);
        }
        return result;
      },
      energyCost: 0.1,
      type: 'desire'
    });

    // AVOIDS: creates avoidance energy, pushes state away from object
    this.predicates.set('avoids', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.energy) {
          result.energy.level = Math.max(0, result.energy.level - 0.2);
          result.energy.potential = null;
        }
        if (result.constraints) {
          result.constraints.boundaries.push(object);
        }
        return result;
      },
      energyCost: 0.05,
      type: 'avoidance'
    });

    // BECOMES: transforms subject into object
    this.predicates.set('becomes', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        result.identity = { ...result.identity, name: object, type: 'transformed' };
        if (result.geometry) {
          result.geometry.vector = result.geometry.vector.map(v => v * 0.8);
        }
        return result;
      },
      energyCost: 0.3,
      type: 'transformation'
    });

    // CREATES: generates new state from subject
    this.predicates.set('creates', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.energy) {
          result.energy.level -= 0.2;
        }
        // Create new state
        const newState = {
          identity: { id: `created_${Date.now()}`, name: object, type: 'creation' },
          geometry: { vector: subject.geometry?.vector?.map(v => v * 0.5) || [0,0,0,0,0,0] },
          energy: { level: 0.5, potential: 0.5 }
        };
        if (result.edges) {
          result.edges.active.push({ target: newState.identity.id, type: 'created', strength: 1.0 });
        }
        return result;
      },
      energyCost: 0.4,
      type: 'creation'
    });

    // RELATES_TO: creates connection between subject and object
    this.predicates.set('relates_to', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.edges) {
          result.edges.active.push({ target: object, type: 'relation', strength: 0.5 });
        }
        if (result.semantics) {
          result.semantics.relations.push({ target: object, type: 'relates_to' });
        }
        return result;
      },
      energyCost: 0.05,
      type: 'relation'
    });

    // IS: establishes identity
    this.predicates.set('is', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        result.identity = { ...result.identity, form: object };
        return result;
      },
      energyCost: 0.02,
      type: 'identity'
    });

    // QUESTIONS: creates inquiry energy
    this.predicates.set('questions', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.affordances) {
          result.affordances.available.push('inquire_' + object);
        }
        if (result.potential) {
          result.potential.forms.push({ type: 'answer', question: object });
        }
        return result;
      },
      energyCost: 0.08,
      type: 'inquiry'
    });

    // SITUATED_IN: establishes context
    this.predicates.set('situated_in', {
      transform: (subject, object, context) => {
        const result = { ...subject };
        if (result.semantics) {
          result.semantics.narrative = object;
        }
        return result;
      },
      energyCost: 0.03,
      type: 'context'
    });
  }

  /**
   * Execute a triple: subject → predicate → object.
   *
   * This is the core operation. The triple IS the computation.
   */
  execute(subject, predicate, object, context = {}) {
    const pred = this.predicates.get(predicate);

    if (!pred) {
      return {
        success: false,
        error: `Unknown predicate: ${predicate}`,
        subject: subject,
        object: object
      };
    }

    // Check energy
    if (subject.energy && subject.energy.level < pred.energyCost) {
      return {
        success: false,
        error: 'Insufficient energy',
        required: pred.energyCost,
        available: subject.energy.level
      };
    }

    // Execute transform
    const result = pred.transform(subject, object, context);

    // Record
    this.triples.push({
      subject: subject.identity?.id || subject,
      predicate: predicate,
      object: typeof object === 'string' ? object : object.identity?.id,
      time: Date.now(),
      type: pred.type
    });

    this.history.push({
      time: Date.now(),
      subject: subject.identity?.id,
      predicate: predicate,
      object: object,
      type: pred.type
    });

    return {
      success: true,
      result: result,
      predicate: predicate,
      type: pred.type,
      energyCost: pred.energyCost
    };
  }

  /**
   * Execute multiple triples in sequence.
   */
  executeSequence(triples, context = {}) {
    const results = [];
    let currentState = context.initialState || {};

    for (const triple of triples) {
      const result = this.execute(
        currentState,
        triple.predicate,
        triple.object,
        context
      );
      results.push(result);

      if (result.success) {
        currentState = result.result;
      }
    }

    return { results, finalState: currentState };
  }

  /**
   * Register a new predicate.
   */
  registerPredicate(name, transform, config = {}) {
    this.predicates.set(name, {
      transform: transform,
      energyCost: config.energyCost || 0.1,
      type: config.type || 'custom'
    });
  }

  /**
   * Query triples matching a pattern.
   */
  query(subject, predicate, object) {
    return this.triples.filter(t => {
      const sMatch = subject === null || t.subject === subject;
      const pMatch = predicate === null || t.predicate === predicate;
      const oMatch = object === null || t.object === object;
      return sMatch && pMatch && oMatch;
    });
  }

  /**
   * Get all predicates.
   */
  getPredicates() {
    return Array.from(this.predicates.keys());
  }

  /**
   * Get stats.
   */
  getStats() {
    const typeCounts = {};
    for (const triple of this.triples) {
      typeCounts[triple.type] = (typeCounts[triple.type] || 0) + 1;
    }

    return {
      totalTriples: this.triples.length,
      predicates: this.predicates.size,
      typeDistribution: typeCounts,
      historyLength: this.history.length
    };
  }
}

const SemanticTripleModule = { SemanticTripleEngine };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SemanticTripleModule;
}

if (typeof window !== 'undefined') {
  window.SemanticTriple = SemanticTripleModule;
}
