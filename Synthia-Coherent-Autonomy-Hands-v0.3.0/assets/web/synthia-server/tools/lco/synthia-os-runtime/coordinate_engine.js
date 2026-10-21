/**
 * 13-Layer Coordinate Engine
 * ==========================
 *
 * Full addressing system for the 3.35 quintillion state space.
 *
 * Layers:
 *   1. Planet  (0-12)    - 13 values
 *   2. Gate    (0-63)    - 64 values
 *   3. Line    (0-5)     - 6 values
 *   4. Color   (0-5)     - 6 values
 *   5. Tone    (0-5)     - 6 values
 *   6. Base    (0-4)     - 5 values
 *   7. Degree  (0-359)   - 360 values
 *   8. Minute  (0-59)    - 60 values
 *   9. Second  (0-59)    - 60 values
 *  10. Arc     (0-359)   - 360 values
 *  11. Zodiac  (0-11)    - 12 values
 *  12. House   (0-11)    - 12 values
 *  13. Season  (0-3)     - 4 values
 *
 * Total: 13 × 64 × 6 × 6 × 6 × 5 × 360 × 60 × 60 × 360 × 12 × 12 × 4
 *       = 3,881,779,200 (Side A: Zodiac/House)
 *
 * Side B: Season/House variant
 *       = 862,617,600
 *
 * Combined: 3.35 quintillion
 */

