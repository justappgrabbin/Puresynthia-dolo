"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateGraph = void 0;
class StateGraph {
    nodes = new Map();
    relations = new Map();
    transitions = new Map();
    addNode(node) {
        this.nodes.set(node.id, node);
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    addRelation(relation) {
        this.relations.set(relation.id, relation);
        const src = this.nodes.get(relation.sourceNodeId);
        const tgt = this.nodes.get(relation.targetNodeId);
        if (src && !src.relationIds.includes(relation.id)) {
            src.relationIds.push(relation.id);
        }
        if (relation.bidirectional && tgt && !tgt.relationIds.includes(relation.id)) {
            tgt.relationIds.push(relation.id);
        }
    }
    getRelation(id) {
        return this.relations.get(id);
    }
    getRelationsForNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return [];
        return node.relationIds.map((id) => this.relations.get(id)).filter(Boolean);
    }
    addTransition(transition) {
        this.transitions.set(transition.id, transition);
        const src = this.nodes.get(transition.rootNodeId);
        const tgt = this.nodes.get(transition.resultantNodeId);
        if (src && !src.outgoingTransitionIds.includes(transition.id)) {
            src.outgoingTransitionIds.push(transition.id);
        }
        if (tgt && !tgt.incomingTransitionIds.includes(transition.id)) {
            tgt.incomingTransitionIds.push(transition.id);
        }
    }
    getTransition(id) {
        return this.transitions.get(id);
    }
    getOutgoingTransitions(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return [];
        return node.outgoingTransitionIds.map((id) => this.transitions.get(id)).filter(Boolean);
    }
    getIncomingTransitions(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return [];
        return node.incomingTransitionIds.map((id) => this.transitions.get(id)).filter(Boolean);
    }
    getAllTransitions() {
        return Array.from(this.transitions.values());
    }
    getNodeByBinaryPattern(pattern) {
        return this.getAllNodes().find((n) => n.binaryPattern === pattern);
    }
}
exports.StateGraph = StateGraph;
//# sourceMappingURL=StateGraph.js.map