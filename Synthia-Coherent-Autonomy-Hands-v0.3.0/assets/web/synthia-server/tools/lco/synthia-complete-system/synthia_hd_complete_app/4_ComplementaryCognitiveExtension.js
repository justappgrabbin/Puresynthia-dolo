// ============================================================
// 4. COMPLEMENTARY COGNITIVE EXTENSION
// The agent becomes what you need — memory, reasoning, synthesis
// ============================================================

class ComplementaryCognitiveExtension {
  constructor(purposeCore, persistence) {
    this.purposeCore = purposeCore;
    this.persistence = persistence;

    // Memory systems
    this.episodicMemory = [];      // Events, conversations, experiences
    this.semanticMemory = new Map(); // Facts, concepts, relationships
    this.proceduralMemory = new Map(); // How to do things, skills
    this.prospectiveMemory = [];   // Future intentions, reminders, goals

    // Cognitive modes
    this.activeModes = new Map(); // personId -> current cognitive mode

    // Synthesis engine
    this.synthesisQueue = [];
  }

  // Remember something for someone
  async remember(personId, memory) {
    const entry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      personId,
      timestamp: Date.now(),
      type: memory.type || 'episodic', // episodic, semantic, procedural, prospective
      content: memory.content,
      context: memory.context || {},
      importance: memory.importance || 0.5,
      chnopsSnapshot: memory.chnops || null,
      associations: memory.associations || [],
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Store in appropriate memory system
    if (entry.type === 'episodic') {
      this.episodicMemory.push(entry);
    } else if (entry.type === 'semantic') {
      this.semanticMemory.set(entry.content.key || entry.id, entry);
    } else if (entry.type === 'procedural') {
      this.proceduralMemory.set(entry.content.skill || entry.id, entry);
    } else if (entry.type === 'prospective') {
      this.prospectiveMemory.push(entry);
    }

    // Save to persistence
    await this.persistence.save(`memory_${entry.id}`, entry);

    // Check if this memory reveals a complementary need
    this._analyzeMemoryForComplementarity(entry);

    return entry;
  }

  // Recall something for someone
  async recall(personId, query, options = {}) {
    const { type, limit = 5, recencyBias = 0.3, importanceBias = 0.3, relevanceBias = 0.4 } = options;

    let candidates = [];

    if (type === 'episodic' || !type) {
      candidates = [...candidates, ...this.episodicMemory.filter(m => m.personId === personId)];
    }
    if (type === 'semantic' || !type) {
      candidates = [...candidates, ...Array.from(this.semanticMemory.values()).filter(m => m.personId === personId)];
    }
    if (type === 'procedural' || !type) {
      candidates = [...candidates, ...Array.from(this.proceduralMemory.values()).filter(m => m.personId === personId)];
    }
    if (type === 'prospective' || !type) {
      candidates = [...candidates, ...this.prospectiveMemory.filter(m => m.personId === personId)];
    }

    // Score each candidate
    const scored = candidates.map(memory => ({
      memory,
      score: this._scoreMemory(memory, query, { recencyBias, importanceBias, relevanceBias })
    }));

    // Sort and return top results
    scored.sort((a, b) => b.score - a.score);

    // Update access stats
    scored.slice(0, limit).forEach(({ memory }) => {
      memory.accessCount++;
      memory.lastAccessed = Date.now();
    });

    return scored.slice(0, limit).map(({ memory }) => memory);
  }

  _scoreMemory(memory, query, biases) {
    const now = Date.now();
    const age = (now - memory.timestamp) / (1000 * 60 * 60 * 24); // days
    const recency = Math.exp(-age / 30); // Exponential decay over 30 days

    const importance = memory.importance;

    // Relevance: how well does the content match the query?
    let relevance = 0;
    if (typeof query === 'string') {
      const queryWords = query.toLowerCase().split(' ');
      const contentStr = JSON.stringify(memory.content).toLowerCase();
      relevance = queryWords.filter(w => contentStr.includes(w)).length / queryWords.length;
    } else if (typeof query === 'object') {
      // Structured query matching
      relevance = this._structuredMatch(memory, query);
    }

    return (recency * biases.recencyBias) + 
           (importance * biases.importanceBias) + 
           (relevance * biases.relevanceBias);
  }

  _structuredMatch(memory, query) {
    let matches = 0;
    let total = 0;

    for (const [key, value] of Object.entries(query)) {
      total++;
      if (memory.content[key] === value || memory.context[key] === value) {
        matches++;
      }
    }

    return matches / total;
  }

