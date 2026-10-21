"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KleinMeshRuntime = void 0;
const AutolingEngine_1 = require("../klein/AutolingEngine");
const DiseminerEngine_1 = require("../klein/DiseminerEngine");
const GrammarInducer_1 = require("../klein/GrammarInducer");
const NarrativeGenerator_1 = require("../klein/NarrativeGenerator");
const Paraphraser_1 = require("../klein/Paraphraser");
const SymbolicValidator_1 = require("../klein/SymbolicValidator");
const LearningMesh_1 = require("./LearningMesh");
class LearningOrgan {
    id;
    onLearn;
    seen = new Set();
    constructor(id, onLearn) {
        this.id = id;
        this.onLearn = onLearn;
    }
    learn(learning, mesh) {
        if (this.seen.has(learning.id))
            return;
        this.seen.add(learning.id);
        this.onLearn(learning, mesh);
    }
}
class KleinMeshRuntime {
    mesh = new LearningMesh_1.LearningMesh();
    autoling = new AutolingEngine_1.AutolingEngine();
    grammar = new GrammarInducer_1.GrammarInducer();
    diseminer = new DiseminerEngine_1.DiseminerEngine();
    paraphraser = new Paraphraser_1.Paraphraser();
    autonovel = new NarrativeGenerator_1.NarrativeGenerator();
    validator = new SymbolicValidator_1.SymbolicValidator();
    constructor() {
        this.mesh.register(new LearningOrgan("autoling", (learning, mesh) => {
            const language = learning.kind === "language"
                ? learning.value.split(":")[0].trim().toLowerCase()
                : "english";
            mesh.recordLanguage("autoling", language);
        }));
        this.mesh.register(new LearningOrgan("control-of-grammar", (learning) => {
            const sequence = learning.value.toLowerCase().match(/[a-z]+/g) ?? [];
            if (sequence.length > 1)
                this.grammar.learn([{ sequence, valid: true }]);
        }));
        this.mesh.register(new LearningOrgan("diseminer", (learning, mesh) => {
            const match = learning.value.match(/^\s*(.+?)\s+(is|has|becomes|causes|contains)\s+(.+?)\s*$/i);
            if (match)
                mesh.connect(match[1], match[3], match[2].toLowerCase(), [learning.id]);
        }));
        this.mesh.register(new LearningOrgan("paraphraser", () => undefined));
        this.mesh.register(new LearningOrgan("autonovel", () => undefined));
        this.mesh.register(new LearningOrgan("symbolic-validator", () => undefined));
    }
    async learn(toolId, kind, value, confidence, evidence = []) {
        return this.mesh.publish({ toolId, kind, value, confidence, evidence });
    }
}
exports.KleinMeshRuntime = KleinMeshRuntime;
//# sourceMappingURL=KleinMeshRuntime.js.map