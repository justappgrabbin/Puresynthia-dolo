import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import SynthiaMorphAdapter from "../lib/synthia-morph-adapter.mjs";

const root = "/home/ubuntu/synthia-inspect";
const load = (file) => import(pathToFileURL(join(root, file)).href);

const [unitModule, connectomeModule, stateModule, factoryModule, atoModule, graphModule, mutationModule, buildModule, validatorModule] = await Promise.all([
  load("core/SynthiaUnit.mjs"), load("organism/SourceConnectome.mjs"), load("vendor/resonance-engine/core/StateSpaceModel.js"), load("vendor/integrated-tool-factory/src/integrated-tool-factory.mjs"), load("vendor/ato-core/src/automaton.mjs"), load("runtime/GraphRuntime.js"), load("processes/SourceMutationProcess.mjs"), load("processes/BuildProcess.mjs"), load("runtime/ArtifactValidator.js"),
]);
const unit = new unitModule.default({ autoStart: false, memoryKey: "synthia-editor-integration-test" });
const stateSpace = new stateModule.StateSpaceModel();
const mesh = new atoModule.AutomataMesh();
const factory = new factoryModule.IntegratedToolFactory();
const mutation = new mutationModule.default({ stagingRoot: await mkdtemp(join(tmpdir(), "synthia-editor-")) });
const build = new buildModule.default({ runner: async () => ({ ok: true }) });
const adapter = new SynthiaMorphAdapter({ synthiaUnit: unit, sourceConnectome: connectomeModule.default, stateSpaceModel: stateSpace, toolFactory: factory, automatonClass: atoModule.Automaton, automataMesh: mesh, graphRuntime: new graphModule.GraphRuntime(), sourceMutationProcess: mutation, buildProcess: build, artifactValidator: new validatorModule.default(), codeImmuneSystem: unit.codeImmune });
adapter.registerEditorAutomata();
const project = { id: "project-1", name: "Imported project", files: [{ path: "index.html", source: "<main><button>Run</button></main>", content: "<main><button>Run</button></main>" }] };
const opened = await adapter.openProject(project);
assert.ok(opened.inspection);
assert.equal(opened.connectome.nodes.length, 1);
assert.equal(stateSpace.getState().layers.length, 5);
assert.equal(mesh.automatons.size, 6);
const generated = factory.generate({ purpose: "editor menu tool", toolFamily: "menu", dimension: "Design", level: 3 });
const tool = generated.tool;
assert.equal(generated.status, "generated");
assert.ok(tool.id);
assert.equal(typeof tool.call, "function");
factory.mount(tool, mesh);
assert.ok(mesh.automatons.has(tool.id));
const insertedIdentity = { toolId: tool.id, address: tool.manifest().address, placement: { x: 120, y: 240 } };
assert.equal(insertedIdentity.toolId, tool.id);
const canvasRun = await mesh.run("synthia.morph.canvas", { operation: "inspect", artifact: { projectId: project.id, kind: "project", payload: {} } });
assert.ok(canvasRun.visited.includes("synthia.morph.canvas"));
const changed = await adapter.applyMutation(project, { filePath: "index.html", operation: "replace", content: "<main><button>Launch</button></main>" });
assert.match(changed.project.files[0].content, /Launch/);
assert.equal(changed.build.status, "verified");
const artifact = { manifest: { materializedFiles: ["synthia/expression-graph.json", "synthia/runtime-output.json"], provenance: [{ source: "editor" }], activatedChannels: ["editor"], expressionNodes: [{ id: insertedIdentity.toolId }] }, files: [{ path: "synthia/expression-graph.json", content: "{}" }, { path: "synthia/runtime-output.json", content: "{}" }] };
const validated = await adapter.validate({ ...changed.project, artifact });
assert.equal(validated.structural.valid, true);
assert.equal(validated.valid, true);
console.log("SYNTHIA EDITOR INTEGRATION PASS: project → inspect → state → mesh automata → tool identity → mutation → build → validation");