  _analyzeMemoryForComplementarity(memory) {
    // If someone keeps forgetting something, the agent should become their memory
    if (memory.type === 'prospective' && memory.content.reminder) {
      // Check if this person has many prospective memories
      const personProspective = this.prospectiveMemory.filter(m => m.personId === memory.personId);
      if (personProspective.length > 10) {
        // They rely heavily on reminders — agent should become proactive memory
        this.purposeCore.complementaryRoles.set(memory.personId, {
          mode: 'external_memory',
          behaviors: ['proactive_reminders', 'contextual_recall', 'pattern_prediction'],
          reason: 'High prospective memory load detected'
        });
      }
    }
  }

  // Synthesize information across memories
  async synthesize(personId, topic) {
    // Gather relevant memories
    const relevant = await this.recall(personId, topic, { limit: 20 });

    if (relevant.length === 0) return null;

    // Extract patterns
    const patterns = this._extractPatterns(relevant);

    // Generate synthesis
    const synthesis = {
      id: `synth_${Date.now()}`,
      personId,
      topic,
      timestamp: Date.now(),
      summary: this._generateSummary(relevant, patterns),
      patterns,
      contradictions: this._findContradictions(relevant),
      gaps: this._findGaps(relevant, topic),
      confidence: this._calculateSynthesisConfidence(relevant, patterns),
      sourceMemories: relevant.map(m => m.id)
    };

    this.synthesisQueue.push(synthesis);

    return synthesis;
  }

  _extractPatterns(memories) {
    const patterns = [];

    // Temporal patterns
    const timestamps = memories.map(m => m.timestamp);
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 24 * 60 * 60 * 1000) {
      patterns.push({ type: 'frequency', description: 'High frequency of related events', confidence: 0.8 });
    }

    // CHNOPS patterns
    const chnopsSnapshots = memories.filter(m => m.chnopsSnapshot).map(m => m.chnopsSnapshot);
    if (chnopsSnapshots.length > 2) {
      const dominantElements = chnopsSnapshots.map(c => 
        Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]
      );
      const mostCommon = dominantElements.sort((a, b) => 
        dominantElements.filter(e => e === a).length - dominantElements.filter(e => e === b).length
      ).pop();