class CoordinateEngine {
  constructor() {
    // Layer definitions
    this.layers = [
      { name: 'planet',  range: 13,  labels: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node', 'Earth'] },
      { name: 'gate',    range: 64,  labels: this._generateGateLabels() },
      { name: 'line',    range: 6,   labels: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6'] },
      { name: 'color',   range: 6,   labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet'] },
      { name: 'tone',    range: 6,   labels: ['C', 'D', 'E', 'F', 'G', 'A'] },
      { name: 'base',    range: 5,   labels: ['Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat'] },
      { name: 'degree',  range: 360, labels: null },  // 0-359 degrees
      { name: 'minute',  range: 60,  labels: null },  // 0-59 minutes
      { name: 'second',  range: 60,  labels: null },  // 0-59 seconds
      { name: 'arc',     range: 360, labels: null },  // 0-359 arc minutes
      { name: 'zodiac',  range: 12,  labels: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
      { name: 'house',   range: 12,  labels: ['1st House', '2nd House', '3rd House', '4th House', '5th House', '6th House', '7th House', '8th House', '9th House', '10th House', '11th House', '12th House'] },
      { name: 'season',  range: 4,   labels: ['Spring', 'Summer', 'Autumn', 'Winter'] }
    ];

    // Multipliers for address computation
    this.multipliers = this._computeMultipliers();

    // Total address space
    this.totalAddressSpace = this._computeTotalSpace();
  }

  _generateGateLabels() {
    const labels = [];
    for (let i = 1; i <= 64; i++) {
      labels.push(`Gate ${i}`);
    }
    return labels;
  }

  _computeMultipliers() {
    const mults = [1];
    for (let i = this.layers.length - 1; i > 0; i--) {
      mults.unshift(mults[0] * this.layers[i].range);
    }
    return mults;
  }

  _computeTotalSpace() {
    return this.layers.reduce((total, layer) => total * layer.range, 1);
  }

  /**
   * Convert coordinates to a single address number.
   */
  toAddress(coords) {
    let address = 0;
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const value = coords[layer.name] || 0;
      address += value * this.multipliers[i];
    }
    return address;
  }

  /**
   * Convert address number to coordinates.
   */
  fromAddress(address) {
    const coords = {};
    let remaining = address;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      coords[layer.name] = Math.floor(remaining / this.multipliers[i]) % layer.range;
      remaining = remaining % this.multipliers[i];
    }

    return coords;
  }

  /**
   * Get the label for a coordinate value.
   */
  getLabel(layerName, value) {
    const layer = this.layers.find(l => l.name === layerName);
    if (!layer || !layer.labels) return `${value}`;
    return layer.labels[value] || `${value}`;
  }

  /**
   * Compute the "Side A" address (Zodiac/House side).
   */
  toSideA(coords) {
    // Side A: Planet, Gate, Line, Color, Tone, Base, Degree, Minute, Second, Arc, Zodiac, House
    const sideALayers = ['planet', 'gate', 'line', 'color', 'tone', 'base', 'degree', 'minute', 'second', 'arc', 'zodiac', 'house'];
    let address = 0;
    let multiplier = 1;

    for (let i = sideALayers.length - 1; i >= 0; i--) {
      const layerName = sideALayers[i];
      const layer = this.layers.find(l => l.name === layerName);
      const value = coords[layerName] || 0;
      address += value * multiplier;
      multiplier *= layer.range;
    }

    return address;
  }

  /**
   * Compute the "Side B" address (Season/House side).
   */
  toSideB(coords) {
    // Side B: Planet, Gate, Line, Color, Tone, Base, Season, House
    const sideBLayers = ['planet', 'gate', 'line', 'color', 'tone', 'base', 'season', 'house'];
    let address = 0;
    let multiplier = 1;

    for (let i = sideBLayers.length - 1; i >= 0; i--) {
      const layerName = sideBLayers[i];
      const layer = this.layers.find(l => l.name === layerName);
      const value = coords[layerName] || 0;
      address += value * multiplier;
      multiplier *= layer.range;
    }

    return address;
  }

  /**
   * Compute resonance between two coordinate sets.
   * High resonance = aligned coordinates.
   */
  computeResonance(coordsA, coordsB) {
    let resonance = 0;
    let totalWeight = 0;

    for (const layer of this.layers) {
      const a = coordsA[layer.name] || 0;
      const b = coordsB[layer.name] || 0;
      const diff = Math.abs(a - b);
      const maxDiff = layer.range / 2;
      const similarity = 1 - Math.min(diff, maxDiff) / maxDiff;

      // Weight by layer importance
      const weight = layer.name === 'gate' ? 3 :
                      layer.name === 'zodiac' ? 2 :
                      layer.name === 'house' ? 2 : 1;

      resonance += similarity * weight;
      totalWeight += weight;
    }

    return resonance / totalWeight;
  }

  /**
   * Compute the emergent properties (degree, minute, second, arc)
   * from the primary coordinates.
   */
  computeEmergent(coords) {
    // Degree emerges from gate + line interaction
    const degree = ((coords.gate || 0) * 6 + (coords.line || 0)) % 360;

    // Minute emerges from color + tone interaction
    const minute = ((coords.color || 0) * 6 + (coords.tone || 0)) % 60;

    // Second emerges from base + planet interaction
    const second = ((coords.base || 0) * 13 + (coords.planet || 0)) % 60;

    // Arc emerges from zodiac + house interaction
    const arc = ((coords.zodiac || 0) * 12 + (coords.house || 0)) * 30 % 360;

    return { degree, minute, second, arc };
  }

  /**
   * Get stats about the coordinate space.
   */
  getStats() {
    return {
      totalLayers: this.layers.length,
      totalAddressSpace: this.totalAddressSpace,
      sideASpace: this.toSideA(this._maxCoords()),
      sideBSpace: this.toSideB(this._maxCoords()),
      layerBreakdown: this.layers.map(l => ({
        name: l.name,
        range: l.range,
        hasLabels: !!l.labels
      }))
    };
  }

  _maxCoords() {
    const coords = {};
    for (const layer of this.layers) {
      coords[layer.name] = layer.range - 1;
    }
    return coords;
  }
}

const CoordinateModule = { CoordinateEngine };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoordinateModule;
}

if (typeof window !== 'undefined') {
  window.CoordinateEngine = CoordinateModule;
}
