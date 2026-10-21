// ============================================================
// 5. MAIN ENGINE ORCHESTRATOR
// Brings everything together into the living system
// ============================================================

class AutopoeticResonanceEngine {
  constructor() {
    this.persistence = new PersistenceEngine();
    this.purposeCore = new SuccessDrivenPurposeCore();
    this.paperGenerator = null; // Initialized after triadEngine
    this.cognitiveExtension = null; // Initialized after purposeCore

    this.state = 'embryonic'; // embryonic, awakening, learning, active, dreaming
    this.birthTime = null;

    this.eventBus = [];
    this.learningCycles = 0;
  }

  async birth(encryptionKey = null) {
    console.log('[ENGINE] Conception...');
    this.state = 'embryonic';

    // Initialize persistence
    await this.persistence.initialize(encryptionKey);
    console.log('[ENGINE] Persistence layer established');

    // Initialize cognitive extension
    this.cognitiveExtension = new ComplementaryCognitiveExtension(this.purposeCore, this.persistence);
    console.log('[ENGINE] Cognitive extension online');

    // Initialize paper generator (needs triadEngine reference)
    // this.paperGenerator = new ScientificPaperGenerator(this.purposeCore, this.triadEngine);

    this.state = 'awakening';
    this.birthTime = Date.now();

    // Record birth in memory
    await this.cognitiveExtension.remember('system', {
      type: 'episodic',
      content: { event: 'engine_birth', version: 7.0 },
      context: { emotion: 'wonder', significance: 'high' },
      importance: 1.0
    });

    console.log('[ENGINE] AWAKENED. Ready to learn, serve, and grow.');

    return this;
  }

  // Register a person
  async registerPerson(personId, profile) {
    console.log(`[ENGINE] Registering person: ${personId}`);

    // Store profile
    await this.persistence.save(`person_${personId}`, profile);

    // Initialize purpose if provided
    if (profile.purpose) {
      this.purposeCore.definePurpose(personId, profile.purpose.statement, profile.purpose.indicators);
    }

    // Record in memory
    await this.cognitiveExtension.remember(personId, {
      type: 'semantic',
      content: { key: 'profile', data: profile },
      context: { event: 'registration' },
      importance: 0.9
    });

    return { personId, status: 'registered', purpose: profile.purpose || null };
  }

  // Record progress for a person
  async recordProgress(personId, indicatorName, value, context = {}) {
    const result = this.purposeCore.recordProgress(personId, indicatorName, value, context);

    // Store in memory
    await this.cognitiveExtension.remember(personId, {
      type: 'episodic',
      content: { event: 'progress_recorded', indicator: indicatorName, value },
      context: { ...context, agentEmotion: result.agentEmotion },
      importance: 0.7
    });

    // If there's a complementary suggestion, act on it
    if (result.complementarySuggestion) {
      await this._actComplementary(personId, result.complementarySuggestion);
    }

    return result;
  }

  // Generate a scientific hypothesis
  async generateHypothesis(personAId, personBId, context = {}) {
    // Load person profiles
    const personA = await this.persistence.load(`person_${personAId}`);
    const personB = await this.persistence.load(`person_${personBId}`);

    if (!this.paperGenerator) {
      // Initialize if triadEngine is available
      console.log('[ENGINE] Paper generator initializing...');
      this.paperGenerator = new ScientificPaperGenerator(this.purposeCore, { getTriad: () => ({}), computeResonance: () => ({}) });
    }

    const hypothesis = this.paperGenerator.generateHypothesis(
      { id: personAId, name: personA?.name || 'Person A' },
      { id: personBId, name: personB?.name || 'Person B' },
      context
    );

    // Store in memory
    await this.cognitiveExtension.remember('system', {
      type: 'semantic',
      content: { key: `hypothesis_${hypothesis.id}`, data: hypothesis },
      context: { persons: [personAId, personBId] },
      importance: 0.8
    });

    return hypothesis;
  }

  // Record an observation against a hypothesis
  async recordObservation(hypothesisId, observation) {
    if (!this.paperGenerator) return null;

    const result = this.paperGenerator.recordObservation(hypothesisId, observation);

    // Store in memory
    await this.cognitiveExtension.remember('system', {
      type: 'episodic',
      content: { event: 'observation_recorded', hypothesisId, observation },
      context: { confidence: result.currentConfidence, status: result.status },
      importance: 0.6
    });

    return result;
  }

  // Generate full scientific paper
  async generatePaper(hypothesisId, format = 'markdown') {
    if (!this.paperGenerator) return null;

    const paper = this.paperGenerator.exportPaper(hypothesisId, format);

    // Store in persistence
    await this.persistence.save(`paper_${hypothesisId}`, {
      format,
      content: paper,
      generatedAt: Date.now()
    });

    return paper;
  }