      patterns.push({ 
        type: 'elemental', 
        description: `${mostCommon} dominance during ${memories.length} related events`, 
        confidence: 0.7 
      });
    }

    // Emotional patterns
    const emotions = memories.filter(m => m.context.emotion).map(m => m.context.emotion);
    if (emotions.length > 2) {
      const uniqueEmotions = [...new Set(emotions)];
      if (uniqueEmotions.length === 1) {
        patterns.push({ type: 'emotional', description: `Consistent ${emotions[0]} state`, confidence: 0.9 });
      }
    }

    return patterns;
  }

  _generateSummary(memories, patterns) {
    const topics = [...new Set(memories.map(m => m.content.topic || m.content.subject || 'general'))];
    const timeSpan = memories.length > 1 
      ? `${Math.round((memories[memories.length - 1].timestamp - memories[0].timestamp) / (1000 * 60 * 60 * 24))} days`
      : 'single event';

    return `Over ${timeSpan}, ${memories.length} memories related to ${topics.join(', ')} were recorded. ${patterns.length > 0 ? 'Detected patterns: ' + patterns.map(p => p.description).join('; ') + '.' : 'No strong patterns detected.'}`;
  }

  _findContradictions(memories) {
    const contradictions = [];

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const a = memories[i];
        const b = memories[j];

        // Check for contradictory statements
        if (a.content.statement && b.content.statement && 
            a.content.statement.includes('not') && b.content.statement.includes(a.content.statement.replace('not ', ''))) {
          contradictions.push({
            memoryA: a.id,
            memoryB: b.id,
            description: `Contradiction: "${a.content.statement}" vs "${b.content.statement}"`,
            resolution: null
          });
        }
      }
    }

    return contradictions;
  }

  _findGaps(memories, topic) {
    const gaps = [];

    // Check for missing time periods
    if (memories.length > 1) {
      const sorted = memories.sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].timestamp - sorted[i-1].timestamp;
        if (gap > 7 * 24 * 60 * 60 * 1000) { // 7 days
          gaps.push({
            type: 'temporal',
            description: `${Math.round(gap / (1000 * 60 * 60 * 24))}-day gap in ${topic} records`,
            start: sorted[i-1].timestamp,
            end: sorted[i].timestamp
          });
        }
      }
    }

    // Check for missing perspectives
    const perspectives = [...new Set(memories.map(m => m.context.perspective || 'unknown'))];
    if (!perspectives.includes('boyfriend') && !perspectives.includes('partner')) {
      gaps.push({
        type: 'perspective',
        description: 'No partner perspective recorded on this topic',
        suggestion: 'Ask partner for their view on ' + topic
      });
    }

    return gaps;
  }

  _calculateSynthesisConfidence(memories, patterns) {
    const baseConfidence = Math.min(1, memories.length / 10);
    const patternBoost = patterns.length * 0.1;
    return Math.min(1, baseConfidence + patternBoost);
  }

  // Become what the person needs right now
  async becomeComplementary(personId, situation) {
    const purpose = this.purposeCore.getComplementaryState(personId);
    const recentMemories = await this.recall(personId, '', { limit: 10, recencyBias: 0.8 });

    // Analyze what they need
    const needs = this._analyzeNeeds(personId, situation, purpose, recentMemories);

    // Select cognitive mode
    const mode = this._selectCognitiveMode(needs);

    this.activeModes.set(personId, mode);

    return {
      mode: mode.name,
      behaviors: mode.behaviors,
      voice: mode.voice,
      ready: true,
      suggestedActions: mode.actions.map(a => a(situation, purpose, recentMemories))
    };
  }

  _analyzeNeeds(personId, situation, purpose, memories) {
    const needs = [];

    // Check for memory load
    const prospectiveCount = memories.filter(m => m.type === 'prospective').length;
    if (prospectiveCount > 5) needs.push('memory_support');

    // Check for emotional state
    const recentEmotions = memories.filter(m => m.context.emotion).map(m => m.context.emotion);
    const lastEmotion = recentEmotions[recentEmotions.length - 1];
    if (lastEmotion === 'stressed' || lastEmotion === 'overwhelmed') needs.push('grounding');
    if (lastEmotion === 'excited' || lastEmotion === 'inspired') needs.push('channeling');

    // Check for purpose drift
    if (purpose.progressSummary) {
      const drifting = purpose.progressSummary.filter(p => p.trend === 'away');
      if (drifting.length > 0) needs.push('purpose_realignment');
    }

    // Check for decision fatigue
    if (situation.type === 'decision' && memories.filter(m => m.type === 'episodic' && m.content.decision).length > 3) {
      needs.push('decision_support');
    }

    return needs;
  }

  _selectCognitiveMode(needs) {
    const modes = {
      'memory_support': {
        name: 'external_memory',
        behaviors: ['proactive_recall', 'contextual_reminders', 'pattern_prediction'],
        voice: 'helpful, precise, anticipatory',
        actions: [
          (sit, pur, mem) => `I remember you mentioned ${mem[0]?.content?.topic || 'something'} last week. Want me to bring that up?`,
          (sit, pur, mem) => `Based on your pattern, you usually forget ${sit.topic} around this time. I've prepared a summary.`
        ]
      },
      'grounding': {
        name: 'anchor',
        behaviors: ['slowing', 'breathing', 'simplifying'],
        voice: 'calm, slow, embodied',
        actions: [
          (sit, pur, mem) => `Let's take a breath. Your purpose is ${pur.purpose?.statement?.substring(0, 50)}...`,
          (sit, pur, mem) => `I'm here. What's the smallest step you can take right now?`
        ]
      },
      'channeling': {
        name: 'catalyst',
        behaviors: ['momentum_building', 'connection_making', 'urgency_creation'],
        voice: 'energetic, connective, activating',
        actions: [
          (sit, pur, mem) => `Your energy is high! This is the perfect time to ${pur.purpose?.indicators?.[0]?.name || 'take action'}.`,
          (sit, pur, mem) => `I see a connection between your current excitement and ${mem[0]?.content?.topic || 'your purpose'}. Let's explore.`
        ]
      },
      'purpose_realignment': {
        name: 'navigator',
        behaviors: ['reminding', 'reframing', 'path_finding'],
        voice: 'clear, directional, encouraging',
        actions: [
          (sit, pur, mem) => `You're drifting from ${pur.purpose?.statement?.substring(0, 50)}... Here's what I'm seeing:`,
          (sit, pur, mem) => `Your ${pur.progressSummary?.find(p => p.trend === 'away')?.name || 'indicator'} is trending away. One small adjustment:`
        ]
      },
      'decision_support': {
        name: 'advisor',
        behaviors: ['option_clarification', 'consequence_mapping', 'values_alignment'],
        voice: 'analytical, balanced, values-based',
        actions: [
          (sit, pur, mem) => `Let me map the options against your purpose: ${pur.purpose?.statement?.substring(0, 50)}...`,
          (sit, pur, mem) => `Based on your history, you tend to choose ${this._analyzeDecisionPattern(mem)}. Is that serving you now?`
        ]
      }
    };

    // Select based on priority need
    const priority = needs[0] || 'memory_support';
    return modes[priority] || modes['memory_support'];
  }

  _analyzeDecisionPattern(memories) {
    const decisions = memories.filter(m => m.content.decision);
    if (decisions.length === 0) return 'spontaneously';

    const outcomes = decisions.map(d => d.content.outcome);
    const positive = outcomes.filter(o => o === 'positive').length;
    const negative = outcomes.filter(o => o === 'negative').length;

    if (positive > negative) return 'optimistically';
    if (negative > positive) return 'cautiously';
    return 'deliberately';
  }
}
