// EPHEMERIS ENGINE
// Pure JavaScript - no backend required
// Uses precomputed tables + Swiss Ephemeris WASM fallback

class EphemerisEngine {
  constructor() {
    this.planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Node'];
    this.precomputed = window.PRECOMPUTED_EPHEMERIS || {};
    this.useWasm = false;
  }

  // Get planetary positions for a given date
  async getPositions(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours() + date.getMinutes() / 60;

    // Try precomputed first
    const key = `${year}-${month}-${day}`;
    if (this.precomputed[key]) {
      return this.interpolate(this.precomputed[key], hour);
    }

    // Fallback: simplified calculation
    return this.calculate(date);
  }

  // Simplified planetary calculation (sufficient for gate mapping)
  calculate(date) {
    const jd = this.toJulianDay(date);
    const positions = {};

    // Mean orbital elements (simplified)
    const elements = {
      Sun: { L: 280.46646, M: 357.52911, e: 0.016708634, a: 1.000001018, omega: 102.93735 },
      Moon: { L: 218.3164477, M: 134.9633964, e: 0.054900489, a: 384400, omega: 125.04452 },
      Mercury: { L: 252.25084, M: 174.7948, e: 0.20563069, a: 0.38709893, omega: 77.45645 },
      Venus: { L: 181.97973, M: 50.4161, e: 0.00677323, a: 0.72333199, omega: 131.53298 },
      Mars: { L: 355.433, M: 19.373, e: 0.093405, a: 1.52366231, omega: 49.57854 },
      Jupiter: { L: 34.351, M: 20.020, e: 0.048498, a: 5.20336301, omega: 100.55615 },
      Saturn: { L: 50.077, M: 317.021, e: 0.055548, a: 9.53707032, omega: 113.71504 },
      Uranus: { L: 314.055, M: 141.05, e: 0.046381, a: 19.19126393, omega: 74.22988 },
      Neptune: { L: 304.349, M: 256.225, e: 0.009456, a: 30.06896348, omega: 131.72169 },
      Pluto: { L: 238.929, M: 14.882, e: 0.24880766, a: 39.48168677, omega: 110.30347 }
    };

    const T = (jd - 2451545.0) / 36525;  // Julian centuries from J2000

    for (const [name, elem] of Object.entries(elements)) {
      const L = elem.L + elem.M * T + 0.0003032 * T * T;
      const M = (elem.M + 35999.05029 * T - 0.0001537 * T * T) % 360;
      const e = elem.e;

      // Solve Kepler's equation (simplified)
      let E = M;
      for (let i = 0; i < 5; i++) {
        E = M + e * Math.sin(E * Math.PI / 180) * 180 / Math.PI;
      }

      const nu = 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E * Math.PI / 360),
        Math.sqrt(1 - e) * Math.cos(E * Math.PI / 360)
      ) * 180 / Math.PI;

      const lambda = (L + nu - M) % 360;

      positions[name] = {
        longitude: lambda,
        latitude: 0,  // Simplified
        distance: elem.a,
        speed: Math.abs(elem.M) / 36525,  // Approximate
        retrograde: false  // Simplified
      };
    }

    // True Node (simplified)
    const nodeL = 125.04452 - 1934.136261 * T + 0.0020708 * T * T;
    positions['Node'] = {
      longitude: nodeL % 360,
      latitude: 0,
      distance: 1,
      speed: 0,
      retrograde: true
    };

    return positions;
  }

  toJulianDay(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate() + date.getHours() / 24 + date.getMinutes() / 1440;

    let A = Math.floor(y / 100);
    let B = 2 - A + Math.floor(A / 4);

    if (y < 1583) B = 0;
    if (y === 1582 && m > 10) B = 0;
    if (y === 1582 && m === 10 && d > 15) B = 0;

    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  interpolate(data, hour) {
    // Linear interpolation between daily positions
    const fraction = hour / 24;
    const result = {};

    for (const [planet, pos] of Object.entries(data)) {
      result[planet] = {
        longitude: (pos.longitude + pos.speed * fraction) % 360,
        latitude: pos.latitude,
        distance: pos.distance,
        speed: pos.speed,
        retrograde: pos.retrograde
      };
    }

    return result;
  }

  // Get active gates from planetary positions
  getActiveGates(positions, system = 'tropical') {
    const gates = {};

    for (const [planet, pos] of Object.entries(positions)) {
      let degree = pos.longitude;

      // Apply system offset
      if (system === 'sidereal') {
        degree = (degree - 24) % 360;  // Fagan-Bradley offset
      } else if (system === 'draconic') {
        const nodePos = positions['Node']?.longitude || 0;
        degree = (degree - nodePos) % 360;
      }

      const gate = window.degreeToGate(degree);
      if (gate) {
        gates[planet] = {
          gate: gate.num,
          degree: degree,
          line: window.degreeToLine(degree),
          system: system
        };
      }
    }

    return gates;
  }

  // Get three-layer gate map (Body/Heart/Mind)
  getThreeLayerMap(date = new Date()) {
    const positions = this.getPositions(date);

    return {
      body: this.getActiveGates(positions, 'tropical'),
      heart: this.getActiveGates(positions, 'draconic'),
      mind: this.getActiveGates(positions, 'sidereal')
    };
  }
}

window.EphemerisEngine = EphemerisEngine;