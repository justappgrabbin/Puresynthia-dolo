// FIVE ELEMENTS: Wu Xing Interaction System
// Wood, Fire, Earth, Metal, Water

class FiveElements {
  constructor() {
    this.elements = {
      'Wood': { generates: 'Fire', controls: 'Earth', color: '#228B22' },
      'Fire': { generates: 'Earth', controls: 'Metal', color: '#FF4500' },
      'Earth': { generates: 'Metal', controls: 'Water', color: '#DAA520' },
      'Metal': { generates: 'Water', controls: 'Wood', color: '#C0C0C0' },
      'Water': { generates: 'Wood', controls: 'Fire', color: '#1E90FF' }
    };

    this.trigramElements = {
      'qian': 'Metal', 'kun': 'Earth', 'zhen': 'Wood',
      'xun': 'Wood', 'kan': 'Water', 'gen': 'Earth',
      'li': 'Fire', 'dui': 'Metal'
    };
  }

  // Get element for trigram
  getElement(trigram) {
    return this.trigramElements[trigram] || 'unknown';
  }

  // Check if element A generates element B
  generates(a, b) {
    return this.elements[a]?.generates === b;
  }

  // Check if element A controls element B
  controls(a, b) {
    return this.elements[a]?.controls === b;
  }

  // Compute harmony between two elements
  harmony(a, b) {
    if (a === b) return 1;  // Same element = perfect harmony
    if (this.generates(a, b)) return 0.8;  // Generating = strong harmony
    if (this.generates(b, a)) return 0.6;  // Being generated = moderate harmony
    if (this.controls(a, b)) return 0.3;   // Controlling = tension
    if (this.controls(b, a)) return 0.1;   // Being controlled = conflict
    return 0.5;  // Neutral
  }

  // Get color for element
  getColor(element) {
    return this.elements[element]?.color || '#ffffff';
  }

  // Compute element balance for a set of gates
  balance(gates) {
    const counts = { 'Wood': 0, 'Fire': 0, 'Earth': 0, 'Metal': 0, 'Water': 0 };

    gates.forEach(gate => {
      const upper = this.getElement(gate.upperTrigram);
      const lower = this.getElement(gate.lowerTrigram);
      if (counts[upper] !== undefined) counts[upper]++;
      if (counts[lower] !== undefined) counts[lower]++;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return counts;

    const balance = {};
    for (const [elem, count] of Object.entries(counts)) {
      balance[elem] = count / total;
    }

    return balance;
  }

  // Find dominant element
  dominant(gates) {
    const bal = this.balance(gates);
    let max = 0;
    let dom = 'unknown';

    for (const [elem, val] of Object.entries(bal)) {
      if (val > max) {
        max = val;
        dom = elem;
      }
    }

    return { element: dom, strength: max };
  }
}

window.FiveElements = FiveElements;