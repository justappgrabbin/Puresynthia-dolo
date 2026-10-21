/**
 * AutoNovel - Generative Narrative Engine
 * ========================================
 *
 * Based on Sheldon Klein's AUTOMATIC NOVEL WRITING system.
 *
 * AutoNovel generates interactive scenarios from I Ching patterns.
 * Each scenario is a personalized "skit" that the user plays
 * to learn a life lesson.
 *
 * What it does:
 * 1. Receives a pattern/archetype from DISEMINER
 * 2. Selects a narrative template based on the archetype
 * 3. Fills in personalized details (user's name, context, etc.)
 * 4. Generates branching choices (each maps to a hexagram line)
 * 5. Outputs a complete scenario script
 *
 * Feature space: [conflict, growth, relationship, self, transformation, resolution]
 *   conflict: does the scenario involve inner/outer conflict
 *   growth: does the scenario lead to personal growth
 *   relationship: does it involve other people
 *   self: does it focus on self-knowledge
 *   transformation: does it involve change
 *   resolution: does it have a clear ending
 */

const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');

class AutoNovel {
  constructor() {
    this.name = "AutoNovel";
    this.version = "1.0";
    this.featureSpace = [0, 0, 1, 0, 0, 1];  // Tool signature in mesh

    // Narrative templates (based on I Ching archetypes)
    this.templates = this._buildTemplates();

    // Scenario history
    this.scenarios = [];
  }

  // ============================================================
  // NARRATIVE TEMPLATES
  // ============================================================

