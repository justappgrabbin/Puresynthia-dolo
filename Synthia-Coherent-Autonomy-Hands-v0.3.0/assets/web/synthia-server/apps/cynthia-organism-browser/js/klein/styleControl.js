// STYLE CONTROL: Form and Constraint Enforcement
// Controls the aesthetic and structural constraints of output

const STYLE_CONTROL = {
  name: 'StyleControl',
  description: 'Form and constraint enforcement for generated output',

  process(signal, gateA, gateB, state) {
    const styled = this.applyStyle(signal, gateA, gateB);

    return {
      type: 'style',
      content: styled,
      constraints: this.getConstraints(gateA, gateB),
      source: 'StyleControl',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  applyStyle(signal, gateA, gateB) {
    const style = this.inferStyle(gateA, gateB);
    const formatted = this.format(signal.content, style);

    return `Styled [${style}]: ${formatted}`;
  },

  inferStyle(gateA, gateB) {
    const styles = {
      'Understanding': 'analytical',
      'Sensing': 'narrative',
      'Knowing': 'poetic',
      'Centering': 'directive',
      'Ego/Defense': 'boundary-setting'
    };
    return `${styles[gateA.circuit] || 'neutral'}_${styles[gateB.circuit] || 'neutral'}`;
  },

  format(content, style) {
    const formatters = {
      'analytical': (t) => `Analysis: ${t}`,
      'narrative': (t) => `Once upon a time: ${t}`,
      'poetic': (t) => `In the silence: ${t}`,
      'directive': (t) => `Do this: ${t}`,
      'boundary-setting': (t) => `Here is the line: ${t}`
    };
    const [s1, s2] = style.split('_');
    return formatters[s1]?.(content) || content;
  },

  getConstraints(gateA, gateB) {
    return {
      length: gateA.num + gateB.num,
      tone: gateA.element,
      structure: gateB.circuit,
      forbidden: ['doubt', 'hesitation']
    };
  },

  aggregate(signals, centerName) {
    const styles = signals.map(s => s.content).join(' | ');
    return {
      type: 'constraint',
      content: `${centerName} styles: ${styles}`,
      source: 'StyleControl'
    };
  }
};

window.KLEIN_TOOLS.styleControl = STYLE_CONTROL;