// CIRCUIT = Connected channel family
// Subgraph with shared inductive bias

class Circuit {
  constructor(name, channels) {
    this.name = name;
    this.channels = channels;
    this.color = window.CIRCUITS[name]?.color || '#ffffff';
    this.trigram = window.CIRCUITS[name]?.trigram || 'qian';
    this.state = {
      active: false,
      coherence: 0,
      dominantChannel: null,
      fieldPressure: 0
    };
  }

  activate() {
    this.state.active = true;
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

    // Coherence = average weight of active channels
    const total = active.reduce((sum, c) => sum + c.state.weight, 0);
    this.state.coherence = total / active.length;

    // Dominant channel = highest weight
    this.state.dominantChannel = active.reduce((max, c) => 
      c.state.weight > max.state.weight ? c : max
    , active[0]);
  }

  process(signal) {
    if (!this.state.active) return null;

    const results = this.channels
      .filter(c => c.state.active)
      .map(c => c.process(signal));

    return {
      circuit: this.name,
      coherence: this.state.coherence,
      dominant: this.state.dominantChannel?.name || 'none',
      outputs: results.filter(Boolean)
    };
  }
}

window.Circuit = Circuit;