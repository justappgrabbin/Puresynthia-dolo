"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningMesh = void 0;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
function clone(value) {
    return structuredClone(value);
}
class LearningMesh {
    learnings = new Map();
    edges = new Map();
    organs = new Map();
    growth = new Map();
    register(organ) {
        this.organs.set(organ.id, organ);
        if (!this.growth.has(organ.id)) {
            this.growth.set(organ.id, {
                toolId: organ.id,
                observations: 0,
                acceptedLearnings: 0,
                receivedLearnings: 0,
                languages: [],
                version: 1,
            });
        }
    }
    async publish(learning) {
        const id = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify(learning))
            .digest("hex");
        const existing = this.learnings.get(id);
        if (existing)
            return clone(existing);
        const stored = {
            ...clone(learning),
            id,
            learnedAt: new Date().toISOString(),
            revision: 1,
        };
        this.learnings.set(id, stored);
        const owner = this.requireGrowth(stored.toolId);
        owner.observations += 1;
        owner.acceptedLearnings += stored.confidence >= 0.5 ? 1 : 0;
        owner.version += 1;
        owner.lastLearnedAt = stored.learnedAt;
        // Every organ receives accepted mesh learning. This is the shared-growth
        // boundary: tools retain their distinct jobs while learning from one field.
        if (stored.confidence >= 0.5) {
            for (const organ of this.organs.values()) {
                await organ.learn(clone(stored), this);
                const receiver = this.requireGrowth(organ.id);
                receiver.receivedLearnings += 1;
                receiver.version += 1;
                receiver.lastLearnedAt = stored.learnedAt;
            }
        }
        return clone(stored);
    }
    connect(from, to, relation, evidenceIds = []) {
        const id = (0, node_crypto_1.createHash)("sha256")
            .update(`${from}\0${relation}\0${to}`)
            .digest("hex");
        const existing = this.edges.get(id);
        if (existing) {
            existing.traversals += 1;
            existing.weight = Math.min(1, existing.weight + 0.02);
            existing.evidenceIds = [...new Set([...existing.evidenceIds, ...evidenceIds])];
            return clone(existing);
        }
        const edge = {
            id,
            from,
            to,
            relation,
            weight: 0.5,
            traversals: 1,
            evidenceIds: [...new Set(evidenceIds)],
        };
        this.edges.set(id, edge);
        return clone(edge);
    }
    recordLanguage(toolId, language) {
        const state = this.requireGrowth(toolId);
        if (!state.languages.includes(language)) {
            state.languages.push(language);
            state.version += 1;
        }
    }
    search(query, limit = 12) {
        const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
        return [...this.learnings.values()]
            .map((item) => ({
            item,
            score: terms.reduce((score, term) => score +
                (item.value.toLowerCase().includes(term) ? 2 : 0) +
                item.evidence.filter((e) => e.text.toLowerCase().includes(term)).length, 0),
        }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score || b.item.confidence - a.item.confidence)
            .slice(0, limit)
            .map(({ item }) => clone(item));
    }
    snapshot() {
        return {
            learnings: [...this.learnings.values()].map(clone),
            edges: [...this.edges.values()].map(clone),
            tools: [...this.growth.values()].map(clone),
        };
    }
    restore(snapshot) {
        this.learnings.clear();
        this.edges.clear();
        this.growth.clear();
        for (const learning of snapshot.learnings)
            this.learnings.set(learning.id, clone(learning));
        for (const edge of snapshot.edges)
            this.edges.set(edge.id, clone(edge));
        for (const tool of snapshot.tools) {
            this.growth.set(tool.toolId, {
                ...clone(tool),
                receivedLearnings: tool.receivedLearnings ?? 0,
            });
        }
    }
    async save(file) {
        await node_fs_1.promises.mkdir(node_path_1.default.dirname(file), { recursive: true });
        const temporary = `${file}.tmp`;
        await node_fs_1.promises.writeFile(temporary, JSON.stringify(this.snapshot(), null, 2), "utf8");
        await node_fs_1.promises.rename(temporary, file);
    }
    async load(file) {
        try {
            this.restore(JSON.parse(await node_fs_1.promises.readFile(file, "utf8")));
            return true;
        }
        catch (error) {
            if (error.code === "ENOENT")
                return false;
            throw error;
        }
    }
    requireGrowth(toolId) {
        const state = this.growth.get(toolId);
        if (!state)
            throw new Error(`Klein tool ${toolId} is not registered on the mesh`);
        return state;
    }
}
exports.LearningMesh = LearningMesh;
//# sourceMappingURL=LearningMesh.js.map