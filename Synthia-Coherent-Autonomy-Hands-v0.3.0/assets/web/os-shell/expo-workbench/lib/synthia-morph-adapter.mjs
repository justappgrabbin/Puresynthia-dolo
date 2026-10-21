const EDITOR_MORPHS = Object.freeze(["zip", "canvas", "inspector", "preview", "source", "gallery"]);
const identity = (id) => `synthia.morph.${id}`;

export class SynthiaMorphAdapter {
  constructor({ synthiaUnit, sourceConnectome, stateSpaceModel, toolFactory, automatonClass, automataMesh, graphRuntime, sourceMutationProcess, buildProcess, artifactValidator, codeImmuneSystem } = {}) {
    this.synthiaUnit = synthiaUnit;
    this.sourceConnectome = sourceConnectome;
    this.stateSpaceModel = stateSpaceModel;
    this.toolFactory = toolFactory;
    this.Automaton = automatonClass;
    this.mesh = automataMesh;
    this.graphRuntime = graphRuntime;
    this.sourceMutationProcess = sourceMutationProcess;
    this.buildProcess = buildProcess;
    this.artifactValidator = artifactValidator;
    this.codeImmuneSystem = codeImmuneSystem;
    this.morphs = new Map();
    this.projects = new Map();
    this.lastState = null;
  }

  registerEditorAutomata() {
    if (!this.Automaton || !this.mesh) return this.morphs;
    for (const id of EDITOR_MORPHS) {
      if (this.morphs.has(id)) continue;
      const automaton = new this.Automaton({
        id: identity(id),
        address: { mode: "macro", gate: 1, line: 1, color: 1, tone: 1, base: 1 },
        structure: "trigram",
        activeLevels: [1, 2],
        functionalLevel: id === "runtime" ? "being" : "design",
        ports: [{ id: "in", direction: "input", type: "json" }, { id: "out", direction: "output", type: "json", guarantees: ["addressed"] }],
        implementation: async (input) => this.invoke(id, input),
        metadata: { role: "editor-morph", capability: id },
      });
      this.mesh.add(automaton);
      this.morphs.set(id, automaton);
    }
    return this.morphs;
  }

  async openProject(project) {
    const files = project.files || [];
    const inspection = this.synthiaUnit?.inspectCodeProject ? await this.synthiaUnit.inspectCodeProject(files) : null;
    const connectomeFiles = files.map((file) => ({ ...file, filename: file.filename || file.path || file.name }));
    const connectome = this.sourceConnectome ? new this.sourceConnectome(connectomeFiles).snapshot() : null;
    const record = { ...project, inspection, connectome };
    this.projects.set(project.id, record);
    return { project: record, inspection, connectome };
  }

  async inspect(artifact) {
    const project = this.projects.get(artifact.projectId);
    if (artifact.kind === "project" && project?.inspection) return project.inspection;
    if (this.synthiaUnit?.inspectCodeProject && project?.files) return this.synthiaUnit.inspectCodeProject(project.files);
    if (this.sourceConnectome && project?.files) return new this.sourceConnectome(project.files).snapshot();
    return { addressed: artifact.nodeId || artifact.filePath || artifact.projectId, payload: artifact.payload };
  }

  async getState() {
    const state = this.stateSpaceModel?.getState ? await this.stateSpaceModel.getState() : null;
    this.lastState = state;
    return { state, mountedMorphs: [...this.morphs.values()].map((automaton) => automaton.manifest?.() || { id: automaton.id }) };
  }

  async getTools(artifact) {
    if (this.toolFactory?.getTools) return this.toolFactory.getTools(artifact?.limit || 50);
    if (this.toolFactory?.tools) return [...this.toolFactory.tools.values?.() || this.toolFactory.tools];
    return [];
  }

  async execute(artifact, input) {
    if (this.graphRuntime?.executeNativeTool && artifact.toolId) return this.graphRuntime.executeNativeTool(artifact.sessionId || "editor", artifact.toolId, { intent: input?.intent || "editor execution", parameters: input?.parameters || input || {} });
    if (this.mesh?.run && artifact.automatonId) return this.mesh.run(artifact.automatonId, input);
    if (this.graphRuntime?.ingest && this.graphRuntime?.runUntilSettled) {
      const session = await this.graphRuntime.ingest(input?.intent || String(input || "editor execution"));
      return this.graphRuntime.runUntilSettled(session?.sessionId || session);
    }
    throw new Error("No Synthia execution target is available for the addressed artifact");
  }

  async applyMutation(project, change) {
    const current = project.files?.find?.((file) => file.path === change.filePath) || { content: "" };
    let content = change.content ?? change.payload ?? "";
    if (this.sourceMutationProcess?.applyText) content = this.sourceMutationProcess.applyText(current.content, { operation: change.operation || "replace", payload: content });
    const updatedFiles = (project.files || []).map((file) => file.path === change.filePath ? { ...file, content } : file);
    const updated = { ...project, files: updatedFiles };
    this.projects.set(project.id, updated);
    const build = this.buildProcess?.run ? await this.buildProcess.run({ workspace: project.id, steps: ["verify", "package"] }) : null;
    return { project: updated, change, build };
  }

  async validate(project) {
    const artifact = project.artifact || project;
    const structural = this.artifactValidator?.validate ? await this.artifactValidator.validate(artifact) : { valid: true, errors: [], warnings: [] };
    const code = this.codeImmuneSystem?.inspectCodeProject && project.files ? await this.codeImmuneSystem.inspectCodeProject(project.files) : null;
    return { structural, code, valid: structural.valid !== false && !(code?.injuries || []).some((injury) => injury.severity === "fatal") };
  }

  async invoke(morph, input = {}) {
    switch (input.operation) {
      case "openProject": return this.openProject(input.project);
      case "inspect": return this.inspect(input.artifact);
      case "execute": return this.execute(input.artifact, input.input);
      case "applyMutation": return this.applyMutation(input.project, input.change);
      case "getState": return this.getState();
      case "getTools": return this.getTools(input.artifact);
      case "validate": return this.validate(input.project);
      default: return { morph, identity: identity(morph), accepted: true, input };
    }
  }
}

export { EDITOR_MORPHS };
export default SynthiaMorphAdapter;
