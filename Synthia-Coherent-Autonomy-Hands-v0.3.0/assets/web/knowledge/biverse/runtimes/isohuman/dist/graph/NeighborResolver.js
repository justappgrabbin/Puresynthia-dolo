"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeighborResolver = void 0;
const HammingResolver_1 = require("../topology/HammingResolver");
class NeighborResolver {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    getHammingNeighbors(nodeId, distance = 1) {
        const node = this.graph.getNode(nodeId);
        if (!node)
            return [];
        const patterns = HammingResolver_1.HammingResolver.neighbors(node.binaryPattern, distance);
        return patterns
            .map((p) => this.graph.getNodeByBinaryPattern(p))
            .filter((n) => n !== undefined);
    }
    getStructuralNeighbors(nodeId) {
        const relations = this.graph.getRelationsForNode(nodeId);
        return relations
            .filter((r) => r.type === "neighbor")
            .map((r) => r.sourceNodeId === nodeId
            ? this.graph.getNode(r.targetNodeId)
            : this.graph.getNode(r.sourceNodeId))
            .filter((n) => n !== undefined);
    }
    getAllNeighbors(nodeId) {
        const hamming = this.getHammingNeighbors(nodeId);
        const structural = this.getStructuralNeighbors(nodeId);
        const seen = new Set(hamming.map((n) => n.id));
        for (const n of structural) {
            if (!seen.has(n.id))
                hamming.push(n);
        }
        return hamming;
    }
}
exports.NeighborResolver = NeighborResolver;
//# sourceMappingURL=NeighborResolver.js.map