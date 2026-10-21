"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonSnapshotRepository = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
class JsonSnapshotRepository {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async save(memory) {
        const directory = node_path_1.default.dirname(this.filePath);
        const temporaryPath = `${this.filePath}.tmp`;
        await node_fs_1.promises.mkdir(directory, { recursive: true });
        await node_fs_1.promises.writeFile(temporaryPath, JSON.stringify(memory.snapshot(), null, 2), "utf8");
        await node_fs_1.promises.rename(temporaryPath, this.filePath);
    }
    async load(memory) {
        try {
            const raw = await node_fs_1.promises.readFile(this.filePath, "utf8");
            memory.restore(JSON.parse(raw));
            return true;
        }
        catch (error) {
            if (error.code === "ENOENT")
                return false;
            throw error;
        }
    }
}
exports.JsonSnapshotRepository = JsonSnapshotRepository;
//# sourceMappingURL=JsonSnapshotRepository.js.map