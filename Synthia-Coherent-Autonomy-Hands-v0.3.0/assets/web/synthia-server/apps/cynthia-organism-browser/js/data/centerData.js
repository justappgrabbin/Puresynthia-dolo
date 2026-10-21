// 9 Human Design Centers
// Each center = hub that aggregates circuit channels
// Big Klein tool = emergent behavior from all channels in center

window.CENTERS = {
  'Head': {
    name: 'Head',
    trigram: 'qian',
    element: 'Metal',
    biology: 'Pineal Gland',
    gates: [63, 64, 61],
    circuits: ['Understanding', 'Knowing'],
    bigKleinTool: 'diseminer',
    description: 'Mental pressure and inspiration. The source of questions and doubt.',
    authority: false,
    color: '#9966ff'
  },

  'Ajna': {
    name: 'Ajna',
    trigram: 'qian',
    element: 'Metal',
    biology: 'Pituitary Glands',
    gates: [4, 11, 17, 24, 43, 47, 64],
    circuits: ['Understanding', 'Knowing', 'Sensing'],
    bigKleinTool: 'grammarInference',
    description: 'Conceptualization and understanding. The processor of mental energy.',
    authority: false,
    color: '#6699ff'
  },

  'Throat': {
    name: 'Throat',
    trigram: 'dui',
    element: 'Metal',
    biology: 'Thyroid',
    gates: [8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62],
    circuits: ['Understanding', 'Knowing', 'Sensing', 'Centering', 'Ego/Defense'],
    bigKleinTool: 'autoling',
    description: 'Communication and manifestation. The center of action and expression.',
    authority: false,
    color: '#00ccff'
  },

  'G': {
    name: 'G Center',
    trigram: 'li',
    element: 'Fire',
    biology: 'Liver',
    gates: [1, 2, 7, 10, 13, 15, 25, 46],
    circuits: ['Understanding', 'Knowing', 'Centering'],
    bigKleinTool: 'analogyEngine',
    description: 'Identity, direction, and love. The magnetic monopole of the self.',
    authority: true,  // Self-projected authority
    color: '#ffcc00'
  },

  'Heart': {
    name: 'Heart/Ego',
    trigram: 'li',
    element: 'Fire',
    biology: 'Thymus Gland',
    gates: [21, 26, 40, 51],
    circuits: ['Ego/Defense', 'Knowing', 'Centering'],
    bigKleinTool: 'proppModeler',
    description: 'Willpower and material navigation. The center of ego and commitment.',
    authority: true,  // Ego authority
    color: '#ff4444'
  },

  'Solar': {
    name: 'Solar Plexus',
    trigram: 'kan',
    element: 'Water',
    biology: 'Kidney/Pancreas',
    gates: [6, 22, 30, 36, 37, 49, 55],
    circuits: ['Sensing', 'Knowing', 'Ego/Defense'],
    bigKleinTool: 'novelWriter',
    description: 'Emotional field and sensitivity. The wave of feelings over time.',
    authority: true,  // Emotional authority (highest priority)
    color: '#ff8800'
  },

  'Sacral': {
    name: 'Sacral',
    trigram: 'zhen',
    element: 'Wood',
    biology: 'Ovaries/Testes',
    gates: [3, 5, 9, 14, 27, 29, 34, 42, 59],
    circuits: ['Understanding', 'Sensing', 'Knowing', 'Centering'],
    bigKleinTool: 'messy',
    description: 'Life force, sexuality, and persistence. The generator engine.',
    authority: true,  // Sacral authority
    color: '#ff00ff'
  },

  'Splenic': {
    name: 'Splenic',
    trigram: 'gen',
    element: 'Earth',
    biology: 'Spleen/Lymph',
    gates: [18, 28, 32, 44, 48, 50, 57],
    circuits: ['Understanding', 'Knowing', 'Ego/Defense'],
    bigKleinTool: 'styleControl',
    description: 'Survival instinct and intuition. The now-centered awareness.',
    authority: true,  // Splenic authority
    color: '#885522'
  },

  'Root': {
    name: 'Root',
    trigram: 'kun',
    element: 'Earth',
    biology: 'Adrenal Glands',
    gates: [19, 38, 39, 41, 52, 53, 54, 58, 60],
    circuits: ['Sensing', 'Ego/Defense', 'Centering'],
    bigKleinTool: 'historicalSim',
    description: 'Stress, pressure, and drive. The adrenal engine of the body.',
    authority: false,
    color: '#cc0000'
  }
};

// Center priority for Monopole routing (authority hierarchy)
window.CENTER_PRIORITY = [
  'Solar',      // Emotional authority (highest)
  'Sacral',     // Sacral authority
  'Splenic',    // Splenic authority
  'Heart',      // Ego authority
  'G',          // Self-projected authority
  'Ajna',       // Mental authority (rare)
  'Throat',     // No inner authority
  'Head',       // No inner authority
  'Root'        // No inner authority
];

// Center lookup by gate number
window.CENTER_BY_GATE = {};
Object.entries(window.CENTERS).forEach(([name, center]) => {
  center.gates.forEach(gateNum => {
    window.CENTER_BY_GATE[gateNum] = name;
  });
});