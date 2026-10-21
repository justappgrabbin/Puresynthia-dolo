// CHANNEL = Edge between two Gates
// Klein tool runs on the edge (behavior between nodes)

class ChannelEdge {
  constructor(channelData, gateA, gateB) {
    this.gateA = gateA;
    this.gateB = gateB;
    this.name = channelData.name;
    this.circuit = channelData.circuit;
    this.kleinToolName = channelData.kleinTool;
    this.neuralBase = channelData.neuralBase;
    this.graphType = channelData.graphType;
    this.description = channelData.description;

    this.state = {
      active: false,
      weight: 0,
      direction: 'both',
      mode: 'stable',
      signalHistory: [],
      lastActivation: null
    };

    this.kleinTool = null;
  }

  getKleinTool() {
    if (!this.kleinTool) {
      this.kleinTool = window.KLEIN_TOOLS[this.kleinToolName];
    }
    return this.kleinTool;
  }

  activate() {
    this.state.active = true;
    this.state.lastActivation = Date.now();
    this.state.weight = Math.min(1, this.state.weight + 0.2);

    // Activate both gates
    this.gateA.activate(0, { source: 'channel', channel: this.name });
    this.gateB.activate(0, { source: 'channel', channel: this.name });

    return this.state;
  }

  deactivate() {
    this.state.active = false;
    this.state.weight = Math.max(0, this.state.weight - 0.05);

    // Deactivate gates if no other channels active
    const otherA = window.CHANNELS.filter(c => 
      c.gates.includes(this.gateA.num) && c !== this
    );
    const otherB = window.CHANNELS.filter(c => 
      c.gates.includes(this.gateB.num) && c !== this
    );

    if (otherA.length === 0) this.gateA.deactivate();
    if (otherB.length === 0) this.gateB.deactivate();
  }

  // Process signal across the edge
  process(signal) {
    if (!this.state.active) return null;

    const tool = this.getKleinTool();
    if (!tool) return null;

    const result = tool.process(signal, this.gateA, this.gateB, this.state);

    this.state.signalHistory.push({
      time: Date.now(),
      signal: signal,
      result: result
    });

    if (this.state.signalHistory.length > 50) {
      this.state.signalHistory.shift();
    }

    return result;
  }

  // Get direction of flow (which gate is dominant)
  getDirection() {
    const tensionA = this.gateA.state.tension;
    const tensionB = this.gateB.state.tension;

    if (tensionA > tensionB * 1.5) return 'a→b';
    if (tensionB > tensionA * 1.5) return 'b→a';
    return 'both';
  }
}

window.ChannelEdge = ChannelEdge;