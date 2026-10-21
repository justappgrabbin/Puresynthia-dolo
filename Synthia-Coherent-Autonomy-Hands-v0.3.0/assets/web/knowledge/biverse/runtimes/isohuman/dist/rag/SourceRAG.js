"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceRAG = void 0;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
class SourceRAG {
    sources = new Map();
    chunks = new Map();
    addSource(source) {
        this.sources.set(source.id, structuredClone(source));
    }
    addText(source, text, location = "document") {
        this.addSource(source);
        const paragraphs = text
            .replace(/\r/g, "")
            .split(/\n{2,}/)
            .map((value) => value.trim())
            .filter(Boolean);
        let count = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            const parts = chunk(paragraphs[i], 1200);
            for (let j = 0; j < parts.length; j++) {
                const value = parts[j];
                const checksum = (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
                const id = (0, node_crypto_1.createHash)("sha256")
                    .update(`${source.id}\0${location}\0${i}\0${j}\0${checksum}`)
                    .digest("hex");
                this.chunks.set(id, {
                    id,
                    sourceId: source.id,
                    location: `${location}#${i + 1}.${j + 1}`,
                    text: value,
                    checksum,
                });
                count += 1;
            }
        }
        return count;
    }
    async addLocalTree(source, root) {
        this.addSource(source);
        let count = 0;
        for (const file of await walk(root)) {
            if (!isReadableSource(file))
                continue;
            const relative = node_path_1.default.relative(root, file).replace(/\\/g, "/");
            const text = await node_fs_1.promises.readFile(file, "utf8");
            count += this.addText(source, text, relative);
        }
        return count;
    }
    async addGitHubRepository(owner, repository, token = process.env.GITHUB_TOKEN) {
        const source = {
            id: `github:${owner}/${repository}`,
            kind: "github",
            uri: `https://github.com/${owner}/${repository}`,
            title: `${owner}/${repository}`,
        };
        const headers = {
            Accept: "application/vnd.github+json",
            "User-Agent": "synthia-source-rag",
        };
        if (token)
            headers.Authorization = `Bearer ${token}`;
        const repositoryResponse = await fetch(`https://api.github.com/repos/${owner}/${repository}`, { headers });
        if (!repositoryResponse.ok) {
            throw new Error(`GitHub repository lookup failed: ${repositoryResponse.status}`);
        }
        const metadata = (await repositoryResponse.json());
        source.license = metadata.license?.spdx_id;
        this.addSource(source);
        const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repository}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`, { headers });
        if (!treeResponse.ok)
            throw new Error(`GitHub tree lookup failed: ${treeResponse.status}`);
        const tree = (await treeResponse.json());
        let count = 0;
        for (const item of tree.tree) {
            if (item.type !== "blob" ||
                !isReadableSource(item.path) ||
                (item.size ?? 0) > 500_000)
                continue;
            const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repository}/${metadata.default_branch}/${item.path}`);
            if (raw.ok)
                count += this.addText(source, await raw.text(), item.path);
        }
        return count;
    }
    search(query, limit = 10) {
        const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 1);
        return [...this.chunks.values()]
            .map((item) => {
            const lower = item.text.toLowerCase();
            const score = terms.reduce((sum, term) => {
                const matches = lower.split(term).length - 1;
                return sum + Math.min(matches, 8);
            }, 0);
            return { item, score };
        })
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ item, score }) => ({
            ...structuredClone(item),
            source: structuredClone(this.sources.get(item.sourceId)),
            score,
        }));
    }
    snapshot() {
        return {
            sources: [...this.sources.values()].map((source) => structuredClone(source)),
            chunks: [...this.chunks.values()].map((item) => structuredClone(item)),
        };
    }
}
exports.SourceRAG = SourceRAG;
function chunk(text, size) {
    if (text.length <= size)
        return [text];
    const result = [];
    for (let start = 0; start < text.length; start += size) {
        result.push(text.slice(start, start + size));
    }
    return result;
}
async function walk(root) {
    const result = [];
    for (const entry of await node_fs_1.promises.readdir(root, { withFileTypes: true })) {
        if ([".git", "node_modules", "dist", "build", "__pycache__"].includes(entry.name))
            continue;
        const full = node_path_1.default.join(root, entry.name);
        if (entry.isDirectory())
            result.push(...(await walk(full)));
        else if (entry.isFile())
            result.push(full);
    }
    return result;
}
function isReadableSource(file) {
    return /\.(md|txt|json|jsonl|ya?ml|ts|tsx|js|jsx|py|rb|cs|jl|toml)$/i.test(file);
}
//# sourceMappingURL=SourceRAG.js.map