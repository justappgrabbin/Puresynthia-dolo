"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripletToolComposer = void 0;
class TripletToolComposer {
    async execute(tool, input, initialValues = {}) {
        const context = { trace: [], values: { ...initialValues } };
        context.trace.push(tool.input.id);
        const acquired = await tool.input.execute(input, context);
        context.trace.push(tool.transform.id);
        const transformed = await tool.transform.execute(acquired, context);
        context.trace.push(tool.output.id);
        const output = await tool.output.execute(transformed, context);
        return { toolId: tool.id, output, trace: [...context.trace] };
    }
    asOrgan(tool, role) {
        return {
            id: tool.id,
            role,
            execute: async (input, context) => {
                const result = await this.execute(tool, input, context.values);
                context.trace.push(...result.trace);
                return result.output;
            },
        };
    }
}
exports.TripletToolComposer = TripletToolComposer;
//# sourceMappingURL=TripletToolComposer.js.map