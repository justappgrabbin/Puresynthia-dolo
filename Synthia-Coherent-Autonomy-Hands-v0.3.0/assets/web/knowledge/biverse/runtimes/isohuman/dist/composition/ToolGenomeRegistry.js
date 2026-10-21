"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolGenomeRegistry = void 0;
const KleinStrongEquivalence_1 = require("../ato/KleinStrongEquivalence");
const TripletToolComposer_1 = require("./TripletToolComposer");
class ToolGenomeRegistry {
    organs = new Map();
    tools = new Map();
    composer = new TripletToolComposer_1.TripletToolComposer();
    registerOrgan(organ) {
        if (this.organs.has(organ.id))
            throw new Error(`Duplicate organ ${organ.id}`);
        this.organs.set(organ.id, structuredCloneExceptFunction(organ));
    }
    compose(id, inputId, transformId, outputId, genome) {
        const input = this.requireOrgan(inputId);
        const transform = this.requireOrgan(transformId);
        const output = this.requireOrgan(outputId);
        if (input.returns !== transform.accepts) {
            throw new Error(`${input.id} returns ${input.returns}; ${transform.id} accepts ${transform.accepts}`);
        }
        if (transform.returns !== output.accepts) {
            throw new Error(`${transform.id} returns ${transform.returns}; ${output.id} accepts ${output.accepts}`);
        }
        const tool = {
            id,
            capabilities: [...new Set([
                    ...input.capabilities,
                    ...transform.capabilities,
                    ...output.capabilities,
                ])],
            genome: {
                ...genome,
                atoOperator: (0, KleinStrongEquivalence_1.operatorBetween)(genome.binaryRoot, genome.binaryResultant).code,
            },
            triplet: {
                id,
                input: input.organ,
                transform: transform.organ,
                output: output.organ,
            },
            componentIds: [inputId, transformId, outputId],
        };
        this.tools.set(id, tool);
        return tool;
    }
    async execute(id, input) {
        const tool = this.tools.get(id);
        if (!tool)
            throw new Error(`Unknown composed tool ${id}`);
        return (await this.composer.execute(tool.triplet, input)).output;
    }
    match(requiredCapabilities) {
        return [...this.tools.values()].filter((tool) => requiredCapabilities.every((capability) => tool.capabilities.includes(capability)));
    }
    getTool(id) {
        return this.tools.get(id);
    }
    requireOrgan(id) {
        const organ = this.organs.get(id);
        if (!organ)
            throw new Error(`Unknown organ ${id}`);
        return organ;
    }
}
exports.ToolGenomeRegistry = ToolGenomeRegistry;
function structuredCloneExceptFunction(organ) {
    return {
        ...organ,
        capabilities: [...organ.capabilities],
        genome: structuredClone(organ.genome),
        organ: organ.organ,
    };
}
//# sourceMappingURL=ToolGenomeRegistry.js.map