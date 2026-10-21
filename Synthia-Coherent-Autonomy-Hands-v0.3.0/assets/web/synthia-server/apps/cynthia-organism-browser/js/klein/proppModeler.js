// PROPP MODELER: Structural Narrative Generation
// Based on Propp's 31 narrative functions + Levi-Strauss structuralism

const PROPP_MODELER = {
  name: 'ProppModeler',
  description: 'Adversarial narrative generation through structural functions',

  // Propp's 31 functions mapped to gate interactions
  functions: [
    'Absentation', 'Interdiction', 'Violation', 'Reconnaissance',
    'Delivery', 'Trickery', 'Complicity', 'Villainy',
    'Mediation', 'Counteraction', 'Departure', 'FirstFunction',
    'Donor', 'HeroReaction', 'Acquisition', 'SpatialTransference',
    'Struggle', 'Branding', 'Victory', 'Liquidation',
    'Return', 'Pursuit', 'Rescue', 'UnrecognizedArrival',
    'UnfoundedClaims', 'DifficultTask', 'Solution', 'Recognition',
    'Exposure', 'Transfiguration', 'Punishment', 'Wedding'
  ],

  process(signal, gateA, gateB, state) {
    const narrative = this.generateNarrative(gateA, gateB, signal);

    return {
      type: 'narrative',
      content: narrative,
      structure: this.identifyStructure(gateA, gateB),
      source: 'ProppModeler',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  generateNarrative(gateA, gateB, signal) {
    // Select functions based on gate numbers
    const funcIndexA = (gateA.num - 1) % 31;
    const funcIndexB = (gateB.num - 1) % 31;
    const funcA = this.functions[funcIndexA];
    const funcB = this.functions[funcIndexB];

    // Generate structural narrative
    const tension = gateA.state.tension + gateB.state.tension;
    const resolution = tension > 1 ? 'Victory' : 'Liquidation';

    return `Narrative: ${funcA} (Gate ${gateA.num}) → ${funcB} (Gate ${gateB.num}). ` +
           `Tension: ${tension.toFixed(2)}. Resolution: ${resolution}. ` +
           `Signal: "${signal.content}" becomes the ${funcB.toLowerCase()} of the story.`;
  },

  identifyStructure(gateA, gateB) {
    // Levi-Strauss binary opposition
    const oppositions = {
      'Life': 'Death', 'Nature': 'Culture', 'Male': 'Female',
      'Raw': 'Cooked', 'Day': 'Night', 'Sacred': 'Profane'
    };

    const elementA = gateA.element || 'unknown';
    const elementB = gateB.element || 'unknown';

    return {
      opposition: `${elementA} vs ${elementB}`,
      mediation: this.findMediation(elementA, elementB),
      binary: gateA.state.binary.map((b, i) => b ^ gateB.state.binary[i])
    };
  },

  findMediation(e1, e2) {
    const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const i1 = elements.indexOf(e1);
    const i2 = elements.indexOf(e2);
    if (i1 === -1 || i2 === -1) return 'unknown';
    const mid = Math.floor((i1 + i2) / 2);
    return elements[mid];
  },

  aggregate(signals, centerName) {
    const structures = signals.map(s => s.structure?.opposition).join(' | ');
    return {
      type: 'archetype',
      content: `${centerName} narrative: ${structures}`,
      source: 'ProppModeler'
    };
  }
};

window.KLEIN_TOOLS.proppModeler = PROPP_MODELER;