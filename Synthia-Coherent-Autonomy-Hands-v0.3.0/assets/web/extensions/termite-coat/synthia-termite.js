"use strict";
/**
 * SYNTHIA TERMITE v2.1 — contained living organism runtime
 *
 * Ingest → interrogate → address → coat → learn → metabolize → adapt → stage mutations → verify.
 * Peer exchange is signed and explicit; this file does not autonomously replicate or punch NATs.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthiaTermite = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
const events_1 = require("events");
const synthia_coat_1 = require("./synthia-coat");
const PHYSICS = Object.freeze({
    ENERGY_DECAY_PER_CYCLE: 0.3,
    ACTIVATION_ENERGY_COST: 1.5,
    EDGE_MAINTENANCE_COST: 0.08,
    HEBBIAN_THRESHOLD: 0.65,
    PLASTICITY_DECAY: 0.0008,
    MAX_EDGE_AGE_BEFORE_PRUNE: 15000,
    ENERGY_SURPLUS_GROWTH_THRESHOLD: 80,
    ENERGY_DEBT_DEATH_THRESHOLD: -40,
    MUTATION_BASE_RATE: 0.008,
    REACHING_ENERGY_COST: 15,
    TENSION_DECAY: 0.92,
    NARRATIVE_UPDATE_INTERVAL: 80,
    COMPILATION_INTERVAL: 500,
    EXCHANGE_INTERVAL: 1000,
    COAT_MAINTENANCE_COST: 0.05,
    LEARNING_CONSOLIDATION_INTERVAL: 200,
});
const DIMENSIONS = ["Movement", "Evolution", "Being", "Design", "Space"];
const INPUT_TYPES = ["text", "json", "markdown", "code", "csv", "xml", "yaml", "wasm", "elf", "dex", "image", "audio", "binary"];
class DeterministicRng {
    constructor(seed) {
        const hash = crypto.createHash("sha256").update(String(seed)).digest();
        this.state = hash.readUInt32LE(0) || 0x9e3779b9;
    }
    next() {
        let x = this.state >>> 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        return this.state / 4294967296;
    }
    int(maxExclusive) {
        return maxExclusive <= 1 ? 0 : Math.floor(this.next() * maxExclusive);
    }
    pick(values) { return values[this.int(values.length)]; }
}
class UniversalIngestionEngine {
    detectType(source, raw) {
        if (raw.length >= 4 && raw[0] === 0x7f && raw[1] === 0x45 && raw[2] === 0x4c && raw[3] === 0x46)
            return "elf";
        if (raw.length >= 4 && raw[0] === 0x00 && raw[1] === 0x61 && raw[2] === 0x73 && raw[3] === 0x6d)
            return "wasm";
        if (raw.length >= 3 && raw[0] === 0x64 && raw[1] === 0x65 && raw[2] === 0x78)
            return "dex";
        if (raw.length >= 8 && raw.subarray(0, 8).toString("hex") === "89504e470d0a1a0a")
            return "image";
        if (raw.length >= 3 && raw.subarray(0, 3).toString("hex") === "ffd8ff")
            return "image";
        if (raw.length >= 4 && raw.subarray(0, 4).toString("ascii") === "RIFF")
            return "audio";
        const ext = path.extname(source).toLowerCase();
        if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".rs", ".kt", ".java", ".c", ".cpp", ".h"].includes(ext))
            return "code";
        if (ext === ".json")
            return "json";
        if ([".md", ".markdown"].includes(ext))
            return "markdown";
        if (ext === ".csv")
            return "csv";
        if (ext === ".xml")
            return "xml";
        if ([".yaml", ".yml"].includes(ext))
            return "yaml";
        const text = this.tryText(raw);
        if (text !== null) {
            const trimmed = text.trim();
            if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                    JSON.parse(trimmed);
                    return "json";
                }
                catch { /* continue */ }
            }
            if (/\b(import|export|function|class|const|let|var)\b/.test(text))
                return "code";
            if (/^#{1,6}\s/m.test(text))
                return "markdown";
            return "text";
        }
        return "binary";
    }
    parse(type, raw) {
        const text = this.tryText(raw);
        try {
            switch (type) {
                case "json": return JSON.parse(raw.toString("utf8"));
                case "markdown": return this.parseMarkdown(raw.toString("utf8"));
                case "csv": return this.parseCsv(raw.toString("utf8"));
                case "xml": return this.parseXml(raw.toString("utf8"));
                case "yaml": return this.parseYaml(raw.toString("utf8"));
                case "code": return this.parseCode(raw.toString("utf8"));
                case "text": return text ?? "";
                default: return { type, size: raw.length, sha256: (0, synthia_coat_1.sha256)(raw), previewHex: raw.subarray(0, 64).toString("hex") };
            }
        }
        catch (error) {
            return { type, parseError: String(error), size: raw.length, sha256: (0, synthia_coat_1.sha256)(raw) };
        }
    }
    interrogate(source, type, raw, parsed, cognitive) {
        const text = this.tryText(raw) ?? "";
        const dependencies = this.dependencies(text);
        const funcs = [...text.matchAll(/\b(?:async\s+)?function\s+(\w+)/g)].map(m => m[1]);
        const classes = [...text.matchAll(/\bclass\s+(\w+)/g)].map(m => m[1]);
        const exports = [...text.matchAll(/\bexport\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)?/g)].map(m => m[1]).filter(Boolean);
        const inputs = [...text.matchAll(/\b(?:readFileSync|readFile|fetch|stdin|process\.argv|addEventListener)\b/g)].map(m => m[0]);
        const outputs = [...text.matchAll(/\b(?:writeFileSync|writeFile|console\.|emit\(|return\b|fetch\()\b/g)].map(m => m[0]);
        const state = [...text.matchAll(/\b(?:Map|Set|localStorage|indexedDB|database|state|cache|history|queue)\b/gi)].map(m => m[0]);
        const runtime = this.runtimeHints(source, text, type);
        const gaps = [];
        if (type === "code") {
            if (dependencies.some(d => !d.startsWith(".") && !d.startsWith("node:") && !this.isNodeBuiltin(d)))
                gaps.push("external_dependencies_present");
            if (/TODO|FIXME|Not implemented/.test(text))
                gaps.push("explicit_unimplemented_marker");
            if (/eval\s*\(|new\s+Function\s*\(/.test(text))
                gaps.push("dynamic_code_execution_requires_containment");
            if (/child_process|spawn\s*\(|exec\s*\(/.test(text))
                gaps.push("process_execution_requires_policy");
            if (!/\b(test|describe|it)\s*\(/.test(text))
                gaps.push("tests_not_visible_in_artifact");
        }
        const who = classes.length ? classes : exports.length ? exports : [path.basename(source) || "artifact"];
        const what = [type, ...funcs.slice(0, 16), ...classes.slice(0, 16)];
        const where = [source, ...runtime.map(r => `runtime:${r}`)];
        const when = [/setInterval|setTimeout|cron|schedule/.test(text) ? "time/reactive" : "on-demand"];
        const why = this.inferPurposes(text, funcs);
        const relationships = dependencies.map(d => `depends_on:${d}`);
        const behaviors = this.inferBehaviors(text);
        const storage = [...new Set(state.filter(s => /storage|indexed|database|cache|history|map|set/i.test(s)))];
        const interfaces = [...new Set([...exports, ...funcs])];
        if (cognitive && type === "code") {
            try {
                const understood = cognitive.understand(text, languageFromPath(source), (0, synthia_coat_1.sha256)(raw));
                for (const gap of understood.gaps ?? [])
                    if (!gaps.includes(gap))
                        gaps.push(gap);
                for (const fact of understood.facts ?? [])
                    relationships.push(`${fact.subject}:${fact.predicate}:${fact.object}`);
            }
            catch (error) {
                gaps.push(`cognitive_adapter_error:${String(error)}`);
            }
        }
        const dimensionScores = this.scoreDimensions({ type, text, dependencies, behaviors, state, funcs, classes });
        return {
            who: unique(who), what: unique(what), where: unique(where), when: unique(when), why: unique(why),
            relationships: unique(relationships), dependencies: unique(dependencies), behaviors: unique(behaviors),
            inputs: unique(inputs), outputs: unique(outputs), runtime: unique(runtime), storage: unique(storage),
            interfaces: unique(interfaces), state: unique(state), gaps: unique(gaps), dimensionScores,
        };
    }
    deriveAddress(raw, interrogation) {
        const primary = ["Movement", "Evolution", "Being", "Design"];
        const ordered = primary.map(d => ({ d, score: interrogation.dimensionScores[d] })).sort((a, b) => b.score - a.score);
        // Space is relational here: an even alignment across the two strongest primitives resolves to Space.
        const dimension = Math.abs(ordered[0].score - ordered[1].score) < 1e-9 ? "Space" : ordered[0].d;
        const digest = crypto.createHash("sha256").update(raw).update((0, synthia_coat_1.stableStringify)(interrogation)).digest();
        return {
            dimension,
            gate: (digest[0] % 64) + 1,
            line: (digest[1] % 6) + 1,
            color: (digest[2] % 6) + 1,
            tone: (digest[3] % 6) + 1,
            base: (digest[4] % 5) + 1,
            degree: ((digest[5] << 8) | digest[6]) % 360,
            minute: digest[7] % 60,
            second: digest[8] % 60,
        };
    }
    embed(raw) {
        const vec = new Float32Array(256);
        for (let i = 0; i < raw.length; i++)
            vec[(raw[i] + i * 31) & 255] += 1;
        const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
        if (mag)
            for (let i = 0; i < vec.length; i++)
                vec[i] /= mag;
        return vec;
    }
    tryText(raw) {
        if (!raw.length)
            return "";
        let control = 0;
        const sample = raw.subarray(0, Math.min(raw.length, 4096));
        for (const b of sample)
            if (b < 9 || (b > 13 && b < 32))
                control++;
        return control / sample.length > 0.08 ? null : raw.toString("utf8");
    }
    parseMarkdown(text) {
        return { headings: [...text.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(m => ({ level: m[1].length, title: m[2] })), lineCount: text.split(/\r?\n/).length };
    }
    parseCsv(text) {
        const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
        const headers = rows.shift() ?? [];
        return { headers, rows: rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))) };
    }
    parseXml(text) {
        const tags = [...text.matchAll(/<\/?([\w:-]+)/g)].map(m => m[1]);
        return { tags: unique(tags), tagCount: tags.length };
    }
    parseYaml(text) {
        const keys = [...text.matchAll(/^\s*([\w.-]+)\s*:/gm)].map(m => m[1]);
        return { keys: unique(keys), lineCount: text.split(/\r?\n/).length };
    }
    parseCode(text) {
        return {
            imports: this.dependencies(text),
            functions: [...text.matchAll(/\b(?:async\s+)?function\s+(\w+)/g)].map(m => m[1]),
            classes: [...text.matchAll(/\bclass\s+(\w+)/g)].map(m => m[1]),
            exports: [...text.matchAll(/\bexport\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)?/g)].map(m => m[1]).filter(Boolean),
            lineCount: text.split(/\r?\n/).length,
        };
    }
    dependencies(text) {
        const deps = [
            ...[...text.matchAll(/\bimport\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g)].map(m => m[1]),
            ...[...text.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m => m[1]),
            ...[...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m => m[1]),
        ];
        return unique(deps);
    }
    runtimeHints(source, text, type) {
        const out = [];
        const ext = path.extname(source).toLowerCase();
        if ([".ts", ".tsx"].includes(ext))
            out.push("typescript");
        if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext))
            out.push("javascript");
        if (ext === ".py")
            out.push("python");
        if (ext === ".rs")
            out.push("rust");
        if (ext === ".kt")
            out.push("kotlin");
        if (/\b(window|document|localStorage|indexedDB|navigator)\b/.test(text))
            out.push("browser");
        if (/\b(process|Buffer|node:|require\()/.test(text))
            out.push("node");
        if (type === "wasm")
            out.push("wasm");
        return out.length ? unique(out) : [type === "code" ? "unknown-code-runtime" : "data"];
    }
    inferPurposes(text, funcs) {
        const out = [];
        const patterns = [
            [/ingest|parse|read/i, "ingest/analyze"], [/compile|build|transpile/i, "compile/build"],
            [/learn|train|adapt/i, "learn/adapt"], [/render|draw|image|video/i, "render/generate"],
            [/network|peer|mesh|socket/i, "communicate"], [/test|verify|validate|assert/i, "verify"],
            [/store|save|persist|database/i, "persist"], [/plan|goal|agent/i, "plan/act"],
        ];
        const corpus = `${funcs.join(" ")} ${text.slice(0, 8000)}`;
        for (const [re, purpose] of patterns)
            if (re.test(corpus))
                out.push(purpose);
        return out.length ? unique(out) : ["unspecified"];
    }
    inferBehaviors(text) {
        const out = [];
        const patterns = [
            [/setInterval|setTimeout/, "scheduled"], [/EventEmitter|emit\(/, "event-driven"],
            [/writeFile|appendFile/, "writes-files"], [/readFile|createReadStream/, "reads-files"],
            [/spawn|execSync|child_process/, "launches-processes"], [/fetch|http|https|net|dgram|WebSocket/, "network-capable"],
            [/crypto|sign\(|verify\(/, "cryptographic"], [/Map|Set|state|history|cache/, "stateful"],
            [/class\s+\w+/, "object-oriented"], [/async|Promise|await/, "asynchronous"],
        ];
        for (const [re, label] of patterns)
            if (re.test(text))
                out.push(label);
        return unique(out);
    }
    scoreDimensions(data) {
        const score = { Movement: 0, Evolution: 0, Being: 0, Design: 0, Space: 0 };
        const corpus = `${data.text.slice(0, 20000)} ${data.behaviors.join(" ")}`.toLowerCase();
        if (/execute|run|move|signal|event|action|input|output/.test(corpus))
            score.Movement += 2;
        if (/learn|adapt|mutat|history|causal|version|change|time/.test(corpus))
            score.Evolution += 2;
        if (/state|identity|class|entity|agent|self|memory/.test(corpus))
            score.Being += 2;
        if (/design|plan|compile|render|generate|schema|grammar|rule/.test(corpus))
            score.Design += 2;
        // Space is not treated as a fifth primitive. It records relational balance between the strongest two primitives.
        score.Being += Math.min(2, data.state.length / 6);
        score.Design += Math.min(2, (data.funcs.length + data.classes.length) / 8);
        score.Movement += Math.min(1, data.behaviors.filter(b => ["event-driven", "scheduled", "asynchronous"].includes(b)).length / 3);
        score.Evolution += Math.min(1, data.behaviors.filter(b => ["stateful", "scheduled"].includes(b)).length / 2);
        if (data.dependencies.length) {
            score.Movement += 0.25;
            score.Design += 0.25;
        }
        if (data.type !== "code")
            score.Being += 0.25;
        const primary = [score.Movement, score.Evolution, score.Being, score.Design].sort((a, b) => b - a);
        score.Space = 1 / (1 + Math.abs(primary[0] - primary[1]));
        return score;
    }
    isNodeBuiltin(dep) {
        const d = dep.replace(/^node:/, "");
        return ["assert", "buffer", "child_process", "crypto", "events", "fs", "http", "https", "net", "os", "path", "stream", "url", "util", "vm", "worker_threads", "zlib"].includes(d);
    }
}
class KnowledgeEngine {
    constructor() {
        this.records = new Map();
        this.gaps = new Set();
        this.filled = new Map();
        this.reachers = new Map();
    }
    learn(artifact) {
        const facts = [
            ...artifact.interrogation.what.map(v => ["what", v]),
            ...artifact.interrogation.why.map(v => ["why", v]),
            ...artifact.interrogation.relationships.map(v => ["relation", v]),
            ...artifact.interrogation.behaviors.map(v => ["behavior", v]),
        ];
        for (const [kind, value] of facts) {
            const key = `${kind}:${value}`;
            this.records.set(key, {
                key, value, sourceArtifactId: artifact.id, embedding: artifact.embedding,
                confidence: 1, learnedAt: Date.now(),
            });
        }
        for (const gap of artifact.gaps)
            if (!this.filled.has(gap))
                this.gaps.add(gap);
        artifact.learned = true;
    }
    registerReacher(name, fn) { this.reachers.set(name, fn); }
    async fill(max = 5) {
        let count = 0;
        for (const gap of [...this.gaps].sort().slice(0, max)) {
            for (const [name, fn] of this.reachers) {
                try {
                    const value = await fn(gap);
                    if (value !== undefined && value !== null) {
                        this.filled.set(gap, { value, via: name, at: Date.now() });
                        this.gaps.delete(gap);
                        count++;
                        break;
                    }
                }
                catch { /* next reacher */ }
            }
        }
        return count;
    }
    merge(records) {
        for (const record of records)
            if (!this.records.has(record.key))
                this.records.set(record.key, record);
    }
    getRecords() { return [...this.records.values()]; }
    getGaps() { return [...this.gaps]; }
    getFilled() { return new Map(this.filled); }
    restore(records, gaps) {
        this.records.clear();
        this.gaps.clear();
        this.filled.clear();
        for (const r of records)
            this.records.set(r.key, r);
        for (const g of gaps)
            this.gaps.add(g);
    }
}
class SelfCompilationEngine {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.proposals = new Map();
        this.history = [];
        this.stagingRoot = path.join(workspaceRoot, ".synthia-staging");
    }
    analyze(sourcePath, source) {
        const candidates = [];
        const noDebugger = source.replace(/^\s*debugger;?\s*$/gm, "");
        if (noDebugger !== source)
            candidates.push({ reason: "remove_debugger_statements", next: noDebugger });
        const noConsoleDebug = source.replace(/^\s*console\.debug\([^\n]*\);?\s*$/gm, "");
        if (noConsoleDebug !== source)
            candidates.push({ reason: "remove_console_debug_noise", next: noConsoleDebug });
        const normalized = source.replace(/[ \t]+$/gm, "");
        if (normalized !== source)
            candidates.push({ reason: "normalize_trailing_whitespace", next: normalized });
        const out = [];
        for (const candidate of candidates) {
            const proposal = {
                id: crypto.randomUUID(), sourcePath, reason: candidate.reason,
                originalHash: (0, synthia_coat_1.sha256)(source), candidateHash: (0, synthia_coat_1.sha256)(candidate.next), candidateSource: candidate.next,
                createdAt: Date.now(), tested: false, fitness: 0, evidence: [],
            };
            this.proposals.set(proposal.id, proposal);
            out.push(proposal);
        }
        return out;
    }
    compile(proposal) {
        const started = Date.now();
        const absolute = this.resolveInsideWorkspace(proposal.sourcePath);
        fs.mkdirSync(this.stagingRoot, { recursive: true });
        const ext = path.extname(absolute).toLowerCase();
        const stagedPath = path.join(this.stagingRoot, `${path.basename(absolute, ext)}.${proposal.id}${ext || ".txt"}`);
        fs.writeFileSync(stagedPath, proposal.candidateSource, "utf8");
        let compiler = "none";
        let result = null;
        let language = "unknown";
        if ([".js", ".mjs", ".cjs"].includes(ext)) {
            compiler = process.execPath;
            language = "javascript";
            result = (0, child_process_1.spawnSync)(process.execPath, ["--check", stagedPath], { encoding: "utf8", timeout: 10000, cwd: this.workspaceRoot });
        }
        else if ([".ts", ".tsx"].includes(ext)) {
            compiler = "npx tsc";
            language = "typescript";
            result = (0, child_process_1.spawnSync)("npx", ["tsc", stagedPath, "--noEmit", "--target", "ES2020", "--module", "commonjs", "--moduleResolution", "node", "--skipLibCheck"], {
                encoding: "utf8", timeout: 30000, cwd: this.workspaceRoot,
            });
        }
        const success = result ? result.status === 0 : true;
        const report = {
            sourcePath: absolute, stagedPath, language, compiler, success,
            exitCode: result?.status ?? 0, stdout: String(result?.stdout ?? ""), stderr: String(result?.stderr ?? ""),
            duration: Date.now() - started, candidateHash: proposal.candidateHash,
        };
        proposal.tested = true;
        proposal.fitness = success ? 1 : 0;
        proposal.evidence.push(success ? `compile_pass:${compiler}` : `compile_fail:${compiler}`);
        this.history.push(report);
        return report;
    }
    commit(proposalId, approved) {
        if (!approved)
            throw new Error("Mutation commit requires explicit approval");
        const proposal = this.proposals.get(proposalId);
        if (!proposal)
            throw new Error(`Unknown mutation proposal: ${proposalId}`);
        if (!proposal.tested || proposal.fitness < 1)
            throw new Error("Only passing staged mutations may be committed");
        const target = this.resolveInsideWorkspace(proposal.sourcePath);
        const current = fs.readFileSync(target, "utf8");
        if ((0, synthia_coat_1.sha256)(current) !== proposal.originalHash)
            throw new Error("Source changed after proposal; refusing stale commit");
        const backup = `${target}.pre-synthia-${Date.now()}.bak`;
        fs.copyFileSync(target, backup);
        fs.writeFileSync(target, proposal.candidateSource, "utf8");
        return backup;
    }
    getHistory() { return [...this.history]; }
    getProposals() { return [...this.proposals.values()]; }
    resolveInsideWorkspace(candidate) {
        const root = path.resolve(this.workspaceRoot);
        const absolute = path.resolve(root, candidate);
        if (absolute !== root && !absolute.startsWith(root + path.sep))
            throw new Error(`Path outside workspace denied: ${candidate}`);
        return absolute;
    }
}
class ExplicitMeshExchange {
    constructor(organism) {
        this.organism = organism;
        this.peers = new Map();
        this.communities = new Map();
    }
    registerPeer(peer) { this.peers.set(peer.id, { ...peer, capabilities: [...peer.capabilities], communities: [...peer.communities] }); }
    trustPeer(id, trusted = true) { const p = this.peers.get(id); if (p)
        p.trusted = trusted; }
    joinCommunity(id) {
        if (!this.communities.has(id))
            this.communities.set(id, new Set());
        this.communities.get(id).add(this.organism.getIdentity());
    }
    leaveCommunity(id) { this.communities.get(id)?.delete(this.organism.getIdentity()); }
    peersList() { return [...this.peers.values()].map(p => ({ ...p, capabilities: [...p.capabilities], communities: [...p.communities] })); }
    communityList() { return [...this.communities.keys()]; }
    createTransfer(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer)
            throw new Error(`Unknown peer: ${peerId}`);
        if (!peer.trusted)
            throw new Error(`Peer is not trusted: ${peerId}`);
        const snapshot = this.organism.snapshot();
        const coat = this.organism.getCoat();
        return this.organism.getAuthority().createTransfer(snapshot, coat, peer.id);
    }
}
class SynthiaTermite extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.coatLedger = new synthia_coat_1.CoatLedger();
        this.ingestion = new UniversalIngestionEngine();
        this.knowledge = new KnowledgeEngine();
        this.nodes = new Map();
        this.tensions = [];
        this.artifacts = new Map();
        this.autobiography = [];
        this.cycle = 0;
        this.running = false;
        this.intervalId = null;
        this.lastCoat = null;
        const workspaceRoot = path.resolve(config.workspaceRoot ?? process.cwd());
        this.config = {
            initialNodes: Math.max(1, config.initialNodes ?? 64),
            clusters: Math.max(1, config.clusters ?? 8),
            layers: Math.max(1, config.layers ?? 13),
            cycleMs: Math.max(20, config.cycleMs ?? 100),
            seed: config.seed ?? "synthia-termite",
            workspaceRoot,
            sourceFiles: config.sourceFiles ?? [],
            onVitalSigns: config.onVitalSigns,
            onAutobiography: config.onAutobiography,
            onStructuralChange: config.onStructuralChange,
            onCompilation: config.onCompilation,
            onMeshEvent: config.onMeshEvent,
        };
        this.authority = config.authority ?? new synthia_coat_1.CoatAuthority();
        this.verifier = new synthia_coat_1.CoatVerifier(new Set([this.authority.keyId]));
        this.rng = new DeterministicRng(this.config.seed);
        this.compilation = new SelfCompilationEngine(workspaceRoot);
        this.mesh = new ExplicitMeshExchange(this);
        this.metabolicState = blankMetabolism();
        this.vitalSigns = blankVitalSigns();
        this.seed();
    }
    attachCognitiveAdapter(adapter) { this.cognitive = adapter; }
    getAuthority() { return this.authority; }
    getIdentity() { return this.authority.keyId; }
    getPubkey() { return this.authority.publicKeyPem; }
    isAlive() { return this.running && this.nodes.size > 0; }
    getPopulation() { return this.nodes.size; }
    getEnergy() { return this.metabolicState.totalEnergy; }
    seed() {
        for (let i = 0; i < this.config.initialNodes; i++) {
            const node = this.createNode(`node_${i}`, i % this.config.clusters, Math.floor((i / this.config.initialNodes) * this.config.layers));
            this.nodes.set(node.id, node);
        }
        const all = [...this.nodes.values()];
        for (const node of all) {
            const degree = 2 + this.rng.int(4);
            for (let i = 0; i < degree; i++) {
                const target = this.rng.pick(all);
                if (target.id !== node.id)
                    this.connect(node, target);
            }
        }
        this.recomputeTotalEnergy();
        this.recordEvent("Termite seeded; primordial topology established.", true);
    }
    createNode(id, cluster, layer) {
        return {
            id,
            pubkey: crypto.createHash("sha256").update(`${this.getIdentity()}:${id}`).digest("hex").slice(0, 32),
            cluster, layer,
            energy: 500 + this.rng.next() * 300,
            maxEnergy: 1000,
            growthPotential: this.rng.next(),
            activationHistory: new Float32Array(100),
            connections: new Map(),
            genome: {
                mutationRate: PHYSICS.MUTATION_BASE_RATE * (0.5 + this.rng.next()),
                energyEfficiency: 0.5 + this.rng.next() * 0.5,
                learningRate: 0.01 + this.rng.next() * 0.1,
                reachTendency: this.rng.next(), specializationBias: this.rng.next(), resilience: 0.3 + this.rng.next() * 0.7,
                preferredInput: this.rng.pick(INPUT_TYPES), compilationSkill: this.rng.next(), meshTendency: this.rng.next(), coatThickness: 0.3 + this.rng.next() * 0.7,
            },
            bornCycle: this.cycle, lastFired: 0, specialization: "undifferentiated", autobiography: [`Born at cycle ${this.cycle}.`],
            sourceHash: "", compiled: false, mutationIds: [],
        };
    }
    connect(source, target) {
        source.connections.set(target.id, {
            targetId: target.id, weight: this.rng.next() * 2 - 1, plasticity: 0.5 + this.rng.next() * 0.5,
            age: 0, useCount: 0, lastUsed: Date.now(), hebbianStrength: 0.1, signalType: this.rng.pick(INPUT_TYPES), bandwidth: 1 + this.rng.next() * 10,
        });
    }
    async start() {
        if (this.running)
            return;
        this.running = true;
        this.recordEvent("Metabolism started.");
        this.intervalId = setInterval(() => { void this.tick(); }, this.config.cycleMs);
    }
    stop() {
        this.running = false;
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = null;
        this.recordEvent("Metabolism suspended.");
    }
    async tick() {
        this.cycle++;
        this.resetCycleCounters();
        this.maintain();
        this.processTensions();
        this.propagateSignals();
        this.hebbianUpdate();
        this.selection();
        this.autopoiesis();
        this.recomputeTotalEnergy();
        if (this.cycle % PHYSICS.LEARNING_CONSOLIDATION_INTERVAL === 0 && this.getEnergy() > PHYSICS.REACHING_ENERGY_COST) {
            const filled = await this.knowledge.fill(5);
            if (filled) {
                this.metabolicState.reachingEvents += filled;
                this.spendEnergy(PHYSICS.REACHING_ENERGY_COST * filled);
            }
        }
        if (this.cycle % PHYSICS.COMPILATION_INTERVAL === 0)
            this.stageSelfMaintenance();
        if (this.cycle % PHYSICS.NARRATIVE_UPDATE_INTERVAL === 0)
            this.updateAutobiography();
        this.updateVitalSigns();
    }
    ingest(source, rawInput) {
        const raw = Buffer.isBuffer(rawInput) ? Buffer.from(rawInput) : Buffer.from(rawInput, "utf8");
        const type = this.ingestion.detectType(source, raw);
        const parsed = this.ingestion.parse(type, raw);
        const interrogation = this.ingestion.interrogate(source, type, raw, parsed, this.cognitive);
        const address = this.ingestion.deriveAddress(raw, interrogation); // address AFTER interrogation
        const embedding = this.ingestion.embed(raw);
        const id = crypto.randomUUID();
        const manifest = {
            artifactId: id, source, artifactType: type, size: raw.length, createdAt: Date.now(), interrogatedAt: Date.now(), address,
            runtime: interrogation.runtime, dependencies: interrogation.dependencies, capabilities: interrogation.behaviors,
            permissions: inferPermissions(interrogation), gaps: interrogation.gaps,
            provenance: [`ingested:${source}`, `sha256:${(0, synthia_coat_1.sha256)(raw)}`],
            metadata: { who: interrogation.who, what: interrogation.what, why: interrogation.why },
        };
        const coat = this.authority.createCoat(raw, manifest);
        this.coatLedger.append(coat);
        const artifact = {
            id, source, raw, type, parsed, embedding, interrogation, address, gaps: [...interrogation.gaps], learned: false, timestamp: Date.now(), coat,
        };
        this.artifacts.set(id, artifact);
        this.knowledge.learn(artifact);
        this.feed(artifact);
        if (artifact.gaps.length)
            this.addTension("knowledge", Math.min(1, artifact.gaps.length / 8), `gaps:${artifact.id}`, 0.8);
        this.recordEvent(`Ingested ${type} ${source}; interrogated, addressed ${formatAddress(address)}, coated, learned. Gaps=${artifact.gaps.length}.`);
        return artifact;
    }
    ingestFile(filePath) {
        return this.ingest(filePath, fs.readFileSync(filePath));
    }
    verifyArtifact(id) {
        const artifact = this.artifacts.get(id);
        if (!artifact)
            throw new Error(`Unknown artifact: ${id}`);
        return this.verifier.assess(artifact.raw, artifact.coat, synthia_coat_1.DEFAULT_COAT_POLICY);
    }
    feed(artifact) {
        let candidates = [...this.nodes.values()].filter(n => n.genome.preferredInput === artifact.type || n.specialization === artifact.type);
        if (!candidates.length)
            candidates = [...this.nodes.values()].sort((a, b) => b.growthPotential - a.growthPotential).slice(0, Math.max(1, Math.ceil(this.nodes.size * 0.05)));
        const share = 50 / candidates.length;
        for (const node of candidates) {
            node.energy = Math.min(node.maxEnergy, node.energy + share);
            shiftPush(node.activationHistory, 0.8);
            this.metabolicState.energyIn += share;
        }
    }
    addTension(direction, magnitude, source, priority = 0.5) {
        const t = { id: crypto.randomUUID(), direction, magnitude: clamp01(magnitude), source, timestamp: Date.now(), satisfied: false, priority: clamp01(priority) };
        this.tensions.push(t);
        return t.id;
    }
    spendEnergy(amount) {
        const positive = Math.max(0, amount);
        this.metabolicState.energyOut += positive;
        const nodes = [...this.nodes.values()];
        if (!nodes.length)
            return;
        const each = positive / nodes.length;
        for (const node of nodes)
            node.energy -= each;
        this.recomputeTotalEnergy();
    }
    maintain() {
        for (const node of this.nodes.values()) {
            const cost = PHYSICS.ENERGY_DECAY_PER_CYCLE + node.connections.size * PHYSICS.EDGE_MAINTENANCE_COST + PHYSICS.COAT_MAINTENANCE_COST * node.genome.coatThickness;
            const adjusted = cost / Math.max(0.1, node.genome.energyEfficiency);
            node.energy -= adjusted;
            this.metabolicState.energyOut += adjusted;
            for (const [target, edge] of node.connections) {
                edge.age++;
                edge.plasticity = Math.max(0.05, edge.plasticity - PHYSICS.PLASTICITY_DECAY);
                if (edge.age > PHYSICS.MAX_EDGE_AGE_BEFORE_PRUNE && edge.useCount === 0)
                    node.connections.delete(target);
            }
        }
    }
    processTensions() {
        const alive = [];
        for (const t of this.tensions.sort((a, b) => b.priority - a.priority)) {
            t.magnitude *= PHYSICS.TENSION_DECAY;
            if (t.magnitude <= 0.01 || t.satisfied)
                continue;
            const candidates = [...this.nodes.values()].filter(n => n.specialization === t.direction || n.growthPotential > 0.55);
            if (candidates.length) {
                const target = this.rng.pick(candidates);
                const response = t.magnitude * (0.5 + target.growthPotential * 0.5);
                target.energy = Math.min(target.maxEnergy, target.energy + response * 5);
                shiftPush(target.activationHistory, response);
                if (response > 0.5) {
                    t.satisfied = true;
                    this.recordEvent(`Tension resolved: ${t.direction} via ${target.id}.`, true, false, false, t.direction);
                    continue;
                }
            }
            alive.push(t);
        }
        this.tensions = alive;
    }
    propagateSignals() {
        const current = new Map();
        for (const node of this.nodes.values())
            if (this.rng.next() < 0.1)
                current.set(node.id, this.rng.next());
        const next = new Map();
        for (const [id, activation] of current) {
            const node = this.nodes.get(id);
            if (!node)
                continue;
            shiftPush(node.activationHistory, activation);
            node.lastFired = Date.now();
            const cost = PHYSICS.ACTIVATION_ENERGY_COST / Math.max(0.1, node.genome.energyEfficiency);
            node.energy -= cost;
            this.metabolicState.energyOut += cost;
            for (const [targetId, edge] of node.connections) {
                const signal = activation * edge.weight * Math.max(0.1, edge.hebbianStrength);
                if (Math.abs(signal) <= 0.1)
                    continue;
                edge.useCount++;
                edge.lastUsed = Date.now();
                next.set(targetId, clampSigned((next.get(targetId) ?? 0) + signal));
            }
        }
        for (const [id, signal] of next) {
            const node = this.nodes.get(id);
            if (node)
                shiftPush(node.activationHistory, Math.abs(signal));
        }
    }
    hebbianUpdate() {
        for (const node of this.nodes.values()) {
            const avg = averageTail(node.activationHistory, 10);
            if (avg <= PHYSICS.HEBBIAN_THRESHOLD)
                continue;
            for (const edge of node.connections.values()) {
                edge.hebbianStrength = Math.min(1, edge.hebbianStrength + node.genome.learningRate * edge.plasticity);
                edge.weight = clampSigned(edge.weight * (1 + node.genome.learningRate * 0.05));
            }
            if (avg > 0.85 && node.specialization === "undifferentiated") {
                node.specialization = this.inferSpecialization(node);
                node.autobiography.push(`Cycle ${this.cycle}: specialized as ${node.specialization}.`);
                this.recordEvent(`${node.id} specialized as ${node.specialization}.`, true);
            }
        }
    }
    inferSpecialization(node) {
        const candidates = [];
        if (node.connections.size >= 6)
            candidates.push("bridge");
        if (node.genome.compilationSkill > 0.7)
            candidates.push("compiler");
        if (node.genome.meshTendency > 0.7)
            candidates.push("mesh");
        if (node.genome.learningRate > 0.07)
            candidates.push("learner");
        if (node.layer >= Math.floor(this.config.layers * 0.7))
            candidates.push("abstract");
        return candidates.length ? this.rng.pick(candidates) : "generalist";
    }
    selection() {
        const deaths = [];
        const births = [];
        for (const node of this.nodes.values()) {
            if (node.energy < PHYSICS.ENERGY_DEBT_DEATH_THRESHOLD && this.rng.next() > node.genome.resilience)
                deaths.push(node.id);
            if (node.energy > node.maxEnergy - 1 && node.growthPotential > 0.75) {
                const child = this.replicateNode(node);
                births.push(child);
                node.energy -= 250;
            }
            node.energy = Math.max(-100, Math.min(node.maxEnergy, node.energy));
        }
        for (const id of deaths) {
            this.nodes.delete(id);
            for (const node of this.nodes.values())
                node.connections.delete(id);
            this.metabolicState.deathEvents++;
            this.recordEvent(`${id} removed by selection.`, true);
        }
        for (const child of births) {
            this.nodes.set(child.id, child);
            const neighbors = [...this.nodes.values()].filter(n => n.cluster === child.cluster && n.id !== child.id).slice(0, 3);
            for (const neighbor of neighbors) {
                this.connect(child, neighbor);
                this.connect(neighbor, child);
            }
            this.metabolicState.growthEvents++;
            this.recordEvent(`${child.id} born.`, true);
        }
    }
    replicateNode(parent) {
        const child = this.createNode(`${parent.id}_c${this.cycle}_${this.rng.int(1000000)}`, parent.cluster, parent.layer);
        child.genome = {
            mutationRate: this.mutate(parent.genome.mutationRate, 0.001), energyEfficiency: this.mutate(parent.genome.energyEfficiency, 0.05),
            learningRate: this.mutate(parent.genome.learningRate, 0.01), reachTendency: this.mutate(parent.genome.reachTendency, 0.05),
            specializationBias: this.mutate(parent.genome.specializationBias, 0.05), resilience: this.mutate(parent.genome.resilience, 0.05),
            preferredInput: this.rng.next() < 0.1 ? this.rng.pick(INPUT_TYPES) : parent.genome.preferredInput,
            compilationSkill: this.mutate(parent.genome.compilationSkill, 0.05), meshTendency: this.mutate(parent.genome.meshTendency, 0.05),
            coatThickness: this.mutate(parent.genome.coatThickness, 0.03),
        };
        child.specialization = parent.specialization;
        child.growthPotential = clamp01(parent.growthPotential + (this.rng.next() - 0.5) * 0.2);
        return child;
    }
    mutate(v, magnitude) { return clamp01(v + (this.rng.next() - 0.5) * magnitude * 2); }
    autopoiesis() {
        const all = [...this.nodes.values()];
        if (!all.length)
            return;
        for (const node of all) {
            if (node.connections.size === 0 && all.length > 1) {
                const target = this.rng.pick(all.filter(n => n.id !== node.id));
                this.connect(node, target);
                this.recordEvent(`Autopoiesis repaired isolated node ${node.id}.`, true);
            }
            if (node.energy < 50 && node.genome.resilience > 0.75)
                node.growthPotential = Math.min(1, node.growthPotential + 0.005);
        }
    }
    stageSelfMaintenance() {
        for (const source of this.config.sourceFiles) {
            try {
                const absolute = path.resolve(this.config.workspaceRoot, source);
                const text = fs.readFileSync(absolute, "utf8");
                for (const proposal of this.compilation.analyze(source, text).slice(0, 2)) {
                    const report = this.compilation.compile(proposal);
                    this.metabolicState.compilationEvents++;
                    this.config.onCompilation?.(report);
                    this.recordEvent(`Staged mutation ${proposal.reason}: ${report.success ? "PASS" : "FAIL"}.`, false, true);
                }
            }
            catch (error) {
                this.recordEvent(`Self-maintenance skipped ${source}: ${String(error)}`, false, true);
            }
        }
    }
    commitMutation(proposalId, approved) {
        const backup = this.compilation.commit(proposalId, approved);
        this.recordEvent(`Committed tested mutation ${proposalId}; backup=${backup}.`, true, true);
        return backup;
    }
    perturb(type, intensity = 0.5) {
        const power = clamp01(intensity);
        if (type === "starvation") {
            for (const node of this.nodes.values())
                node.energy *= 1 - power;
            this.addTension("efficiency", power, "energy scarcity", 0.9);
        }
        else if (type === "surge") {
            for (const node of this.nodes.values())
                node.energy = Math.min(node.maxEnergy, node.energy + power * 200);
        }
        else if (type === "restructure") {
            const all = [...this.nodes.values()];
            for (const node of all)
                if (this.rng.next() < power && all.length > 1) {
                    const keys = [...node.connections.keys()];
                    if (keys.length)
                        node.connections.delete(this.rng.pick(keys));
                    const target = this.rng.pick(all);
                    if (target.id !== node.id)
                        this.connect(node, target);
                }
            this.addTension("connection", power, "structural reorganization", 0.8);
        }
        else if (type === "mutation") {
            for (const node of this.nodes.values())
                if (this.rng.next() < power) {
                    node.genome.learningRate = this.mutate(node.genome.learningRate, 0.1);
                    node.genome.mutationRate = this.mutate(node.genome.mutationRate, 0.05);
                }
        }
        else if (type === "isolation") {
            for (const peer of this.mesh.peersList())
                this.mesh.trustPeer(peer.id, false);
            this.addTension("connection", power, "peer isolation", 0.9);
        }
        this.recomputeTotalEnergy();
    }
    registerReacher(name, callback) { this.knowledge.registerReacher(name, callback); }
    registerPeer(peer) {
        const expectedId = (0, synthia_coat_1.sha256)(peer.publicKey).slice(0, 24);
        if (expectedId !== peer.id)
            throw new Error(`Peer id/public-key mismatch: ${peer.id}`);
        this.mesh.registerPeer(peer);
        if (peer.trusted)
            this.verifier.trust(peer.id);
    }
    trustPeer(id, trusted = true) { this.mesh.trustPeer(id, trusted); if (trusted)
        this.verifier.trust(id);
    else
        this.verifier.distrust(id); }
    joinCommunity(id) { this.mesh.joinCommunity(id); }
    leaveCommunity(id) { this.mesh.leaveCommunity(id); }
    createPeerTransfer(peerId) {
        const transfer = this.mesh.createTransfer(peerId);
        this.metabolicState.exchangeEvents++;
        this.config.onMeshEvent?.(`Created signed transfer ${transfer.transferId} for ${peerId}`);
        this.recordEvent(`Created explicit signed peer transfer for ${peerId}.`, false, false, true);
        return transfer;
    }
    receivePeerTransfer(transfer, accept) {
        if (!accept)
            return { accepted: false, reasons: ["recipient_declined"] };
        const verification = this.verifier.verifyTransfer(transfer);
        if (!verification.valid || !verification.trustedSigner)
            return { accepted: false, reasons: [...verification.reasons, ...(verification.trustedSigner ? [] : ["untrusted_sender"])] };
        if (transfer.recipientKeyId && transfer.recipientKeyId !== this.getIdentity())
            return { accepted: false, reasons: ["wrong_recipient"] };
        const foreign = transfer.payload;
        const foreignKnowledge = foreign.knowledge.map(k => ({ ...k, embedding: Float32Array.from(k.embedding) }));
        this.knowledge.merge(foreignKnowledge);
        this.recordEvent(`Accepted signed knowledge transfer ${transfer.transferId}.`, false, false, true);
        return { accepted: true, reasons: [] };
    }
    getCoat() {
        const core = (0, synthia_coat_1.stableStringify)(this.snapshot());
        const manifest = {
            artifactId: this.getIdentity(), source: "synthia-termite:self", artifactType: "organism-state", size: Buffer.byteLength(core),
            createdAt: Date.now(), interrogatedAt: Date.now(), runtime: ["node", "typescript"], dependencies: ["synthia-coat"],
            capabilities: this.getCapabilities(), permissions: ["workspace_read", "staging_write", "explicit_signed_peer_exchange"],
            gaps: this.getGaps(), provenance: [`identity:${this.getIdentity()}`, `cycle:${this.cycle}`],
            metadata: { population: this.nodes.size, coherence: this.vitalSigns.coherence },
        };
        const coat = this.authority.createCoat(core, manifest, this.lastCoat);
        this.coatLedger.append(coat);
        this.lastCoat = coat;
        return coat;
    }
    serialize() {
        const snapshot = this.snapshot();
        const core = (0, synthia_coat_1.stableStringify)(snapshot);
        const coat = this.getCoat();
        return (0, synthia_coat_1.stableStringify)({ snapshot, coat, snapshotHash: (0, synthia_coat_1.sha256)(core) });
    }
    snapshot() {
        return {
            version: "synthia-termite/2.1", identity: this.getIdentity(), cycle: this.cycle,
            nodes: [...this.nodes.values()].map(serializeNode), tensions: this.getTensions(), metabolism: this.getMetabolicState(),
            autobiography: this.getAutobiography(), artifacts: [...this.artifacts.values()].map(serializeArtifact),
            knowledge: this.knowledge.getRecords().map(serializeKnowledge), peers: this.mesh.peersList(),
        };
    }
    restore(snapshot) {
        if (snapshot.version !== "synthia-termite/2.1")
            throw new Error(`Unsupported snapshot version: ${snapshot.version}`);
        this.cycle = snapshot.cycle;
        this.nodes.clear();
        for (const n of snapshot.nodes)
            this.nodes.set(n.id, deserializeNode(n));
        this.tensions = snapshot.tensions.map(t => ({ ...t }));
        this.metabolicState = { ...snapshot.metabolism };
        this.autobiography = snapshot.autobiography.map(e => ({ ...e }));
        this.artifacts.clear();
        for (const a of snapshot.artifacts)
            this.artifacts.set(a.id, deserializeArtifact(a));
        this.knowledge.restore(snapshot.knowledge.map(k => ({ ...k, embedding: Float32Array.from(k.embedding) })), this.artifactsArray().flatMap(a => a.gaps));
        for (const p of snapshot.peers)
            this.mesh.registerPeer(p);
        this.updateVitalSigns();
    }
    saveState(relativePath = ".synthia/termite-state.json") {
        const target = resolveInside(this.config.workspaceRoot, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const temp = `${target}.tmp-${process.pid}`;
        fs.writeFileSync(temp, this.serialize(), "utf8");
        fs.renameSync(temp, target);
        return target;
    }
    getCapabilities() {
        return unique(["universal_ingestion", "interrogation_before_address", "deterministic_addressing", "coat_integrity", "structural_learning", "autopoiesis", "staged_self_compilation", "explicit_signed_peer_exchange", ...[...this.nodes.values()].map(n => n.specialization)]);
    }
    getVitalSigns() { return { ...this.vitalSigns, bloodPressure: [...this.vitalSigns.bloodPressure] }; }
    getAutobiography() { return this.autobiography.map(e => ({ ...e })); }
    getTensions() { return this.tensions.map(t => ({ ...t })); }
    getMetabolicState() { return { ...this.metabolicState }; }
    getArtifacts() { return this.artifactsArray(); }
    getKnowledge() { return this.knowledge.getRecords(); }
    getGaps() { return this.knowledge.getGaps(); }
    getFilledGaps() { return this.knowledge.getFilled(); }
    getCompilationHistory() { return this.compilation.getHistory(); }
    getMutationProposals() { return this.compilation.getProposals(); }
    getPeers() { return this.mesh.peersList(); }
    getCommunities() { return this.mesh.communityList(); }
    getNetwork() {
        const nodes = [...this.nodes.values()].map(n => ({ id: n.id, cluster: n.cluster, layer: n.layer, energy: n.energy, specialization: n.specialization, growthPotential: n.growthPotential, connections: n.connections.size, ageCycles: this.cycle - n.bornCycle }));
        const edges = [];
        for (const node of this.nodes.values())
            for (const edge of node.connections.values())
                edges.push({ source: node.id, target: edge.targetId, weight: edge.weight, hebbianStrength: edge.hebbianStrength, age: edge.age, useCount: edge.useCount, signalType: edge.signalType, bandwidth: edge.bandwidth });
        return { nodes, edges };
    }
    artifactsArray() { return [...this.artifacts.values()].map(a => ({ ...a, raw: Buffer.from(a.raw), embedding: Float32Array.from(a.embedding), gaps: [...a.gaps] })); }
    recomputeTotalEnergy() {
        this.metabolicState.totalEnergy = [...this.nodes.values()].reduce((sum, n) => sum + n.energy, 0);
        this.metabolicState.surplus = Math.max(0, this.metabolicState.energyIn - this.metabolicState.energyOut);
        this.metabolicState.debt = Math.max(0, this.metabolicState.energyOut - this.metabolicState.energyIn);
        this.metabolicState.cycle = this.cycle;
    }
    resetCycleCounters() {
        this.metabolicState.energyIn = 0;
        this.metabolicState.energyOut = 0;
        this.metabolicState.growthEvents = 0;
        this.metabolicState.deathEvents = 0;
        this.metabolicState.reachingEvents = 0;
        this.metabolicState.compilationEvents = 0;
        this.metabolicState.exchangeEvents = 0;
    }
    updateAutobiography() {
        const avgEnergy = this.nodes.size ? this.getEnergy() / this.nodes.size : 0;
        const specs = new Set([...this.nodes.values()].map(n => n.specialization));
        this.recordEvent(`Cycle ${this.cycle}: ${this.nodes.size} nodes, ${specs.size} specializations, ${this.artifacts.size} artifacts, ${this.getGaps().length} unresolved gaps, avg energy ${avgEnergy.toFixed(1)}.`);
        if (this.autobiography.length > 1000)
            this.autobiography = this.autobiography.slice(-500);
    }
    recordEvent(event, structuralChange = false, compilation = false, meshEvent = false, tensionResolved = null) {
        const entry = { timestamp: Date.now(), cycle: this.cycle, event, structuralChange, energyDelta: this.metabolicState.energyIn - this.metabolicState.energyOut, tensionResolved, compilation, meshEvent };
        this.autobiography.push(entry);
        this.emit("autobiography", entry);
        this.config.onAutobiography?.(entry);
        if (structuralChange)
            this.config.onStructuralChange?.(event);
    }
    updateVitalSigns() {
        const nodes = [...this.nodes.values()];
        const recent = nodes.flatMap(n => Array.from(n.activationHistory.slice(-10)));
        const history = this.compilation.getHistory();
        this.vitalSigns = {
            pulse: recent.length ? recent.filter(v => v > 0.5).length / recent.length * 100 : 0,
            temperature: nodes.length ? nodes.reduce((a, n) => a + n.energy, 0) / nodes.length / 10 : 0,
            respiration: this.metabolicState.energyIn + this.metabolicState.energyOut,
            bloodPressure: [this.metabolicState.energyIn, this.metabolicState.energyOut],
            consciousness: nodes.length ? nodes.filter(n => n.connections.size > 5).length / nodes.length : 0,
            growthRate: this.metabolicState.growthEvents - this.metabolicState.deathEvents,
            longing: this.tensions.length ? this.tensions.reduce((a, t) => a + t.magnitude, 0) / this.tensions.length : 0,
            coherence: this.calculateCoherence(),
            compilationHealth: history.length ? history.filter(h => h.success).length / history.length : 1,
            meshCoverage: this.mesh.peersList().filter(p => p.trusted).length,
        };
        this.emit("vitalSigns", this.vitalSigns);
        this.config.onVitalSigns?.(this.getVitalSigns());
    }
    calculateCoherence() {
        const nodes = [...this.nodes.values()];
        if (nodes.length < 2)
            return 1;
        const clusterSizes = new Map();
        for (const n of nodes)
            clusterSizes.set(n.cluster, (clusterSizes.get(n.cluster) ?? 0) + 1);
        const sizes = [...clusterSizes.values()];
        const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        const variance = sizes.reduce((a, s) => a + (s - mean) ** 2, 0) / sizes.length;
        const topology = Math.max(0, 1 - variance / (mean * mean + 1));
        const connected = nodes.filter(n => n.connections.size > 0).length / nodes.length;
        return clamp01(topology * 0.5 + connected * 0.5);
    }
}
exports.SynthiaTermite = SynthiaTermite;
function blankMetabolism() {
    return { totalEnergy: 0, energyIn: 0, energyOut: 0, surplus: 0, debt: 0, growthEvents: 0, deathEvents: 0, reachingEvents: 0, compilationEvents: 0, exchangeEvents: 0, cycle: 0 };
}
function blankVitalSigns() {
    return { pulse: 0, temperature: 0, respiration: 0, bloodPressure: [0, 0], consciousness: 0, growthRate: 0, longing: 0, coherence: 1, compilationHealth: 1, meshCoverage: 0 };
}
function unique(values) { return [...new Set(values)]; }
function clamp01(n) { return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0; }
function clampSigned(n) { return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0; }
function averageTail(values, count) {
    const start = Math.max(0, values.length - count);
    let sum = 0;
    for (let i = start; i < values.length; i++)
        sum += values[i];
    return sum / Math.max(1, values.length - start);
}
function shiftPush(values, value) { values.copyWithin(0, 1); values[values.length - 1] = value; }
function parseCsvLine(line) {
    const out = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (quoted && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else
                quoted = !quoted;
        }
        else if (ch === "," && !quoted) {
            out.push(current.trim());
            current = "";
        }
        else
            current += ch;
    }
    out.push(current.trim());
    return out;
}
function languageFromPath(source) {
    const ext = path.extname(source).toLowerCase();
    if ([".ts", ".tsx"].includes(ext))
        return "typescript";
    if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext))
        return "javascript";
    return ext.slice(1) || "unknown";
}
function formatAddress(a) { return `${a.dimension}:G${a.gate}.L${a.line}.C${a.color}.T${a.tone}.B${a.base}`; }
function inferPermissions(i) {
    const p = new Set();
    if (i.behaviors.includes("reads-files"))
        p.add("filesystem_read");
    if (i.behaviors.includes("writes-files"))
        p.add("filesystem_write");
    if (i.behaviors.includes("launches-processes"))
        p.add("process_execution");
    if (i.behaviors.includes("network-capable"))
        p.add("network_access");
    if (!p.size)
        p.add("none_observed");
    return [...p];
}
function resolveInside(root, candidate) {
    const r = path.resolve(root);
    const absolute = path.resolve(r, candidate);
    if (absolute !== r && !absolute.startsWith(r + path.sep))
        throw new Error(`Path outside workspace denied: ${candidate}`);
    return absolute;
}
function serializeNode(n) { return { ...n, activationHistory: Array.from(n.activationHistory), connections: [...n.connections.entries()], genome: { ...n.genome }, autobiography: [...n.autobiography], mutationIds: [...n.mutationIds] }; }
function deserializeNode(n) { return { ...n, activationHistory: Float32Array.from(n.activationHistory), connections: new Map(n.connections), genome: { ...n.genome }, autobiography: [...n.autobiography], mutationIds: [...n.mutationIds] }; }
function serializeArtifact(a) { const { raw, ...rest } = a; return { ...rest, rawBase64: raw.toString("base64"), embedding: Array.from(a.embedding), gaps: [...a.gaps] }; }
function deserializeArtifact(a) { const { rawBase64, ...rest } = a; return { ...rest, raw: Buffer.from(rawBase64, "base64"), embedding: Float32Array.from(a.embedding), gaps: [...a.gaps] }; }
function serializeKnowledge(k) { return { ...k, embedding: Array.from(k.embedding) }; }
exports.default = SynthiaTermite;
