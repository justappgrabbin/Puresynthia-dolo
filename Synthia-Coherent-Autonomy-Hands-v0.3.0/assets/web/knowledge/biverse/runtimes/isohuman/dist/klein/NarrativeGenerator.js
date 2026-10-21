"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeGenerator = void 0;
class NarrativeGenerator {
    generate(transitions, title = "Narrative") {
        const trace = [];
        const sentences = [];
        for (let i = 0; i < transitions.length; i++) {
            const t = transitions[i];
            const interp = t.semanticInterpretation;
            if (interp) {
                sentences.push(`From ${interp.rootMeaning.join(", ")}, through ${interp.operatorMeaning.join(", ")}, toward ${interp.resultantMeaning.join(", ")}.`);
            }
            else {
                sentences.push(`Transition ${t.id}: ${t.rootNodeId} → ${t.resultantNodeId} via ${t.operatorType}.`);
            }
            trace.push({ step: i + 1, operation: "narrative_step", input: t.id, output: sentences[sentences.length - 1], confidence: 0.8 });
        }
        return {
            output: sentences.join(" "),
            sourceStates: transitions.map((t) => t.rootNodeId),
            rulesUsed: [],
            transformationsUsed: transitions.map((t) => t.id),
            inferredRelations: [],
            unresolvedAmbiguities: [],
            structuralValidity: 0.85,
            semanticCoherence: 0.8,
            noveltyScore: 0.3,
            explanationTrace: trace,
        };
    }
}
exports.NarrativeGenerator = NarrativeGenerator;
//# sourceMappingURL=NarrativeGenerator.js.map