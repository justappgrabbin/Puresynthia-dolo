"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionGraph = void 0;
class ConnectionGraph {
    edges = new Map();
    relations = new Map();
    addRelation(relation) {
        this.relations.set(relation.id, relation);
        if (!this.edges.has(relation.sourceNodeId)) {
            this.edges.set(relation.sourceNodeId, new Set());
        }
        this.edges.get(relation.sourceNodeId).add(relation.targetNodeId);
        if (relation.bidirectional) {
            if (!this.edges.has(relation.targetNodeId)) {
                this.edges.set(relation.targetNodeId, new Set());
            }
            this.edges.get(relation.targetNodeId).add(relation.sourceNodeId);
        }
    }
    getRelationsForNode(nodeId) {
        return Array.from(this.relations.values()).filter((r) => r.sourceNodeId === nodeId || (r.bidirectional && r.targetNodeId === nodeId));
    }
    getNeighbors(nodeId) {
        return Array.from(this.edges.get(nodeId) || []);
    }
    getRelation(id) {
        return this.relations.get(id);
    }
    removeRelation(id) {
        const rel = this.relations.get(id);
        if (!rel)
            return;
        this.edges.get(rel.sourceNodeId)?.delete(rel.targetNodeId);
        if (rel.bidirectional) {
            this.edges.get(rel.targetNodeId)?.delete(rel.sourceNodeId);
        }
        this.relations.delete(id);
    }
    getAllRelations() {
        return Array.from(this.relations.values());
    }
}
exports.ConnectionGraph = ConnectionGraph;
//# sourceMappingURL=ConnectionGraph.js.map