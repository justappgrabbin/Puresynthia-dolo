// GATE = Hexagram Node
// State space with internal DMS structure

class GateNode {
  constructor(gateData) {
    this.num = gateData.num;
    this.name = gateData.name;
    this.start = gateData.start;
    this.end = gateData.end;
    this.upperTrigram = gateData.upper;
    this.lowerTrigram = gateData.lower;
    this.center = gateData.center;
    this.circuit = this.inferCircuit();
    this.element = this.inferElement();
    this.harmonic = gateData.harmonic;

    this.state = {
      binary: this.toBinary(gateData.upper, gateData.lower),
      active: false,
      lineActive: null,
      tension: 0,
      memoryGravity: 0,
      recursionDepth: 0,
      activationHistory: [],
      consciousness: 0.5
    };

    this.subStructure = this.buildSubStructure();
  }

  inferCircuit() {
    const channel = window.CHANNELS.find(c => c.gates.includes(this.num));
    return channel ? channel.circuit : 'unknown';
  }

  inferElement() {
    const upper = window.TRIGRAMS[this.upperTrigram];
    return upper ? upper.element : 'unknown';
  }

  toBinary(upper, lower) {
    const u = window.TRIGRAMS[upper]?.binary || [0,0,0];
    const l = window.TRIGRAMS[lower]?.binary || [0,0,0];
    return [...u, ...l];
  }

  buildSubStructure() {
    const lineDeg = (this.end - this.start) / 6;
    const lines = [];

    for (let i = 0; i < 6; i++) {
      const lineStart = this.start + i * lineDeg;
      const lineEnd = lineStart + lineDeg;

      lines.push({
        line: i + 1,
        start: lineStart,
        end: lineEnd,
        color: this.buildSubLines(lineStart, lineEnd, 6),
        tone: this.buildSubLines(lineStart, lineEnd, 36),
        base: this.buildSubLines(lineStart, lineEnd, 180)
      });
    }

    return lines;
  }

  buildSubLines(start, end, divisions) {
    const step = (end - start) / divisions;
    const subs = [];

    for (let i = 0; i < divisions; i++) {
      const s = start + i * step;
      const e = s + step;
      const mid = s + step / 2;
      const gate = window.degreeToGate(mid);

      subs.push({
        index: i + 1,
        start: s,
        end: e,
        gate: gate ? gate.num : null,
        degree: mid
      });
    }

    return subs;
  }

  activate(degree, context = {}) {
    this.state.active = true;
    this.state.tension = context.tension || 0;
    this.state.memoryGravity += 0.1;
    this.state.activationHistory.push({
      time: Date.now(),
      degree: degree,
      context: context
    });

    // Trim history
    if (this.state.activationHistory.length > 100) {
      this.state.activationHistory.shift();
    }

    return this.state;
  }

  deactivate() {
    this.state.active = false;
    this.state.tension = Math.max(0, this.state.tension - 0.01);
  }

  // Get line at specific degree
  getLine(degree) {
    return this.subStructure.find(l => degree >= l.start && degree < l.end);
  }

  // Get sub-gate at specific degree
  getSubGate(degree, level = 'color') {
    const line = this.getLine(degree);
    if (!line) return null;

    const subs = line[level];
    return subs.find(s => degree >= s.start && degree < s.end);
  }
}

window.GateNode = GateNode;