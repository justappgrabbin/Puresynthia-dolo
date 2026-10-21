"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutolingEngine = void 0;
class AutolingEngine {
    rules = [];
    induceRule(examples) {
        if (examples.length < 2)
            return null;
        const rule = {
            id: `rule-${Date.now()}`,
            inputPattern: examples[0].input,
            transformation: { type: "induced_mapping", parameters: { exampleCount: examples.length } },
            outputPattern: examples[0].output,
            constraints: [],
            exceptions: [],
            supportExampleIds: examples.map((_, i) => `ex-${i}`),
            counterexampleIds: [],
            confidence: Math.min(1, examples.length * 0.25),
            status: examples.length >= 3 ? "provisional" : "candidate",
            provenance: [{
                    id: `prov-${Date.now()}`, category: "derived_operator", source: "AutolingEngine",
                    description: `Induced from ${examples.length} examples`, timestamp: new Date().toISOString()
                }],
            explanationTrace: [{
                    step: 1, operation: "induce_rule", input: examples.length, output: "rule_created", confidence: Math.min(1, examples.length * 0.25)
                }],
        };
        this.rules.push(rule);
        return rule;
    }
    getRules() {
        return this.rules;
    }
    validateRule(ruleId, testInput) {
        const rule = this.rules.find((r) => r.id === ruleId);
        if (!rule)
            return { valid: false, trace: [{ step: 1, operation: "validate", input: ruleId, output: "rule_not_found", confidence: 0 }] };
        const match = this.patternMatch(rule.inputPattern, testInput);
        return {
            valid: match,
            trace: [{ step: 1, operation: "pattern_match", input: testInput, output: match, confidence: match ? 0.9 : 0.1 }],
        };
    }
    patternMatch(a, b) {
        return JSON.stringify(a.nodes.sort()) === JSON.stringify(b.nodes.sort());
    }
}
exports.AutolingEngine = AutolingEngine;
//# sourceMappingURL=AutolingEngine.js.map