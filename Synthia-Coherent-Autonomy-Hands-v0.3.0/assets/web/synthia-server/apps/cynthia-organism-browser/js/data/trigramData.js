// 8 Trigrams × 2 Variants = 16 Processing States
// Each trigram has: Pure (stable) and Moving (changing) variants

window.TRIGRAMS = {
  // ☰ Heaven - Creative
  'qian': {
    name: 'Heaven',
    symbol: '☰',
    binary: [1,1,1],
    element: 'Metal',
    direction: 'Northwest',
    family: 'Father',
    body: 'Head',
    color: 'White',
    animal: 'Horse',
    variant: 'pure',
    kleinTool: 'diseminer'
  },
  'qian-moving': {
    name: 'Heaven-Moving',
    symbol: '☰́',
    binary: [1,1,0],
    element: 'Metal',
    direction: 'Northwest',
    family: 'Father',
    body: 'Head',
    color: 'White',
    animal: 'Horse',
    variant: 'moving',
    kleinTool: 'autoling'
  },

  // ☷ Earth - Receptive
  'kun': {
    name: 'Earth',
    symbol: '☷',
    binary: [0,0,0],
    element: 'Earth',
    direction: 'Southwest',
    family: 'Mother',
    body: 'Belly',
    color: 'Yellow',
    animal: 'Ox',
    variant: 'pure',
    kleinTool: 'grammarInference'
  },
  'kun-moving': {
    name: 'Earth-Moving',
    symbol: '☷́',
    binary: [0,0,1],
    element: 'Earth',
    direction: 'Southwest',
    family: 'Mother',
    body: 'Belly',
    color: 'Yellow',
    animal: 'Ox',
    variant: 'moving',
    kleinTool: 'novelWriter'
  },

  // ☳ Thunder - Arousing
  'zhen': {
    name: 'Thunder',
    symbol: '☳',
    binary: [0,0,1],
    element: 'Wood',
    direction: 'East',
    family: '1st Son',
    body: 'Foot',
    color: 'Green',
    animal: 'Dragon',
    variant: 'pure',
    kleinTool: 'proppModeler'
  },
  'zhen-moving': {
    name: 'Thunder-Moving',
    symbol: '☳́',
    binary: [0,0,0],
    element: 'Wood',
    direction: 'East',
    family: '1st Son',
    body: 'Foot',
    color: 'Green',
    animal: 'Dragon',
    variant: 'moving',
    kleinTool: 'messy'
  },

  // ☵ Water - Abysmal
  'kan': {
    name: 'Water',
    symbol: '☵',
    binary: [0,1,0],
    element: 'Water',
    direction: 'North',
    family: '2nd Son',
    body: 'Ear',
    color: 'Black',
    animal: 'Pig',
    variant: 'pure',
    kleinTool: 'historicalSim'
  },
  'kan-moving': {
    name: 'Water-Moving',
    symbol: '☵́',
    binary: [0,1,1],
    element: 'Water',
    direction: 'North',
    family: '2nd Son',
    body: 'Ear',
    color: 'Black',
    animal: 'Pig',
    variant: 'moving',
    kleinTool: 'semanticNetwork'
  },

  // ☶ Mountain - Keeping Still
  'gen': {
    name: 'Mountain',
    symbol: '☶',
    binary: [1,0,0],
    element: 'Earth',
    direction: 'Northeast',
    family: '3rd Son',
    body: 'Hand',
    color: 'Brown',
    animal: 'Dog',
    variant: 'pure',
    kleinTool: 'styleControl'
  },
  'gen-moving': {
    name: 'Mountain-Moving',
    symbol: '☶́',
    binary: [1,0,1],
    element: 'Earth',
    direction: 'Northeast',
    family: '3rd Son',
    body: 'Hand',
    color: 'Brown',
    animal: 'Dog',
    variant: 'moving',
    kleinTool: 'paraphrasing'
  },

  // ☴ Wind - Gentle
  'xun': {
    name: 'Wind',
    symbol: '☴',
    binary: [1,1,0],
    element: 'Wood',
    direction: 'Southeast',
    family: '1st Daughter',
    body: 'Thigh',
    color: 'Green',
    animal: 'Fowl',
    variant: 'pure',
    kleinTool: 'syntacticDepend'
  },
  'xun-moving': {
    name: 'Wind-Moving',
    symbol: '☴́',
    binary: [1,1,1],
    element: 'Wood',
    direction: 'Southeast',
    family: '1st Daughter',
    body: 'Thigh',
    color: 'Green',
    animal: 'Fowl',
    variant: 'moving',
    kleinTool: 'culturalPattern'
  },

  // ☲ Fire - Clinging
  'li': {
    name: 'Fire',
    symbol: '☲',
    binary: [1,0,1],
    element: 'Fire',
    direction: 'South',
    family: '2nd Daughter',
    body: 'Eye',
    color: 'Red',
    animal: 'Pheasant',
    variant: 'pure',
    kleinTool: 'analogyEngine'
  },
  'li-moving': {
    name: 'Fire-Moving',
    symbol: '☲́',
    binary: [1,0,0],
    element: 'Fire',
    direction: 'South',
    family: '2nd Daughter',
    body: 'Eye',
    color: 'Red',
    animal: 'Pheasant',
    variant: 'moving',
    kleinTool: 'transformationLearner'
  },

  // ☱ Lake - Joyous
  'dui': {
    name: 'Lake',
    symbol: '☱',
    binary: [0,1,1],
    element: 'Metal',
    direction: 'West',
    family: '3rd Daughter',
    body: 'Mouth',
    color: 'White',
    animal: 'Sheep',
    variant: 'pure',
    kleinTool: 'messy'
  },
  'dui-moving': {
    name: 'Lake-Moving',
    symbol: '☱́',
    binary: [0,1,0],
    element: 'Metal',
    direction: 'West',
    family: '3rd Daughter',
    body: 'Mouth',
    color: 'White',
    animal: 'Sheep',
    variant: 'moving',
    kleinTool: 'novelWriter'
  }
};

// 8 Houses (from Klein's I Ching paper)
window.HOUSES = {
  1: { name: 'The Creative', base: '111111', trigram: 'qian', element: 'Wood/Fire' },
  2: { name: 'The Abysmal', base: '010010', trigram: 'kan', element: 'Water' },
  3: { name: 'Keeping Still', base: '100100', trigram: 'gen', element: 'Earth/Metal' },
  4: { name: 'The Arousing', base: '001001', trigram: 'zhen', element: 'Wood' },
  5: { name: 'The Gentle', base: '110110', trigram: 'xun', element: 'Wood' },
  6: { name: 'The Clinging', base: '101101', trigram: 'li', element: 'Fire' },
  7: { name: 'The Receptive', base: '000000', trigram: 'kun', element: 'Earth' },
  8: { name: 'The Joyous', base: '011011', trigram: 'dui', element: 'Metal' }
};

// Trigram lookup by binary
window.TRIGRAM_BY_BINARY = {
  '111': 'qian', '000': 'kun', '001': 'zhen', '010': 'kan',
  '100': 'gen', '110': 'xun', '101': 'li', '011': 'dui'
};