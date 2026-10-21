// FIBONACCI ENGINE: Recurrence Scheduling
// Controls: recurrence timing, memory revisit, amplification, attention cycling

class FibonacciEngine {
  constructor() {
    this.sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
    this.memory = new Map();
    this.schedule = new Map();
    this.cycle = 0;
  }

  // Schedule a memory revisit
  scheduleRevisit(key, depth = 0) {
    const delay = this.sequence[Math.min(depth, this.sequence.length - 1)];
    const scheduledTime = Date.now() + delay * 1000;

    this.schedule.set(key, {
      scheduled: scheduledTime,
      depth: depth,
      delay: delay
    });

    return delay;
  }

  // Check if any scheduled items are due
  checkSchedule() {
    const now = Date.now();
    const due = [];

    for (const [key, item] of this.schedule) {
      if (now >= item.scheduled) {
        due.push({ key, ...item });
        this.schedule.delete(key);
      }
    }

    return due;
  }

  // Amplify a memory based on recurrence count
  amplify(key, value) {
    if (!this.memory.has(key)) {
      this.memory.set(key, { value, count: 1, weight: 1 });
      return 1;
    }

    const mem = this.memory.get(key);
    mem.count++;
    mem.weight = this.fibonacciWeight(mem.count);

    return mem.weight;
  }

  fibonacciWeight(count) {
    const idx = Math.min(count - 1, this.sequence.length - 1);
    return this.sequence[idx] / this.sequence[this.sequence.length - 1];
  }

  // Get attention cycle for a node
  getAttentionCycle(nodeId) {
    const hash = this.hashString(nodeId);
    const cycleLength = this.sequence[hash % this.sequence.length];
    const phase = this.cycle % cycleLength;

    return {
      cycleLength,
      phase,
      attention: phase === 0 ? 1 : 1 / (phase + 1)
    };
  }

  // Advance the global cycle
  tick() {
    this.cycle++;
    return this.checkSchedule();
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Reinforce attractor
  reinforceAttractor(key, strength) {
    const mem = this.memory.get(key);
    if (mem) {
      mem.weight += strength;
      mem.weight = Math.min(mem.weight, 1);
    }
  }
}

window.FibonacciEngine = FibonacciEngine;