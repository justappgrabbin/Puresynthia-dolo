// FUXI ENCODER: Binary State Encoding
// 0 = latent/receptive/yin, 1 = active/expressive/yang
// 6 binary lines = 64 system states

class FuxiEncoder {
  constructor() {
    this.states = this.generateStates();
  }

  generateStates() {
    const states = [];
    for (let i = 0; i < 64; i++) {
      const binary = i.toString(2).padStart(6, '0').split('').map(Number);
      states.push({
        number: i + 1,
        binary: binary,
        yin: binary.filter(b => b === 0).length,
        yang: binary.filter(b => b === 1).length,
        changing: binary.map((b, idx) => b === 1 ? idx + 1 : null).filter(Boolean)
      });
    }
    return states;
  }

  encode(gateNum) {
    const gate = window.GATE_BY_NUM[gateNum];
    if (!gate) return null;

    const upper = window.TRIGRAMS[gate.upper]?.binary || [0,0,0];
    const lower = window.TRIGRAMS[gate.lower]?.binary || [0,0,0];
    const binary = [...upper, ...lower];

    return {
      gate: gateNum,
      binary: binary,
      upper: upper,
      lower: lower,
      yinCount: binary.filter(b => b === 0).length,
      yangCount: binary.filter(b => b === 1).length,
      changingLines: binary.map((b, i) => b === 1 ? i + 1 : null).filter(Boolean)
    };
  }

  decode(binary) {
    const upper = binary.slice(0, 3).join('');
    const lower = binary.slice(3, 6).join('');

    const upperTrigram = window.TRIGRAM_BY_BINARY[upper];
    const lowerTrigram = window.TRIGRAM_BY_BINARY[lower];

    // Find gate with these trigrams
    const gate = window.MANDALA.find(g => 
      g.upper === upperTrigram && g.lower === lowerTrigram
    );

    return gate ? gate.num : null;
  }

  transform(binary, changingLines) {
    // Flip the changing lines
    const transformed = [...binary];
    changingLines.forEach(line => {
      const idx = line - 1;
      transformed[idx] = transformed[idx] === 0 ? 1 : 0;
    });
    return transformed;
  }

  // Compute ATO (Appositional Transformation Operator)
  ato(a, b) {
    // Klein's * operator: bitwise XOR-like but structured
    const result = [];
    for (let i = 0; i < 6; i++) {
      result.push(a[i] ^ b[i]);
    }
    return result;
  }
}

window.FuxiEncoder = FuxiEncoder;