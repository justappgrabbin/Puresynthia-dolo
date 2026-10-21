// SYNTACTIC DEPENDENCE: Discourse Coherence
// Maps syntactic dependencies and discourse structure

const SYNTACTIC_DEPEND = {
  name: 'SyntacticDepend',
  description: 'Discourse coherence through syntactic dependency mapping',

  process(signal, gateA, gateB, state) {
    const coherence = this.mapCoherence(signal, gateA, gateB);

    return {
      type: 'coherence',
      content: coherence,
      dependencies: this.extractDependencies(signal),
      source: 'SyntacticDepend',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  mapCoherence(signal, gateA, gateB) {
    // Map discourse coherence between gates
    const subject = this.identifySubject(signal.content);
    const predicate = this.identifyPredicate(signal.content);
    const modifier = this.identifyModifier(signal.content);

    return `Discourse: [${subject}] ${predicate} [${modifier}]. ` +
           `Coherence bridge: Gate ${gateA.num} (${gateA.name}) ` +
           `→ Gate ${gateB.num} (${gateB.name}).`;
  },

  identifySubject(content) {
    const subjects = content.match(/(I|you|we|they|it|he|she)/gi);
    return subjects ? subjects[0] : 'unknown';
  },

  identifyPredicate(content) {
    const verbs = content.match(/(is|are|was|were|has|have|do|does|did|will|would|can|could|should|must)/gi);
    return verbs ? verbs[0] : 'acts';
  },

  identifyModifier(content) {
    const words = content.split(/\s+/);
    return words[words.length - 1] || '...';
  },

  extractDependencies(signal) {
    return {
      subject: this.identifySubject(signal.content),
      verb: this.identifyPredicate(signal.content),
      object: this.identifyModifier(signal.content),
      coherence: signal.content.length > 20 ? 'high' : 'low'
    };
  },

  aggregate(signals, centerName) {
    const coherences = signals.map(s => s.content).join(' | ');
    return {
      type: 'discourse',
      content: `${centerName} coherence: ${coherences}`,
      source: 'SyntacticDepend'
    };
  }
};

window.KLEIN_TOOLS.syntacticDepend = SYNTACTIC_DEPEND;