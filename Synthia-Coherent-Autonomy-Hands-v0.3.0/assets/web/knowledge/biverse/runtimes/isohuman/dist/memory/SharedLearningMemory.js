"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedLearningMemory = void 0;
function clone(value) {
    return structuredClone(value);
}
class SharedLearningMemory {
    observations = new Map();
    normalizations = new Map();
    candidates = new Map();
    revisions = [];
    recordObservation(observation) {
        const existing = this.observations.get(observation.id);
        if (existing && JSON.stringify(existing) !== JSON.stringify(observation)) {
            throw new Error(`Source observation ${observation.id} is immutable`);
        }
        this.observations.set(observation.id, clone(observation));
    }
    proposeNormalization(proposal) {
        if (!this.observations.has(proposal.observationId)) {
            throw new Error(`Unknown observation ${proposal.observationId}`);
        }
        this.normalizations.set(proposal.id, clone(proposal));
    }
    addCandidate(candidate) {
        for (const observationId of candidate.observationIds) {
            if (!this.observations.has(observationId)) {
                throw new Error(`Unknown observation ${observationId}`);
            }
        }
        this.candidates.set(candidate.id, clone(candidate));
    }
    getCandidate(id) {
        const candidate = this.candidates.get(id);
        return candidate ? clone(candidate) : undefined;
    }
    replaceCandidate(candidate) {
        if (!this.candidates.has(candidate.id)) {
            throw new Error(`Unknown candidate ${candidate.id}`);
        }
        this.candidates.set(candidate.id, clone(candidate));
    }
    recordRevision(revision) {
        this.revisions.push(clone(revision));
    }
    getRevision(id) {
        const revision = this.revisions.find((item) => item.id === id);
        return revision ? clone(revision) : undefined;
    }
    approvedKnowledge() {
        return [...this.candidates.values()]
            .filter((candidate) => candidate.status === "approved")
            .map(clone);
    }
    snapshot() {
        return {
            observations: [...this.observations.values()].map(clone),
            normalizations: [...this.normalizations.values()].map(clone),
            candidates: [...this.candidates.values()].map(clone),
            revisions: this.revisions.map(clone),
        };
    }
    restore(snapshot) {
        this.observations = new Map(snapshot.observations.map((item) => [item.id, clone(item)]));
        this.normalizations = new Map(snapshot.normalizations.map((item) => [item.id, clone(item)]));
        this.candidates = new Map(snapshot.candidates.map((item) => [item.id, clone(item)]));
        this.revisions = snapshot.revisions.map(clone);
    }
}
exports.SharedLearningMemory = SharedLearningMemory;
//# sourceMappingURL=SharedLearningMemory.js.map