"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReversibleCorrection = void 0;
class ReversibleCorrection {
    memory;
    constructor(memory) {
        this.memory = memory;
    }
    apply(request) {
        const previous = this.requireCandidate(request.candidateId);
        const next = request.replacement
            ? {
                ...structuredClone(request.replacement),
                id: previous.id,
                revision: previous.revision + 1,
            }
            : {
                ...previous,
                status: request.decision === "approve"
                    ? "approved"
                    : request.decision === "reject"
                        ? "rejected"
                        : "superseded",
                revision: previous.revision + 1,
            };
        const revision = {
            id: `revision:${previous.id}:${next.revision}`,
            candidateId: previous.id,
            previous,
            next,
            reason: request.reason,
            createdAt: new Date().toISOString(),
        };
        this.memory.replaceCandidate(next);
        this.memory.recordRevision(revision);
        return revision;
    }
    rollback(revisionId, reason) {
        const original = this.memory.getRevision(revisionId);
        if (!original)
            throw new Error(`Unknown revision ${revisionId}`);
        const current = this.requireCandidate(original.candidateId);
        const restored = {
            ...structuredClone(original.previous),
            revision: current.revision + 1,
        };
        const rollback = {
            id: `revision:${current.id}:${restored.revision}`,
            candidateId: current.id,
            previous: current,
            next: restored,
            reason,
            createdAt: new Date().toISOString(),
            reversedRevisionId: revisionId,
        };
        this.memory.replaceCandidate(restored);
        this.memory.recordRevision(rollback);
        return rollback;
    }
    requireCandidate(id) {
        const candidate = this.memory.getCandidate(id);
        if (!candidate)
            throw new Error(`Unknown candidate ${id}`);
        return candidate;
    }
}
exports.ReversibleCorrection = ReversibleCorrection;
//# sourceMappingURL=ReversibleCorrection.js.map