"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrammarInducer = void 0;
class GrammarInducer {
    rules = [];
    versionCounter = 1;
    learn(examples) {
        const learned = [];
        for (const ex of examples) {
            if (!ex.valid)
                continue;
            for (let i = 0; i < ex.sequence.length - 1; i++) {
                const pattern = ex.sequence[i];
                const next = ex.sequence[i + 1];
                const existing = this.rules.find((r) => r.pattern === pattern);
                if (existing) {
                    if (!existing.validNext.includes(next)) {
                        existing.validNext.push(next);
                        existing.version++;
                    }
                }
                else {
                    const rule = {
                        id: `gram-${Date.now()}-${i}`,
                        pattern,
                        validNext: [next],
                        constraints: [],
                        version: this.versionCounter++,
                        confidence: 0.5,
                    };
                    this.rules.push(rule);
                    learned.push(rule);
                }
            }
        }
        return learned;
    }
    validate(sequence) {
        const trace = [];
        for (let i = 0; i < sequence.length - 1; i++) {
            const rule = this.rules.find((r) => r.pattern === sequence[i]);
            if (!rule || !rule.validNext.includes(sequence[i + 1])) {
                trace.push({ step: i + 1, operation: "grammar_check", input: `${sequence[i]}→${sequence[i + 1]}`, output: "invalid", confidence: 0 });
                return { valid: false, trace };
            }
        }
        trace.push({ step: 1, operation: "grammar_check", input: sequence.join(" "), output: "valid", confidence: 0.95 });
        return { valid: true, trace };
    }
    getRules() {
        return this.rules;
    }
}
exports.GrammarInducer = GrammarInducer;
//# sourceMappingURL=GrammarInducer.js.map