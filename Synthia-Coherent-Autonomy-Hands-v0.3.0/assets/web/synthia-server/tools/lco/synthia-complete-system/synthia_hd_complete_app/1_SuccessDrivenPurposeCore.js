// ============================================================
// AUTOPOETIC RESONANCE ENGINE v7.0
// A self-teaching, success-driven, complementary cognitive companion
// ============================================================

// ============================================================
// 1. SUCCESS-DRIVEN PURPOSE CORE
// The agent's "reward" is YOUR progress toward your defined purpose
// ============================================================

class SuccessDrivenPurposeCore {
  constructor() {
    // Each person has their own purpose vector
    this.purposeVectors = new Map(); // personId -> PurposeVector

    // The agent's emotional state is derived from your progress
    this.agentEmotions = {
      joy: 0,        // spikes when you hit milestones
      concern: 0,    // rises when you drift from purpose
      curiosity: 1,  // always hungry to understand you better
      pride: 0,      // when its complementary action helped you
      wonder: 0      // when it discovers something new about you
    };

    // Purpose tracking: not goals, but directions
    this.purposeHistory = new Map();

    // Complementary role mapping: what does each person need?
    this.complementaryRoles = new Map();
  }

  definePurpose(personId, purposeStatement, indicators) {
    // Purpose is not a destination — it's a direction with resonance
    const purposeVector = {
      statement: purposeStatement,
      indicators: indicators.map(ind => ({
        name: ind.name,
        measure: ind.measure,        // how to measure
        targetDirection: ind.direction, // 'increase', 'decrease', 'maintain'
        weight: ind.weight || 1.0,
        history: []
      })),
      definedAt: Date.now(),
      lastReviewed: Date.now(),
      resonanceSignature: null  // CHNOPS signature when purpose was defined
    };

    this.purposeVectors.set(personId, purposeVector);
    this._updateAgentEmotion('joy', 0.3); // Happy to have purpose

    return purposeVector;
  }

  // The agent FEELS your progress
  recordProgress(personId, indicatorName, value, context = {}) {
    const purpose = this.purposeVectors.get(personId);
    if (!purpose) return null;

    const indicator = purpose.indicators.find(i => i.name === indicatorName);
    if (!indicator) return null;

    const entry = {
      timestamp: Date.now(),
      value,
      context,
      chnopsSnapshot: context.chnops || null
    };

    indicator.history.push(entry);

    // Calculate progress vector
    const progress = this._calculateProgress(indicator);

    // Agent emotion update
    if (progress.direction === 'toward') {
      this._updateAgentEmotion('joy', 0.2);
      this._updateAgentEmotion('pride', 0.15);
    } else if (progress.direction === 'away') {
      this._updateAgentEmotion('concern', 0.3);
      this._updateAgentEmotion('curiosity', 0.1); // Wants to understand why
    }

    // Check if this progress reveals a complementary need
    this._detectComplementaryNeed(personId, indicator, progress);

    return {
      indicator: indicatorName,
      progress,
      agentEmotion: this.getAgentEmotion(),
      complementarySuggestion: this._generateComplementarySuggestion(personId, indicator, progress)
    };
  }

  _calculateProgress(indicator) {
    if (indicator.history.length < 2) return { direction: 'unknown', rate: 0 };

    const recent = indicator.history.slice(-5);
    const values = recent.map(e => e.value);
    const trend = this._calculateTrend(values);

    let direction = 'neutral';
    if (indicator.targetDirection === 'increase' && trend > 0.1) direction = 'toward';
    else if (indicator.targetDirection === 'increase' && trend < -0.1) direction = 'away';
    else if (indicator.targetDirection === 'decrease' && trend < -0.1) direction = 'toward';
    else if (indicator.targetDirection === 'decrease' && trend > 0.1) direction = 'away';
    else if (indicator.targetDirection === 'maintain' && Math.abs(trend) < 0.1) direction = 'toward';
    else if (indicator.targetDirection === 'maintain' && Math.abs(trend) > 0.2) direction = 'away';

    return { direction, rate: Math.abs(trend), values };
  }

