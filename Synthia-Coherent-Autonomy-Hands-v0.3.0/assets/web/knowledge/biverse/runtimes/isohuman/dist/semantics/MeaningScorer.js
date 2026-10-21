"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeaningScorer = void 0;
const NeighborResolver_1 = require("../graph/NeighborResolver");
class MeaningScorer {
    graph;
    neighborResolver;
    constructor(graph) {
        this.graph = graph;
        this.neighborResolver = new NeighborResolver_1.NeighborResolver(graph);
    }
    computeSupport(node, item) {
        const addressSupport = this.scoreAddress(node, item);
        const neighborSupport = this.scoreNeighbors(node, item);
        const contrastSupport = this.scoreContrasts(node, item);
        const transitionSupport = this.scoreTransitions(node, item);
        const historicalSupport = this.scoreHistorical(node, item);
        const observationalSupport = this.scoreObservational(node, item);
        const total = addressSupport * 0.20 +
            neighborSupport * 0.15 +
            contrastSupport * 0.15 +
            transitionSupport * 0.20 +
            historicalSupport * 0.10 +
            observationalSupport * 0.20;
        return {
            addressSupport,
            neighborSupport,
            contrastSupport,
            transitionSupport,
            historicalSupport,
            observationalSupport,
            totalScore: total,
        };
    }
    scoreAddress(node, item) {
        const addrTerms = [
            node.address.dimension,
            node.address.planet || "",
            String(node.address.gate || ""),
            String(node.address.line || ""),
        ];
        return addrTerms.some((t) => item.term.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(item.term.toLowerCase()))
            ? 0.7 + Math.random() * 0.3
            : 0.3;
    }
    scoreNeighbors(node, item) {
        const neighbors = this.neighborResolver.getAllNeighbors(node.id);
        if (neighbors.length === 0)
            return 0.3;
        let shared = 0;
        for (const n of neighbors) {
            const hasTerm = n.semanticField.center.some((i) => i.term === item.term) ||
                n.semanticField.central.some((i) => i.term === item.term);
            if (hasTerm)
                shared++;
        }
        return Math.min(1, shared / Math.max(1, neighbors.length) + 0.2);
    }
    scoreContrasts(node, item) {
        const relations = this.graph.getRelationsForNode(node.id).filter((r) => r.type === "contrast");
        if (relations.length === 0)
            return 0.3;
        return 0.5;
    }
    scoreTransitions(node, item) {
        const outgoing = this.graph.getOutgoingTransitions(node.id);
        const incoming = this.graph.getIncomingTransitions(node.id);
        if (outgoing.length + incoming.length === 0)
            return 0.3;
        return 0.6;
    }
    scoreHistorical(node, item) {
        return item.sourceIds.length > 0 ? 0.5 + Math.min(0.5, item.sourceIds.length * 0.1) : 0.2;
    }
    scoreObservational(node, item) {
        return item.contexts.length > 0 ? 0.5 + Math.min(0.5, item.contexts.length * 0.1) : 0.2;
    }
}
exports.MeaningScorer = MeaningScorer;
//# sourceMappingURL=MeaningScorer.js.map