// CENTER = Hub that aggregates circuit channels
// Big Klein tool = emergent behavior from all channels in center

class CenterHub {
  constructor(centerData, channels) {
    this.name = centerData.name;
    this.trigram = centerData.trigram;
    this.element = centerData.element;
    this.biology = centerData.biology;
    this.gates = centerData.gates;
    this.circuits = centerData.circuits;
    this.bigKleinToolName = centerData.bigKleinTool;
    this.description = centerData.description;
    this.hasAuthority = centerData.authority;
    this.color = centerData.color;

    this.channels = channels;
    this.circuitObjects = [];

    this.state = {
      defined: false,
      active: false,
      output: null,
      coherence: 0,
      fieldPressure: 0
    };

    this.bigKleinTool = null;
  }

  getBigTool() {
    if (!this.bigKleinTool) {
      this.bigKleinTool = window.KLEIN_TOOLS[this.bigKleinToolName];
    }
    return this.bigKleinTool;
  }

  // Check if center is defined (has at least one active channel)
  checkDefined() {
    this.state.defined = this.channels.some(c => c.state.active);
    return this.state.defined;
  }

  activate() {
    this.state.active = true;
    this.checkDefined();

    // Activate all channels
    this.channels.forEach(c => c.activate());

    this.updateCoherence();
  }

  deactivate() {
    this.state.active = false;
    this.channels.forEach(c => c.deactivate());
  }

  updateCoherence() {
    const active = this.channels.filter(c => c.state.active);
    if (active.length === 0) {
      this.state.coherence = 0;
      return;
    }

    const total = active.reduce((sum, c) => sum + c.state.weight, 0);
    this.state.coherence = total / active.length;
    this.state.fieldPressure = this.state.coherence * active.length;
  }

  // Aggregate all channel outputs through big Klein tool
  process(signal) {
    if (!this.state.active) return null;

    const activeChannels = this.channels.filter(c => c.state.active);
    if (activeChannels.length === 0) return null;

    // Collect all channel outputs
    const channelOutputs = activeChannels.map(c => c.process(signal)).filter(Boolean);

    // Big tool aggregates
    const tool = this.getBigTool();
    if (tool && tool.aggregate) {
      this.state.output = tool.aggregate(channelOutputs, this.name);
    } else {
      this.state.output = {
        type: 'aggregate',
        content: `${this.name}: ${channelOutputs.map(o => o.content).join(' | ')}`,
        source: this.name,
        coherence: this.state.coherence
      };
    }

    return this.state.output;
  }
}

window.CenterHub = CenterHub;