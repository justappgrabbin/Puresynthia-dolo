"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FibonacciScheduler = void 0;
// ============================================================================
// Fibonacci Recurrence Engine — Nonlinear revisit timing
// ============================================================================
class FibonacciScheduler {
    sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    schedule = new Map();
    scheduleRecurrence(nodeId, depth = 0) {
        const offsets = this.sequence.slice(0, Math.min(depth + 3, this.sequence.length));
        this.schedule.set(nodeId, offsets);
        return offsets;
    }
    getNextVisit(nodeId, currentTick) {
        const offsets = this.schedule.get(nodeId);
        if (!offsets)
            return null;
        for (const offset of offsets) {
            const visit = currentTick + offset;
            if (visit > currentTick)
                return visit;
        }
        return null;
    }
    getSchedule(nodeId) {
        return this.schedule.get(nodeId) || [];
    }
    remove(nodeId) {
        this.schedule.delete(nodeId);
    }
    static getFibonacci(n) {
        if (n <= 1)
            return 1;
        let a = 1, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
}
exports.FibonacciScheduler = FibonacciScheduler;
//# sourceMappingURL=FibonacciScheduler.js.map