  _buildTemplates() {
    /**
     * Each template is a narrative archetype based on I Ching hexagrams.
     * Templates have:
     * - setup: the opening scene
     * - npcs: characters in the scenario
     * - choices: branching options (mapped to hexagram lines)
     * - outcomes: results of each choice
     * - lesson: what the user learns
     */
    return {
      "The Meeting": {
        archetype: "avoidance",
        hexagrams: [6, 33, 36],
        gates: [6, 12, 33, 36],
        feature: [1, 0, 1, 0, 0, 1],  // conflict, relationship, resolution
        setup: "You stand before a door. Behind it is a conversation you have been avoiding. The air feels heavy. You can hear voices on the other side.",
        setting: "A threshold space — between inside and outside, between silence and speech.",
        npcs: [
          { name: "The Mirror", role: "reflects your true feelings", vector: [1,0,0,1,0,0] },
          { name: "The Shadow", role: "represents what you fear", vector: [0,1,0,0,1,0] },
          { name: "The Doorkeeper", role: "guards the threshold", vector: [0,0,1,0,0,1] }
        ],
        choices: [
          {
            text: "Enter boldly and speak your truth",
            line: 1,  // Bottom line = foundation
            hexagram: 6,
            outcome: "You face the conflict directly. The conversation is difficult but clarifying. You learn that honesty, even when painful, creates space for resolution.",
            lesson: "Directness dissolves the shadows we fear."
          },
          {
            text: "Wait and listen before entering",
            line: 3,  // Third line = transition
            hexagram: 5,
            outcome: "You pause at the threshold. By listening first, you understand the other person's perspective before speaking. The conversation becomes a dialogue, not a confrontation.",
            lesson: "Patience reveals what force cannot see."
          },
          {
            text: "Turn away and return later",
            line: 6,  // Top line = resolution
            hexagram: 33,
            outcome: "You choose retreat. The door remains closed. But as you walk away, you realize that avoidance has its own cost — the conversation grows heavier with each postponement.",
            lesson: "Retreat is not escape; it is preparation. But preparation without action becomes its own prison."
          }
        ],
        closing: "The door remains, whether you enter or not. The conversation will happen — either now, or in the silence that follows avoidance."
      },

      "The Threshold": {
        archetype: "repetition",
        hexagrams: [3, 24, 32],
        gates: [3, 24, 32, 42],
        feature: [0, 1, 0, 1, 1, 0],  // growth, self, transformation
        setup: "A path opens before you, but the first step is the hardest. You have been here before — same fork, same hesitation, same turning back. The ground feels familiar, almost too familiar.",
        setting: "A crossroads in a forest — one path well-worn, the other overgrown. Mist obscures both destinations.",
        npcs: [
          { name: "The Guide", role: "knows the path but won't walk it for you", vector: [1,0,0,0,1,0] },
          { name: "The Doubt", role: "whispers every reason to turn back", vector: [0,1,0,0,0,0] },
          { name: "The Path Itself", role: "silent, waiting", vector: [0,0,1,0,0,1] }
        ],
        choices: [
          {
            text: "Leap forward into the unknown",
            line: 1,
            hexagram: 3,
            outcome: "You take the first step. The ground shifts beneath you — not stable, but alive. You stumble, then find your footing. The path reveals itself only as you walk it.",
            lesson: "The first step creates the path."
          },
          {
            text: "Prepare carefully before moving",
            line: 4,
            hexagram: 26,
            outcome: "You gather what you need — knowledge, resources, courage. The preparation itself becomes a ritual. When you finally step forward, you are ready in a way you never were before.",
            lesson: "Preparation is not delay; it is the foundation of power."
          },
          {
            text: "Ask the Guide to walk with you",
            line: 2,
            hexagram: 17,
            outcome: "The Guide joins you, not leading but walking beside. You realize that guidance is not about having answers — it is about having company in the questions. Together, the path becomes clearer.",
            lesson: "No one walks alone. The Guide appears when we admit we need one."
          }
        ],
        closing: "The crossroads will be here again. But next time, you will recognize it sooner. And perhaps, you will not hesitate as long."
      },

      "The Spark": {
        archetype: "initiation",
        hexagrams: [1, 25, 34],
        gates: [1, 25, 34, 51],
        feature: [0, 1, 0, 0, 1, 1],  // growth, transformation, resolution
        setup: "An empty space waits for your creation. Not a blank page — an empty room, an empty garden, an empty relationship. The void is not absence; it is potential. What will you bring into being?",
        setting: "A workshop at dawn — tools arranged, materials ready, the first light falling on an untouched surface.",
        npcs: [
          { name: "The Muse", role: "inspires but does not create", vector: [1,0,0,0,0,1] },
          { name: "The Critic", role: "judges before creation begins", vector: [0,1,0,0,0,0] },
          { name: "The Work Itself", role: "waits to be born", vector: [0,0,1,0,1,0] }
        ],
        choices: [
          {
            text: "Begin without plan — let the work guide you",
            line: 1,
            hexagram: 1,
            outcome: "You start with no plan. The work emerges from your hands, not your mind. It is messy, imperfect, alive. You discover that creation is not about control — it is about listening to what wants to be born.",
            lesson: "The Creative does not plan; it flows."
          },
          {
            text: "Study the masters before beginning",
            line: 5,
            hexagram: 26,
            outcome: "You immerse yourself in the work of others. Patterns emerge. You see what has been done and what remains undone. When you finally begin, your work carries the weight of tradition and the lightness of innovation.",
            lesson: "The Great Taming learns before it creates."
          },
          {
            text: "Destroy what exists and rebuild",
            line: 6,
            hexagram: 49,
            outcome: "You clear the space completely. What was there is gone. In the emptiness, something new has room to grow. The destruction was not violence — it was making space.",
            lesson: "Revolution is not destruction; it is creation through clearing."
          }
        ],
        closing: "The work is never finished. But it is begun. And that is the miracle."
      },

      "The Forge": {
        archetype: "transformation",
        hexagrams: [49, 50, 55],
        gates: [42, 49, 50, 55],
        feature: [1, 1, 0, 0, 1, 1],  // conflict, growth, transformation, resolution
        setup: "You are in the fire. Not metaphorically — the heat is real, the pressure is real, the transformation is real. You are not who you were. You are not yet who you will become. You are in between.",
        setting: "A forge — flames, hammer, anvil. The metal glows red, then white. The smith waits for the right moment to strike.",
        npcs: [
          { name: "The Smith", role: "shapes what the fire reveals", vector: [1,0,0,0,1,0] },
          { name: "The Fire", role: "transforms without mercy", vector: [0,1,0,0,0,1] },
          { name: "The Metal", role: "becomes what it must become", vector: [0,0,1,0,1,0] }
        ],
        choices: [
          {
            text: "Surrender to the fire completely",
            line: 3,
            hexagram: 50,
            outcome: "You let go. The fire does what fire does — it burns away what is not essential. What remains is harder, sharper, more true. You are changed. You cannot go back.",
            lesson: "The Cauldron transforms only what surrenders to it."
          },
          {
            text: "Resist the heat and maintain control",
            line: 4,
            hexagram: 49,
            outcome: "You fight the transformation. The heat is endured, not embraced. You survive, but you are not transformed. The metal remains soft, unshaped. The potential is preserved — but unrealized.",
            lesson: "Resistance preserves what is, but prevents what could be."
          },
          {
            text: "Shape yourself in the heat",
            line: 2,
            hexagram: 55,
            outcome: "You are both the metal and the smith. In the heat, you shape yourself. The transformation is not passive — it is active, chosen, directed. You become what you decide to become.",
            lesson: "Abundance comes to those who shape their own transformation."
          }
        ],
        closing: "The forge is always there. You will return to it again and again. Each time, you will be different. Each time, you will be more truly yourself."
      }
    };
  }