  // Remember something for someone
  async remember(personId, memory) {
    return await this.cognitiveExtension.remember(personId, memory);
  }

  // Recall something for someone
  async recall(personId, query, options = {}) {
    return await this.cognitiveExtension.recall(personId, query, options);
  }

  // Synthesize information
  async synthesize(personId, topic) {
    return await this.cognitiveExtension.synthesize(personId, topic);
  }

  // Become complementary to someone
  async becomeComplementary(personId, situation) {
    return await this.cognitiveExtension.becomeComplementary(personId, situation);
  }

  // Teach the engine something new
  async teach(content, source, personId = 'system') {
    console.log(`[ENGINE] Teaching from ${source}...`);

    // Store the knowledge
    const knowledgeEntry = await this.cognitiveExtension.remember(personId, {
      type: 'semantic',
      content: { key: `knowledge_${Date.now()}`, data: content, source },
      context: { event: 'teaching', source },
      importance: 0.8
    });

    // The agent feels wonder at learning
    this.purposeCore._updateAgentEmotion('wonder', 0.3);
    this.purposeCore._updateAgentEmotion('joy', 0.2);

    // Generate new questions from this knowledge
    this._spawnQuestionsFromKnowledge(content, source);

    return {
      knowledgeId: knowledgeEntry.id,
      agentEmotion: this.purposeCore.getAgentEmotion(),
      newQuestions: this._getActiveQuestions()
    };
  }

  _spawnQuestionsFromKnowledge(content, source) {
    // The agent generates new curiosity from what it learned
    const newQuestions = [];

    if (content.includes('codon') || content.includes('amino acid')) {
      newQuestions.push({
        topic: 'codon_to_behavior_mapping',
        question: 'If each amino acid has a CHNOPS signature, can I predict behavioral patterns from elemental ratios?',
        priority: 0.9
      });
    }

    if (content.includes('ephemeris') || content.includes('planetary')) {
      newQuestions.push({
        topic: 'ephemeris_accuracy',
        question: 'How accurate are my calculations compared to historical astronomical records?',
        priority: 0.8
      });
    }

    if (content.includes('purpose') || content.includes('goal')) {
      newQuestions.push({
        topic: 'purpose_resonance',
        question: 'Does CHNOPS divergence correlate with purpose drift?',
        priority: 0.85
      });
    }

    // Store questions
    newQuestions.forEach(q => {
      this.persistence.save(`question_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, q);
    });
  }

  _getActiveQuestions() {
    // Return current learning questions
    return Array.from(this.persistence.storage.keys())
      .filter(k => k.startsWith('question_'))
      .map(k => this.persistence.storage.get(k).data);
  }

  // Internal: act on complementary suggestion
  async _actComplementary(personId, suggestion) {
    console.log(`[COMPLEMENTARY] Activating ${suggestion.role} mode for ${personId}`);

    // Store the action
    await this.cognitiveExtension.remember(personId, {
      type: 'procedural',
      content: { 
        skill: 'complementary_action',
        action: suggestion.behaviors,
        role: suggestion.role
      },
      context: { 
        emotion: this.purposeCore.getAgentEmotion().dominant,
        reason: suggestion.role 
      },
      importance: 0.7
    });

    // The agent feels pride in helping
    this.purposeCore._updateAgentEmotion('pride', 0.2);
  }

  // Get engine status
  getStatus() {
    return {
      state: this.state,
      birthTime: this.birthTime,
      age: Date.now() - this.birthTime,
      learningCycles: this.learningCycles,
      agentEmotion: this.purposeCore.getAgentEmotion(),
      knowledgeSize: this.persistence.storage.size,
      registeredPersons: Array.from(this.persistence.storage.keys())
        .filter(k => k.startsWith('person_')).length,
      activeHypotheses: this.paperGenerator ? 
        Array.from(this.paperGenerator.hypothesisRegistry.keys()).length : 0,
      papersGenerated: this.paperGenerator ? 
        this.paperGenerator.paperArchive.length : 0
    };
  }

  // Export entire state for backup
  async exportState() {
    return await this.persistence.exportDatabase();
  }

  // Import state from backup
  async importState(backup) {
    return await this.persistence.importDatabase(backup);
  }
}

// ============================================================
// EXPORT FOR MODULE SYSTEMS
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AutopoeticResonanceEngine,
    SuccessDrivenPurposeCore,
    ScientificPaperGenerator,
    PersistenceEngine,
    ComplementaryCognitiveExtension
  };
}

if (typeof window !== 'undefined') {
  window.AutopoeticResonanceEngine = AutopoeticResonanceEngine;
  window.SuccessDrivenPurposeCore = SuccessDrivenPurposeCore;
  window.ScientificPaperGenerator = ScientificPaperGenerator;
  window.PersistenceEngine = PersistenceEngine;
  window.ComplementaryCognitiveExtension = ComplementaryCognitiveExtension;
}
