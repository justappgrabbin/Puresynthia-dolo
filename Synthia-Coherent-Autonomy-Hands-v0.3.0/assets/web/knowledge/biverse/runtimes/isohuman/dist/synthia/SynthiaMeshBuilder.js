"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthiaMeshBuilder = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
class SynthiaMeshBuilder {
    runtime;
    rag;
    constructor(runtime, rag) {
        this.runtime = runtime;
        this.rag = rag;
    }
    async acceptAssignment(assignment) {
        const queries = [
            assignment.objective,
            "generative mesh semantic triples ATO binary tools",
            "AUTOLING DISEMINER grammar paraphrase narrative validation",
            "shared learning provenance correction rollback",
        ];
        const evidence = deduplicate(queries.flatMap((query) => this.rag.search(query, 8))).slice(0, 24);
        const kinds = new Set(evidence.map((hit) => hit.source.kind));
        const absent = assignment.requiredEvidenceKinds.filter((kind) => !kinds.has(kind));
        for (const hit of evidence) {
            await this.runtime.learn("diseminer", "observation", summarize(hit.text), Math.min(0.95, 0.55 + hit.score / 100), [{
                    sourceId: hit.sourceId,
                    location: hit.location,
                    checksum: hit.checksum,
                    text: hit.text,
                }]);
        }
        const proposal = {
            assignmentId: assignment.id,
            createdAt: new Date().toISOString(),
            status: "proposal",
            retrievedEvidence: evidence.map((hit) => ({
                sourceId: hit.sourceId,
                location: hit.location,
                checksum: hit.checksum,
                score: hit.score,
            })),
            findings: [
                `${evidence.length} source-grounded passages were retrieved.`,
                `${this.runtime.mesh.snapshot().tools.length} Klein organs share the learning mesh.`,
                absent.length
                    ? `Required evidence still missing: ${absent.join(", ")}.`
                    : "Every required evidence kind is represented.",
            ],
            buildSteps: [
                "Retrieve evidence for the requested capability.",
                "Let AUTOLING and Control of Grammar learn language and structural constraints.",
                "Let DISEMINER extract candidate semantic triples.",
                "Map accepted triples and transformations through ATO onto the mesh.",
                "Compose compatible input, transform, and output organs.",
                "Generate prose with AutoNovel and Paraphraser.",
                "Validate claims and generated modules against cited evidence.",
                "Run acceptance tests; preserve failed attempts and reversible revisions.",
            ],
            acceptanceTests: [...assignment.acceptanceTests],
            warning: "This proposal does not authorize silent source rewriting or untested promotion. Generated code must pass its tests before becoming an active mesh organ.",
        };
        await node_fs_1.promises.mkdir(assignment.outputDirectory, { recursive: true });
        await node_fs_1.promises.writeFile(node_path_1.default.join(assignment.outputDirectory, "build-proposal.json"), JSON.stringify(proposal, null, 2), "utf8");
        await this.runtime.mesh.save(node_path_1.default.join(assignment.outputDirectory, "learning-mesh.json"));
        return proposal;
    }
}
exports.SynthiaMeshBuilder = SynthiaMeshBuilder;
function deduplicate(hits) {
    return [...new Map(hits.map((hit) => [hit.id, hit])).values()].sort((a, b) => b.score - a.score);
}
function summarize(text) {
    const sentence = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/)[0];
    return sentence.slice(0, 500);
}
//# sourceMappingURL=SynthiaMeshBuilder.js.map