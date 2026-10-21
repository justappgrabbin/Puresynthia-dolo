"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReciprocalPathResolver = void 0;
class ReciprocalPathResolver {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    findReciprocal(forward) {
        const candidates = this.graph.getOutgoingTransitions(forward.resultantNodeId);
        for (const t of candidates) {
            if (t.resultantNodeId === forward.rootNodeId) {
                return t;
            }
        }
        return null;
    }
    analyzePair(forward) {
        const reverse = this.findReciprocal(forward);
        if (!reverse)
            return null;
        const fwInterp = forward.semanticInterpretation;
        const rvInterp = reverse.semanticInterpretation;
        const sharedVocab = [];
        const mirrored = [];
        if (fwInterp && rvInterp) {
            const fwTerms = new Set([
                ...fwInterp.rootMeaning,
                ...fwInterp.resultantMeaning,
            ]);
            const rvTerms = new Set([
                ...rvInterp.rootMeaning,
                ...rvInterp.resultantMeaning,
            ]);
            for (const term of fwTerms) {
                if (rvTerms.has(term))
                    sharedVocab.push(term);
            }
        }
        const structSim = this.structuralSimilarity(forward, reverse);
        return {
            forward,
            reverse,
            sharedVocabulary: sharedVocab,
            mirroredConcepts: mirrored,
            structuralSimilarity: structSim,
        };
    }
    structuralSimilarity(a, b) {
        const aSet = new Set(a.changedDimensions);
        const bSet = new Set(b.changedDimensions);
        let common = 0;
        for (const d of aSet)
            if (bSet.has(d))
                common++;
        const total = new Set([...a.changedDimensions, ...b.changedDimensions]).size;
        return total === 0 ? 0 : common / total;
    }
    getAllReciprocalPairs(nodeId) {
        const outgoing = this.graph.getOutgoingTransitions(nodeId);
        const pairs = [];
        for (const t of outgoing) {
            const pair = this.analyzePair(t);
            if (pair)
                pairs.push(pair);
        }
        return pairs;
    }
}
exports.ReciprocalPathResolver = ReciprocalPathResolver;
//# sourceMappingURL=ReciprocalPathResolver.js.map