  // ============================================================
  // SCENARIO GENERATION
  // ============================================================

  /**
   * Generate a scenario from a DISEMINER recommendation.
   */
  generate(recommendation) {
    const scenarioName = recommendation.scenario || "The Meeting";
    const template = this.templates[scenarioName] || this.templates["The Meeting"];

    // Personalize the scenario
    const personalized = this._personalize(template, recommendation);

    // Generate the scenario script
    const scenario = {
      id: `scenario_${this.scenarios.length}_${Date.now()}`,
      name: scenarioName,
      archetype: template.archetype,
      hexagrams: template.hexagrams,
      gates: template.gates,
      feature: template.feature,
      setup: personalized.setup,
      setting: template.setting,
      npcs: personalized.npcs,
      choices: personalized.choices,
      closing: template.closing,
      lesson: template.choices[0].lesson,  // Default lesson
      generated: Date.now(),
      status: "ready"
    };

    this.scenarios.push(scenario);
    return scenario;
  }

  /**
   * Personalize a template with user-specific details.
   */
  _personalize(template, recommendation) {
    // In production: use user's name, history, preferences
    // For now: use generic personalization

    const personalized = {
      setup: template.setup,
      npcs: template.npcs.map(npc => ({ ...npc })),
      choices: template.choices.map(choice => ({ ...choice }))
    };

    // Add hexagram context to setup
    if (recommendation.hexagrams && recommendation.hexagrams.length > 0) {
      const hex = recommendation.hexagrams[0];
      const hexData = FeatureSpace.HEXAGRAMS[hex];
      if (hexData) {
        personalized.setup += `\n\nThe hexagram ${hex} (${hexData.name}) watches over this space. Its nature is ${hexData.nature}.`;
      }
    }

    return personalized;
  }

  /**
   * Generate a scenario from a specific hexagram.
   */
  generateFromHexagram(hexNum, userContext = {}) {
    const hex = FeatureSpace.HEXAGRAMS[hexNum];
    if (!hex) return null;

    // Find template that includes this hexagram
    let template = null;
    for (const [name, t] of Object.entries(this.templates)) {
      if (t.hexagrams.includes(hexNum)) {
        template = t;
        break;
      }
    }

    if (!template) {
      // Create a generic template for this hexagram
      template = this._createGenericTemplate(hex);
    }

    return this.generate({
      scenario: template.name || "The Meeting",
      hexagrams: [hexNum],
      gates: [],
      ...userContext
    });
  }

