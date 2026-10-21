"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossingResolver = void 0;
class CrossingResolver {
    crossings = [];
    detectCrossing(nodeA, nodeB, activationThreshold = 0.3) {
        const overlap = this.computeOverlap(nodeA, nodeB);
        if (overlap < activationThreshold)
            return null;
        const event = {
            id: `cross-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            nodeAId: nodeA.id,
            nodeBId: nodeB.id,
            overlapScore: overlap,
            timestamp: new Date().toISOString(),
            resolved: false,
        };
        this.crossings.push(event);
        return event;
    }
    computeOverlap(a, b) {
        const opA = a.operators;
        const opB = b.operators;
        const diff = Math.abs(opA.being - opB.being) +
            Math.abs(opA.design - opB.design) +
            Math.abs(opA.movement - opB.movement) +
            Math.abs(opA.evolution - opB.evolution) +
            Math.abs(opA.space - opB.space);
        return Math.max(0, 1 - diff / 5);
    }
    resolveCrossing(eventId, adapterId) {
        const evt = this.crossings.find((c) => c.id === eventId);
        if (evt) {
            evt.resolved = true;
            evt.adapterRequired = adapterId;
        }
    }
    getActiveCrossings() {
        return this.crossings.filter((c) => !c.resolved);
    }
    getCrossingsForNode(nodeId) {
        return this.crossings.filter((c) => (c.nodeAId === nodeId || c.nodeBId === nodeId) && !c.resolved);
    }
}
exports.CrossingResolver = CrossingResolver;
//# sourceMappingURL=CrossingResolver.js.map