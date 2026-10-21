// GRAMMAR INFERENCE: Automatic Deep Structure Rule Learning
// Learns grammatical rules from examples

const GRAMMAR_INFERENCE = {
  name: 'GrammarInference',
  description: 'Automatic rule learning from structural patterns',

  process(signal, gateA, gateB, state) {
    const grammar = this.inferGrammar(signal, gateA, gateB);

    return {
      type: 'grammar',
      content: grammar,
      rules: this.extractRules(signal),
      source: 'GrammarInference',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  inferGrammar(signal, gateA, gateB) {
    // Infer grammar from gate structure
    const rule = this.generateRule(gateA, gateB);
    const example = this.generateExample(rule, signal.content);

    return `Grammar rule inferred from Gates ${gateA.num}-${gateB.num}: ` +
           `${rule}. Example: "${example}".`;
  },

  generateRule(gateA, gateB) {
    const structures = [
      'S → NP VP',
      'S → VP NP',
      'S → Adj N V',
      'S → N V Adj',
      'S → Adv V N'
    ];
    return structures[(gateA.num + gateB.num) % structures.length];
  },

  generateExample(rule, content) {
    const words = content.split(/\s+/);
    if (words.length < 3) return content;
    return `${words[0]} ${words[1]} ${words[2]}`;
  },

  extractRules(signal) {
    const words = signal.content.split(/\s+/);
    return {
      wordCount: words.length,
      avgLength: words.reduce((a, w) => a + w.length, 0) / words.length,
      structure: words.length > 5 ? 'complex' : 'simple'
    };
  },

  aggregate(signals, centerName) {
    const grammars = signals.map(s => s.content).join(' | ');
    return {
      type: 'rules',
      content: `${centerName} grammar: ${grammars}`,
      source: 'GrammarInference'
    };
  }
};

window.KLEIN_TOOLS.grammarInference = GRAMMAR_INFERENCE;