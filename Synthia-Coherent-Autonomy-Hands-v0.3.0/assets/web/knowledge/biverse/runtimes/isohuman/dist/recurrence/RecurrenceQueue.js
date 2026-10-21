"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceQueue = void 0;
class RecurrenceQueue {
    queue = [];
    currentTick = 0;
    enqueue(nodeId, tick, priority = 1) {
        this.queue.push({ nodeId, tick, priority });
        this.queue.sort((a, b) => a.tick - b.tick || b.priority - a.priority);
    }
    dequeueUpTo(tick) {
        const results = [];
        while (this.queue.length > 0 && this.queue[0].tick <= tick) {
            results.push(this.queue.shift());
        }
        return results;
    }
    advance(steps = 1) {
        this.currentTick += steps;
        return this.currentTick;
    }
    getCurrentTick() {
        return this.currentTick;
    }
    getPending() {
        return [...this.queue];
    }
}
exports.RecurrenceQueue = RecurrenceQueue;
//# sourceMappingURL=RecurrenceQueue.js.map