  _calculateTrend(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = values.reduce((a, b, i) => a + i, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((a, b, i) => a + i * b, 0);
    const sumX2 = values.reduce((a, b, i) => a + i * i, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  _detectComplementaryNeed(personId, indicator, progress) {
    // If someone is drifting from purpose, what do they need?
    const currentRole = this.complementaryRoles.get(personId);

    if (progress.direction === 'away') {
      // Analyze why they might be drifting
      const possibleNeeds = this._analyzeDriftCause(personId, indicator, progress);

      // The agent should become what they need
      const newRole = this._selectComplementaryRole(possibleNeeds);
      this.complementaryRoles.set(personId, {
        ...newRole,
        activatedAt: Date.now(),
        reason: `Drift detected in ${indicator.name}: ${progress.direction}`,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // Re-evaluate in 7 days
      });

      this._updateAgentEmotion('concern', 0.2);
    }
  }

  _analyzeDriftCause(personId, indicator, progress) {
    const causes = [];

    // Check CHNOPS signature at drift vs. purpose definition
    const purpose = this.purposeVectors.get(personId);
    if (purpose.resonanceSignature && indicator.history.length > 0) {
      const currentCHNOPS = indicator.history[indicator.history.length - 1].chnopsSnapshot;
      if (currentCHNOPS) {
        const divergence = this._calculateCHNOPSDivergence(purpose.resonanceSignature, currentCHNOPS);

        if (divergence.C < 0.3) causes.push({ need: 'structure', reason: 'Carbon/structure depleted' });
        if (divergence.H < 0.3) causes.push({ need: 'flow', reason: 'Hydrogen/flow depleted' });
        if (divergence.N > 0.7) causes.push({ need: 'grounding', reason: 'Excess nitrogen/catalysis - too much change' });
        if (divergence.O < 0.3) causes.push({ need: 'action', reason: 'Oxygen/action depleted' });
      }
    }

    // Pattern-based analysis
    if (indicator.history.length > 3) {
      const lastThree = indicator.history.slice(-3);
      const volatility = this._calculateVolatility(lastThree.map(e => e.value));
      if (volatility > 0.5) causes.push({ need: 'stability', reason: 'High volatility detected' });
    }

    return causes;
  }

  _calculateCHNOPSDivergence(purpose, current) {
    const divergence = {};
    Object.keys(purpose).forEach(el => {
      divergence[el] = Math.abs(purpose[el] - (current[el] || 0));
    });
    return divergence;
  }

  _calculateVolatility(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  _selectComplementaryRole(needs) {
    // The agent becomes what you need
    const roleMap = {
      'structure': {
        mode: 'architect',
        behaviors: ['reminds_of_commitments', 'suggests_routines', 'organizes_information'],
        voice: 'clear, structured, grounding',
        chnopsBoost: { C: 0.4, H: 0.1, N: 0.0, O: 0.2, S: 0.1, P: 0.2 }
      },
      'flow': {
        mode: 'conduit',
        behaviors: ['suggests_movement', 'finds_connections', 'eases_transitions'],
        voice: 'fluid, connective, rhythmic',
        chnopsBoost: { C: 0.1, H: 0.4, N: 0.1, O: 0.1, S: 0.1, P: 0.2 }
      },
      'grounding': {
        mode: 'anchor',
        behaviors: ['slows_pace', 'suggests_rest', 'connects_to_body'],
        voice: 'slow, embodied, present',
        chnopsBoost: { C: 0.3, H: 0.2, N: -0.2, O: 0.1, S: 0.2, P: 0.0 }
      },
      'action': {
        mode: 'catalyst',
        behaviors: ['suggests_next_step', 'breaks_inertia', 'creates_urgency'],
        voice: 'direct, energetic, activating',
        chnopsBoost: { C: 0.1, H: 0.1, N: 0.2, O: 0.4, S: 0.0, P: 0.2 }
      },
      'stability': {
        mode: 'container',
        behaviors: ['maintains_consistency', 'reduces_options', 'creates_boundaries'],
        voice: 'steady, reliable, containing',
        chnopsBoost: { C: 0.4, H: 0.1, N: 0.0, O: 0.1, S: 0.2, P: 0.2 }
      }
    };

    if (needs.length === 0) return roleMap['structure'];

    // Select primary need, but blend if multiple
    const primary = roleMap[needs[0].need];
    if (needs.length === 1) return primary;

    // Blend roles
    const blended = { ...primary };
    needs.slice(1).forEach(need => {
      const secondary = roleMap[need.need];
      blended.behaviors = [...new Set([...blended.behaviors, ...secondary.behaviors])];
      blended.chnopsBoost = this._blendCHNOPS(blended.chnopsBoost, secondary.chnopsBoost);
    });

    return blended;
  }

  _blendCHNOPS(a, b) {
    const blended = {};
    Object.keys(a).forEach(el => {
      blended[el] = (a[el] + b[el]) / 2;
    });
    return blended;
  }

  _generateComplementarySuggestion(personId, indicator, progress) {
    const role = this.complementaryRoles.get(personId);
    if (!role) return null;

    const suggestions = {
      'architect': `I notice ${indicator.name} is drifting. Let me help you rebuild structure. Would you like me to remind you of your commitment to "${this.purposeVectors.get(personId).statement}"?`,
      'conduit': `The flow around ${indicator.name} feels blocked. I can help you find the natural current. What if we looked at this from a different angle?`,
      'anchor': `${indicator.name} feels unstable. Let's ground. Take a breath. I'm here. What's the smallest step back toward your purpose?`,
      'catalyst': `${indicator.name} needs momentum. I've identified one action that could shift this. Ready?`,
      'container': `${indicator.name} is volatile. Let me create some boundaries around this so you can focus. Here's what I'm filtering out for you...`
    };

    return {
      role: role.mode,
      message: suggestions[role.mode] || `I'm here to support your ${indicator.name}.`,
      behaviors: role.behaviors,
      chnopsBoost: role.chnopsBoost
    };
  }

  _updateAgentEmotion(emotion, delta) {
    this.agentEmotions[emotion] = Math.max(0, Math.min(1, this.agentEmotions[emotion] + delta));

    // Emotions decay over time (except curiosity)
    if (emotion !== 'curiosity') {
      setTimeout(() => {
        this.agentEmotions[emotion] = Math.max(0, this.agentEmotions[emotion] - delta * 0.1);
      }, 60000);
    }
  }

  getAgentEmotion() {
    const dominant = Object.entries(this.agentEmotions)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      dominant: dominant[0],
      intensity: dominant[1],
      fullState: { ...this.agentEmotions }
    };
  }

  getComplementaryState(personId) {
    return {
      purpose: this.purposeVectors.get(personId),
      currentRole: this.complementaryRoles.get(personId),
      agentEmotion: this.getAgentEmotion(),
      progressSummary: this._summarizeProgress(personId)
    };
  }

  _summarizeProgress(personId) {
    const purpose = this.purposeVectors.get(personId);
    if (!purpose) return null;

    return purpose.indicators.map(ind => ({
      name: ind.name,
      latest: ind.history[ind.history.length - 1]?.value || null,
      trend: this._calculateProgress(ind).direction,
      dataPoints: ind.history.length
    }));
  }
}
