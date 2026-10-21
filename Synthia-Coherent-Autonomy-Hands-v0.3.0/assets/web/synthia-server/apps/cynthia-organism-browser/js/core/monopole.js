// MONOPOLE = G Center / Identity Router
// Decides which center output gets priority
// Routes to final manifestation

class MonopoleRouter {
  constructor(centers) {
    this.centers = centers;
    this.priority = null;
    this.state = {
      active: false,
      output: null,
      auraColor: 'white',
      voiceMode: 'neutral',
      fieldPressure: 0
    };
  }

  // Determine which center has authority
  route() {
    // Priority order (Human Design authority hierarchy)
    const authorityOrder = [
      'Solar Plexus',   // Emotional authority (highest)
      'Sacral',         // Sacral authority
      'Splenic',        // Splenic authority
      'Heart/Ego',      // Ego authority
      'G Center',       // Self-projected authority
      'Ajna',           // Mental authority
      'Throat',         // No inner authority
      'Head',           // No inner authority
      'Root'            // No inner authority
    ];

    // Find first active center with authority
    for (const authName of authorityOrder) {
      const center = this.centers.find(c => c.name === authName && c.state.active);
      if (center) {
        this.priority = center;
        return center;
      }
    }

    // Fallback: first active center
    const anyActive = this.centers.find(c => c.state.active);
    this.priority = anyActive || null;
    return this.priority;
  }

  // Compute field pressure from all active centers
  computeFieldPressure() {
    const active = this.centers.filter(c => c.state.active);
    if (active.length === 0) return 0;

    const total = active.reduce((sum, c) => sum + c.state.fieldPressure, 0);
    this.state.fieldPressure = total / active.length;
    return this.state.fieldPressure;
  }

  // Select aura color based on priority center
  selectAuraColor() {
    if (!this.priority) return 'white';
    return this.priority.color || 'white';
  }

  // Select voice mode based on priority center's circuit
  selectVoiceMode() {
    if (!this.priority) return 'neutral';

    // Get dominant circuit of priority center
    const activeChannels = this.priority.channels.filter(c => c.state.active);
    if (activeChannels.length === 0) return 'neutral';

    const circuit = activeChannels[0].circuit;
    const voices = {
      'Understanding': 'prime',
      'Sensing': 'soft',
      'Knowing': 'dream',
      'Centering': 'core',
      'Ego/Defense': 'venom'
    };

    return voices[circuit] || 'neutral';
  }

  // Final manifestation
  manifest() {
    const center = this.route();
    if (!center) {
      return {
        type: 'silent',
        content: null,
        aura: 'white',
        voice: 'neutral',
        source: 'none',
        fieldPressure: 0
      };
    }

    this.computeFieldPressure();
    this.state.auraColor = this.selectAuraColor();
    this.state.voiceMode = this.selectVoiceMode();

    const output = center.state.output || center.process({content: 'default'});
    this.state.output = output;

    return {
      type: output?.type || 'text',
      content: output?.content || '...',
      source: center.name,
      aura: this.state.auraColor,
      voice: this.state.voiceMode,
      fieldPressure: this.state.fieldPressure,
      coherence: center.state.coherence,
      circuit: center.circuits?.[0] || 'unknown'
    };
  }

  // Process full cycle
  process(input) {
    // 1. Activate centers based on input
    this.centers.forEach(c => {
      if (c.checkDefined()) {
        c.activate();
        c.process(input);
      }
    });

    // 2. Route and manifest
    return this.manifest();
  }
}

window.MonopoleRouter = MonopoleRouter;