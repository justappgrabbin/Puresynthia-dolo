// PARAPHRASING ENGINE: Text Variation Generator
// Generates stylistic variations of input text

const PARAPHRASING = {
  name: 'Paraphrasing',
  description: 'Generates stylistic variations of symbolic content',

  process(signal, gateA, gateB, state) {
    const variations = this.generateVariations(signal, gateA, gateB);

    return {
      type: 'variation',
      content: variations,
      styles: this.identifyStyles(gateA, gateB),
      source: 'Paraphrasing',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  generateVariations(signal, gateA, gateB) {
    const original = signal.content;
    const styles = this.identifyStyles(gateA, gateB);

    const variations = styles.map(style => {
      return this.applyStyle(original, style);
    });

    return `Variations of "${original}": ` +
           variations.map((v, i) => `[${styles[i]}]: ${v}`).join(' | ');
  },

  identifyStyles(gateA, gateB) {
    const baseStyles = ['formal', 'poetic', 'technical', 'casual', 'mystical'];
    const idxA = gateA.num % baseStyles.length;
    const idxB = gateB.num % baseStyles.length;
    return [baseStyles[idxA], baseStyles[idxB], 'synthesis'];
  },

  applyStyle(text, style) {
    const transformers = {
      'formal': (t) => `It is hereby stated that: ${t}`,
      'poetic': (t) => `In whispers of the wind: ${t}`,
      'technical': (t) => `Analysis indicates: ${t}`,
      'casual': (t) => `So basically: ${t}`,
      'mystical': (t) => `The oracle speaks: ${t}`,
      'synthesis': (t) => `All forms converge: ${t}`
    };
    return transformers[style]?.(text) || text;
  },

  aggregate(signals, centerName) {
    const variations = signals.map(s => s.content).join(' || ');
    return {
      type: 'variation',
      content: `${centerName} variations: ${variations}`,
      source: 'Paraphrasing'
    };
  }
};

window.KLEIN_TOOLS.paraphrasing = PARAPHRASING;