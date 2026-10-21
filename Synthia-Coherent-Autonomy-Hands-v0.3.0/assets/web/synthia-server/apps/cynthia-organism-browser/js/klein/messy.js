// MESSY: Meta-Symbolic Simulation
// State transition and mutation engine

const MESSY = {
  name: 'MESSY',
  description: 'Meta-symbolic state transition simulation',

  process(signal, gateA, gateB, state) {
    const transform = this.computeTransform(gateA, gateB);
    const nextState = this.applyTransform(signal, transform, gateA, gateB);

    return {
      type: 'mutation',
      content: nextState,
      transform: transform,
      source: 'MESSY',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  computeTransform(gateA, gateB) {
    // ATO-like XOR operation on binary states
    const a = gateA.state.binary || [0,0,0,0,0,0];
    const b = gateB.state.binary || [0,0,0,0,0,0];
    return a.map((bit, i) => bit ^ (b[i] || 0));
  },

  applyTransform(signal, transform, gateA, gateB) {
    const activeLines = transform.map((bit, i) => bit ? i + 1 : null).filter(Boolean);
    const lineNames = activeLines.map(l => {
      const lineData = window.LINE_DATA[gateA.num]?.[l - 1];
      return lineData ? lineData.name : `Line ${l}`;
    });

    return `State shifts at lines: ${activeLines.join(',')} (${lineNames.join(', ')}). ` +
           `${signal.content} becomes emergent through mutation from Gate ${gateA.num} to Gate ${gateB.num}.`;
  },

  aggregate(signals, centerName) {
    const mutations = signals.map(s => s.content).join(' | ');
    return {
      type: 'emergence',
      content: `${centerName} mutates: ${mutations}`,
      transform: signals[0]?.transform || [0,0,0,0,0,0],
      source: 'MESSY'
    };
  }
};

window.KLEIN_TOOLS.messy = MESSY;