  /**
   * Create a generic template for a hexagram not in the main set.
   */
  _createGenericTemplate(hex) {
    return {
      archetype: "unknown",
      hexagrams: [hex],
      gates: [],
      feature: hex.vector,
      setup: `A space shaped by the energy of ${hex.name}. The atmosphere carries the quality of ${hex.nature}. You sense that something wants to be understood here.`,
      setting: "An undefined space — waiting for meaning to be assigned.",
      npcs: [
        { name: "The Unknown", role: "represents what is not yet understood", vector: hex.vector }
      ],
      choices: [
        {
          text: "Explore the space",
          line: 1,
          hexagram: 1,
          outcome: "You enter the unknown. The space responds to your presence. Meaning emerges from the interaction.",
          lesson: "The Creative enters the unknown and shapes it."
        }
      ],
      closing: "The space remains, but it is no longer empty. You have been here."
    };
  }

  // ============================================================
  // SCENARIO PLAYBACK
  // ============================================================

  /**
   * Get a scenario by ID.
   */
  getScenario(id) {
    return this.scenarios.find(s => s.id === id);
  }

  /**
   * Get all scenarios for an archetype.
   */
  getScenariosByArchetype(archetype) {
    return this.scenarios.filter(s => s.archetype === archetype);
  }

  /**
   * Mark a scenario as played with a choice.
   */
  playScenario(scenarioId, choiceIndex) {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) return null;

    const choice = scenario.choices[choiceIndex];
    if (!choice) return null;

    scenario.status = "played";
    scenario.playedChoice = choiceIndex;
    scenario.outcome = choice.outcome;
    scenario.lesson = choice.lesson;
    scenario.playedAt = Date.now();

