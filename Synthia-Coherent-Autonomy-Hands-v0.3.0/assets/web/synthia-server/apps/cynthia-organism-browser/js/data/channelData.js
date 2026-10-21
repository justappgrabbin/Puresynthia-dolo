// 36 Human Design Channels
// Each channel = 2 gates + circuit family + Klein tool behavior

window.CHANNELS = [
  // === UNDERSTANDING CIRCUIT (7 channels) ===
  { gates: [63, 4], name: 'Logic', circuit: 'Understanding',
    description: 'Mental ease mixed with doubt. Questions patterns for future security.',
    kleinTool: 'diseminer', neuralBase: 'DFF', graphType: 'DAG' },

  { gates: [17, 62], name: 'Acceptance', circuit: 'Understanding',
    description: 'Organizational talent. Creates frameworks for collective harmony.',
    kleinTool: 'grammarInference', neuralBase: 'RBM', graphType: 'Bipartite' },

  { gates: [18, 58], name: 'Judgment', circuit: 'Understanding',
    description: 'Correction of patterns. Finds what is wrong and fixes it.',
    kleinTool: 'diseminer', neuralBase: 'Hopfield', graphType: 'Attractor' },

  { gates: [16, 48], name: 'Wavelength', circuit: 'Understanding',
    description: 'Depth of talent. Recognizes and develops skills over time.',
    kleinTool: 'styleControl', neuralBase: 'SparseAutoencoder', graphType: 'Sparse' },

  { gates: [9, 52], name: 'Concentration', circuit: 'Understanding',
    description: 'Focused energy. Ability to concentrate on what matters.',
    kleinTool: 'styleControl', neuralBase: 'ELM', graphType: 'FixedRandom' },

  { gates: [5, 15], name: 'Rhythm', circuit: 'Understanding',
    description: 'Flow of patterns. Being in the right place at the right time.',
    kleinTool: 'historicalSim', neuralBase: 'SOM', graphType: 'SelfOrganizing' },

  { gates: [7, 31], name: 'The Alpha', circuit: 'Understanding',
    description: 'Leadership through influence. The recognized leader.',
    kleinTool: 'autoling', neuralBase: 'CNN', graphType: 'Hierarchical' },

  // === SENSING CIRCUIT (7 channels) ===
  { gates: [53, 42], name: 'Maturation', circuit: 'Sensing',
    description: 'Cyclical development. Learning through experience over time.',
    kleinTool: 'novelWriter', neuralBase: 'DBN', graphType: 'Layered' },

  { gates: [41, 30], name: 'Recognition', circuit: 'Sensing',
    description: 'Focused desire. The dreamer with the energy to realize dreams.',
    kleinTool: 'novelWriter', neuralBase: 'RNN', graphType: 'Temporal' },

  { gates: [36, 35], name: 'Transitoriness', circuit: 'Sensing',
    description: 'Experience seeker. Jack of all trades, master of change.',
    kleinTool: 'novelWriter', neuralBase: 'Seq2Seq', graphType: 'Transition' },

  { gates: [64, 47], name: 'Abstraction', circuit: 'Sensing',
    description: 'Mental activity and clarity. Processes past for realization.',
    kleinTool: 'messy', neuralBase: 'Autoencoder', graphType: 'Compression' },

  { gates: [11, 56], name: 'Curiosity', circuit: 'Sensing',
    description: 'Seeker of ideas. The storyteller and concept explorer.',
    kleinTool: 'culturalPattern', neuralBase: 'Transformer', graphType: 'Story' },

  { gates: [29, 46], name: 'Discovery', circuit: 'Sensing',
    description: 'Determined discovery. Commitment to the experiential path.',
    kleinTool: 'historicalSim', neuralBase: 'RL', graphType: 'Path' },

  { gates: [13, 33], name: 'The Prodigal', circuit: 'Sensing',
    description: 'The witness. Listens, stores, retreats to find meaning.',
    kleinTool: 'semanticNetwork', neuralBase: 'Episodic', graphType: 'Archive' },

  // === KNOWING CIRCUIT (9 channels) ===
  { gates: [3, 60], name: 'Mutation', circuit: 'Knowing',
    description: 'Pulsed mutation. Energy that fluctuates and initiates new forms.',
    kleinTool: 'messy', neuralBase: 'LSM', graphType: 'Reservoir' },

  { gates: [61, 24], name: 'Awareness', circuit: 'Knowing',
    description: 'The thinker. Inner truth through constant return to thought.',
    kleinTool: 'analogyEngine', neuralBase: 'NTM', graphType: 'ExternalMemory' },

  { gates: [43, 23], name: 'Structuring', circuit: 'Knowing',
    description: 'Individual insight. Structures inner knowing for outer expression.',
    kleinTool: 'proppModeler', neuralBase: 'DeconvNet', graphType: 'Unpacking' },

  { gates: [28, 38], name: 'Struggle', circuit: 'Knowing',
    description: 'Adversarial meaning. Finds purpose through opposition.',
    kleinTool: 'proppModeler', neuralBase: 'GAN', graphType: 'Adversarial' },

  { gates: [20, 57], name: 'Brainwave', circuit: 'Knowing',
    description: 'Intuitive awareness in the now. Split-second knowing.',
    kleinTool: 'messy', neuralBase: 'ESN', graphType: 'Immediate' },

  { gates: [39, 55], name: 'Emoting', circuit: 'Knowing',
    description: 'Emotional frequency. The mood that creates spirit.',
    kleinTool: 'novelWriter', neuralBase: 'GRU', graphType: 'Gated' },

  { gates: [12, 22], name: 'Openness', circuit: 'Knowing',
    description: 'Social openness. The grace of emotional expression.',
    kleinTool: 'culturalPattern', neuralBase: 'VAE', graphType: 'Latent' },

  { gates: [2, 14], name: 'The Beat', circuit: 'Knowing',
    description: 'Directional resonance. The pulse of life moving toward resources.',
    kleinTool: 'historicalSim', neuralBase: 'RBF', graphType: 'Radial' },

  { gates: [1, 8], name: 'Inspiration', circuit: 'Knowing',
    description: 'Creative role model. Individual creativity made manifest.',
    kleinTool: 'analogyEngine', neuralBase: 'Attention', graphType: 'Salience' },

  // === CENTERING CIRCUIT (6 channels) ===
  { gates: [10, 34], name: 'Exploration', circuit: 'Centering',
    description: 'Following impulses. The explorer of possibilities.',
    kleinTool: 'messy', neuralBase: 'ActorCritic', graphType: 'Agency' },

  { gates: [25, 51], name: 'Initiation', circuit: 'Centering',
    description: 'Shock of initiation. The ability to handle sudden change.',
    kleinTool: 'autoling', neuralBase: 'Spike', graphType: 'Threshold' },

  { gates: [10, 20], name: 'Awakening', circuit: 'Centering',
    description: 'Identity expression. Being in the now with full presence.',
    kleinTool: 'autoling', neuralBase: 'Policy', graphType: 'Identity' },

  { gates: [20, 34], name: 'Charisma', circuit: 'Centering',
    description: 'Thoughts become deeds. Busy energy of manifestation.',
    kleinTool: 'messy', neuralBase: 'MotorPolicy', graphType: 'Action' },

  { gates: [34, 57], name: 'Power', circuit: 'Centering',
    description: 'Survival response. Pure sacral power in the now.',
    kleinTool: 'messy', neuralBase: 'Sensorimotor', graphType: 'Survival' },

  { gates: [10, 57], name: 'Perfected Form', circuit: 'Centering',
    description: 'Survival through form. The body that knows what is correct.',
    kleinTool: 'styleControl', neuralBase: 'Adaptive', graphType: 'Refinement' },

  // === EGO/DEFENSE CIRCUIT (6 channels) ===
  { gates: [21, 45], name: 'Money Line', circuit: 'Ego/Defense',
    description: 'Material control. The owner and manager of resources.',
    kleinTool: 'styleControl', neuralBase: 'Resource', graphType: 'Allocation' },

  { gates: [26, 44], name: 'Surrender', circuit: 'Ego/Defense',
    description: 'Transmitter of values. Selling what is correct to the tribe.',
    kleinTool: 'culturalPattern', neuralBase: 'MemoryPred', graphType: 'Pattern' },

  { gates: [32, 54], name: 'Transformation', circuit: 'Ego/Defense',
    description: 'Driven ambition. Moving up through fear of failure.',
    kleinTool: 'transformationLearner', neuralBase: 'Evolutionary', graphType: 'Selection' },

  { gates: [37, 40], name: 'Community', circuit: 'Ego/Defense',
    description: 'Part seeking whole. The bargain of belonging.',
    kleinTool: 'novelWriter', neuralBase: 'GameTheory', graphType: 'Exchange' },

  { gates: [59, 6], name: 'Mating', circuit: 'Ego/Defense',
    description: 'Intimacy and reproduction. The drive to bond and create.',
    kleinTool: 'messy', neuralBase: 'Boundary', graphType: 'Fusion' },

  { gates: [27, 50], name: 'Preservation', circuit: 'Ego/Defense',
    description: 'Caretaking. Nurturing and maintaining the tribe.',
    kleinTool: 'styleControl', neuralBase: 'Regulator', graphType: 'Maintenance' }
];

// Channel lookup by gate pair
window.CHANNEL_BY_GATES = {};
window.CHANNELS.forEach(c => {
  const key1 = `${c.gates[0]}-${c.gates[1]}`;
  const key2 = `${c.gates[1]}-${c.gates[0]}`;
  window.CHANNEL_BY_GATES[key1] = c;
  window.CHANNEL_BY_GATES[key2] = c;
});

// Circuit families
window.CIRCUITS = {
  'Understanding': { channels: [], color: '#00ffff', trigram: 'qian' },
  'Sensing': { channels: [], color: '#ff00ff', trigram: 'xun' },
  'Knowing': { channels: [], color: '#ffff00', trigram: 'zhen' },
  'Centering': { channels: [], color: '#00ff00', trigram: 'li' },
  'Ego/Defense': { channels: [], color: '#ff4444', trigram: 'dui' }
};

window.CHANNELS.forEach(c => {
  if (window.CIRCUITS[c.circuit]) {
    window.CIRCUITS[c.circuit].channels.push(c);
  }
});