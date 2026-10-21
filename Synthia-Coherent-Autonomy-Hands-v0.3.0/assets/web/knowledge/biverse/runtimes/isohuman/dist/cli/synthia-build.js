"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const KleinMeshRuntime_1 = require("../mesh/KleinMeshRuntime");
const SourceRAG_1 = require("../rag/SourceRAG");
const SynthiaMeshBuilder_1 = require("../synthia/SynthiaMeshBuilder");
async function main() {
    const projectRoot = node_path_1.default.resolve(__dirname, "../../../..");
    const workspaceRoot = node_path_1.default.resolve(projectRoot, "../..");
    const assignmentFile = node_path_1.default.join(projectRoot, "data", "synthia", "mesh-assignment.json");
    const assignment = JSON.parse(await node_fs_1.promises.readFile(assignmentFile, "utf8"));
    assignment.outputDirectory = node_path_1.default.resolve(projectRoot, assignment.outputDirectory);
    const rag = new SourceRAG_1.SourceRAG();
    rag.addText({
        id: `instruction:${assignment.id}`,
        kind: "instruction",
        uri: assignmentFile,
        title: assignment.title,
    }, [assignment.objective, ...assignment.instructions].join("\n\n"));
    await addTreeIfPresent(rag, {
        id: "books:source-reading",
        kind: "book",
        uri: node_path_1.default.join(workspaceRoot, "work", "source-reading"),
        title: "Supplied source books",
    });
    await addTreeIfPresent(rag, {
        id: "repository:human-design-llm",
        kind: "repository",
        uri: node_path_1.default.join(workspaceRoot, "work", "human-design-llm"),
        title: "Human Design LLM repository",
    });
    await addTreeIfPresent(rag, {
        id: "repository:isohuman",
        kind: "repository",
        uri: node_path_1.default.join(projectRoot, "runtimes", "isohuman", "src"),
        title: "IsoHuman runtime",
    });
    // Local checkouts are indexed with their canonical GitHub identity so the
    // first learning run does not require an API key or paid service.
    const githubMirrors = [
        ["The-Biverse-Foundation/rave-cosmology-research", "rave-cosmology-research"],
        ["joyozhang333-lgtm/human-design-llm", "human-design-llm"],
        ["RoxyAPI/astrology-ai-chatbot", "astrology-ai-chatbot"],
        ["CReizner/SharpAstrology.HumanDesign", "sharpastrology-human-design"],
        ["PashaKharambura/HumanDesign", "pasha-human-design"],
    ];
    for (const [identity, directory] of githubMirrors) {
        await addTreeIfPresent(rag, {
            id: `github:${identity}`,
            kind: "github",
            uri: `https://github.com/${identity}`,
            title: identity,
        }, node_path_1.default.join(workspaceRoot, "work", directory));
    }
    await node_fs_1.promises.mkdir(assignment.outputDirectory, { recursive: true });
    await node_fs_1.promises.writeFile(node_path_1.default.join(assignment.outputDirectory, "rag-index.json"), JSON.stringify(rag.snapshot(), null, 2), "utf8");
    const proposal = await new SynthiaMeshBuilder_1.SynthiaMeshBuilder(new KleinMeshRuntime_1.KleinMeshRuntime(), rag).acceptAssignment(assignment);
    process.stdout.write(`${JSON.stringify(proposal, null, 2)}\n`);
    async function addTreeIfPresent(index, source, explicitRoot = source.uri) {
        try {
            await node_fs_1.promises.access(explicitRoot);
            await index.addLocalTree(source, explicitRoot);
        }
        catch {
            // Missing optional material is reported by required-evidence checks.
        }
    }
}
void main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=synthia-build.js.map