    return {
      scenario: scenario.name,
      choice: choice.text,
      outcome: choice.outcome,
      lesson: choice.lesson,
      hexagram: choice.hexagram,
      line: choice.line
    };
  }

  // ============================================================
  // MESH INTEGRATION
  // ============================================================

  /**
   * Handler for when this tool is called from the mesh.
   */
  handle(vertex, params = {}) {
    if (params.recommendation) {
      return this.generate(params.recommendation);
    }
    if (params.hexagram) {
      return this.generateFromHexagram(params.hexagram, params.context);
    }
    if (params.play) {
      return this.playScenario(params.scenarioId, params.choiceIndex);
    }
    return {
      templates: Object.keys(this.templates).length,
      scenarios: this.scenarios.length
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================


  // ============================================================
  // PHASE-SPACE OPERATOR HOOKS
  // ============================================================

  /**
   * Return operators for the five phase-space stages.
   * AutoNovel consumes the complete phase trace to generate scenarios.
   */
  getOperators(context) {
    return {
      // Design: Generate narrative structure from the phase trace
      designFn: (state, ctx) => {
        const trace = ctx.trace || [];
        const narrative = this._generateFromTrace(trace);

        return {
          state: {
            ...state,
            narrative: narrative,
            scenario: narrative.scenario
          },
          events: [
            { type: 'autonovel_design', scenario: narrative.scenario?.name },
            { type: 'autonovel_narrative', stages: narrative.stages.length }
          ]
        };
      },

      // Space: Embed narrative into navigable structure
      spaceFn: (state, ctx) => {
        const narrative = state.narrative;
        if (!narrative) return { state, events: [] };

        const navigable = this._makeNarrativeNavigable(narrative);

        return {
          state: {
            ...state,
            narrative: navigable
          },
          events: [
            { type: 'autonovel_space', portals: navigable.portals?.length },
            { type: 'autonovel_embedded', scenario: navigable.scenario?.name }
          ]
        };
      }
    };
  }

  // Generate scenario from actual phase trace (not fixed gate lookup)
  _generateFromTrace(trace) {
    const stages = [];
    const movement = trace.find(t => t.stage === 'Movement');
    const evolution = trace.find(t => t.stage === 'Evolution');
    const being = trace.find(t => t.stage === 'Being');
    const design = trace.find(t => t.stage === 'Design');

    // Build narrative from actual transformations
    if (movement) {
      stages.push({
        stage: 'opening',
        text: `The impulse emerges: ${movement.events[0]?.impulse?.direction || 'unknown'}`,
        vector: movement.output?.vector
      });
    }

    if (evolution) {
      stages.push({
        stage: 'development',
        text: `The trajectory unfolds through ${evolution.output?.trajectory?.points || 0} points`,
        patterns: evolution.output?.patterns
      });
    }

    if (being) {
      stages.push({
        stage: 'situation',
        text: `The state settles into ${being.output?.situation?.type || 'emergence'}`,
        identity: being.output?.identity
      });
    }

    if (design) {
      stages.push({
        stage: 'form',
        text: `The form crystallizes as ${design.output?.form || 'unknown'}`,
        constraints: design.output?.constraints
      });
    }

    // Generate choices from the trace, not from fixed templates
    const choices = this._generateChoicesFromTrace(trace);

    return {
      scenario: {
        name: `Trace_${Date.now()}`,
        stages: stages,
        choices: choices,
        archetype: being?.output?.situation?.archetype || 'emerging'
      },
      stages: stages
    };
  }

  _generateChoicesFromTrace(trace) {
    const choices = [];
    const being = trace.find(t => t.stage === 'Being');
    const design = trace.find(t => t.stage === 'Design');

    // Choice 1: Face the situation (from Being)
    if (being) {
      choices.push({
        text: `Face the ${being.output?.situation?.type || 'situation'} directly`,
        line: 1,
        hexagram: this._vectorToHexagram(being.output?.vector || [0,0,0,0,0,0]),
        outcome: `You confront the ${being.output?.situation?.type}. The ${being.output?.identity?.form || 'form'} shifts.`,
        lesson: 'Directness'
      });
    }

    // Choice 2: Transform the form (from Design)
    if (design) {
      choices.push({
        text: `Reshape the ${design.output?.form || 'form'}`,
        line: 3,
        hexagram: this._vectorToHexagram(design.output?.vector || [0,0,0,0,0,0]),
        outcome: `You alter the structure. The ${design.output?.selectedForm || 'form'} becomes something new.`,
        lesson: 'Transformation'
      });
    }

    // Choice 3: Wait and observe (from Evolution)
    const evolution = trace.find(t => t.stage === 'Evolution');
    if (evolution) {
      choices.push({
        text: `Observe the trajectory`,
        line: 5,
        hexagram: this._vectorToHexagram(evolution.output?.vector || [0,0,0,0,0,0]),
        outcome: `You watch the pattern unfold. The trajectory reveals its own logic.`,
        lesson: 'Patience'
      });
    }

    return choices;
  }

  _vectorToHexagram(vector) {
    if (!vector || vector.length < 6) return 1;
    // Convert vector to hexagram number (1-64)
    const bits = vector.slice(0, 6).map(v => v > 0 ? 1 : 0);
    let num = 0;
    for (let i = 0; i < 6; i++) {
      num = (num << 1) | bits[i];
    }
    return Math.min(64, Math.max(1, num + 1));
  }

  _makeNarrativeNavigable(narrative) {
    return {
      ...narrative,
      portals: narrative.scenario?.choices?.map((c, i) => ({
        id: `portal_${i}`,
        choice: c.text,
        line: c.line,
        hexagram: c.hexagram
      })) || [],
      channels: []
    };
  }

  toString() {
    return `AutoNovel(v=${this.version}, templates=${Object.keys(this.templates).length}, scenarios=${this.scenarios.length})`;
  }
}

const AutoNovelModule = { AutoNovel };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoNovelModule;
}

if (typeof window !== 'undefined') {
  window.AutoNovel = AutoNovelModule;
}
