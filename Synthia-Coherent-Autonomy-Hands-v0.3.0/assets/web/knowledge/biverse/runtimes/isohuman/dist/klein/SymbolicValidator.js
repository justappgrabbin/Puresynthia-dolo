"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolicValidator = void 0;
class SymbolicValidator {
    validate(generated, sourceGraph, semanticCenter) {
        const trace = [];
        const issues = [];
        // Check semantic center preservation
        const centerPreserved = semanticCenter.some((c) => generated.toLowerCase().includes(c.toLowerCase()));
        if (!centerPreserved) {
            issues.push("Semantic center not preserved in generated text");
        }
        trace.push({ step: 1, operation: "center_preservation", input: semanticCenter, output: centerPreserved, confidence: centerPreserved ? 0.9 : 0.2 });
        // Check for direction reversal markers
        if (generated.includes("reverse") || generated.includes("backward")) {
            issues.push("Possible direction reversal detected");
        }
        trace.push({ step: 2, operation: "direction_check", input: generated, output: issues.length === 0 ? "ok" : "issues_found", confidence: issues.length === 0 ? 0.9 : 0.5 });
        return { valid: issues.length === 0, issues, trace };
    }
}
exports.SymbolicValidator = SymbolicValidator;
//# sourceMappingURL=SymbolicValidator.js.map