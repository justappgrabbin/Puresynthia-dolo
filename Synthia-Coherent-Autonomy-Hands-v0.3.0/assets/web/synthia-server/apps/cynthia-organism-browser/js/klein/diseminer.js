// DISEMINER: Distributional-Semantics Inference Maker
// Klein 1968 - Inference through semantic distance

const DISEMINER = {
  name: 'DISEMINER',
  description: 'Inference through distributional semantics',

  process(signal, gateA, gateB, state) {
    const dist = this.semanticDistance(gateA, gateB);
    const inference = this.infer(signal, dist, gateA, gateB);

    return {
      type: 'inference',
      content: inference,
      confidence: 1 - dist,
      source: 'DISEMINER',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  semanticDistance(gateA, gateB) {
    // Trigram overlap
    const ta = [gateA.upperTrigram, gateA.lowerTrigram];
    const tb = [gateB.upperTrigram, gateB.lowerTrigram];
    const overlap = ta.filter(t => tb.includes(t)).length;
    const trigramScore = 1 - (overlap / 4);

    // Circuit alignment
    const circuitScore = gateA.circuit === gateB.circuit ? 0 : 0.3;

    // Element harmony
    const elementMap = { 'Wood': 0, 'Fire': 1, 'Earth': 2, 'Metal': 3, 'Water': 4 };
    const ea = elementMap[gateA.element] || 0;
    const eb = elementMap[gateB.element] || 0;
    const elementDiff = Math.abs(ea - eb) / 4;

    return (trigramScore * 0.5 + circuitScore * 0.3 + elementDiff * 0.2);
  },

  infer(signal, distance, gateA, gateB) {
    if (distance < 0.2) {
      return `Direct inference: ${signal.content} flows naturally from Gate ${gateA.num} to Gate ${gateB.num}`;
    }
    if (distance < 0.5) {
      return `Analogical inference: ${signal.content} through Gate ${gateA.num} suggests a pattern at Gate ${gateB.num}`;
    }
    if (distance < 0.8) {
      return `Abstract inference: ${signal.content} creates a field tension between Gate ${gateA.num} and Gate ${gateB.num}`;
    }
    return `Null inference: ${signal.content} cannot be resolved between Gate ${gateA.num} and Gate ${gateB.num}`;
  },

  aggregate(signals, centerName) {
    const merged = signals.map(s => s.content).join(' → ');
    const avgConfidence = signals.reduce((a, s) => a + (s.confidence || 0), 0) / signals.length;
    return {
      type: 'narrative',
      content: `From ${centerName}: ${merged}`,
      confidence: avgConfidence,
      source: 'DISEMINER'
    };
  }
};

window.KLEIN_TOOLS = window.KLEIN_TOOLS || {};
window.KLEIN_TOOLS.diseminer = DISEMINER;