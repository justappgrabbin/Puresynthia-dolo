"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergentChannelResolver = void 0;
const ChannelRegistry_1 = require("./ChannelRegistry");
class EmergentChannelResolver {
    registry;
    constructor(registry = new ChannelRegistry_1.ChannelRegistry()) {
        this.registry = registry;
    }
    resolve(natalGates, contextualActivations) {
        const natal = new Set(natalGates);
        const sources = new Map();
        for (const gate of natal)
            sources.set(gate, new Set(["natal"]));
        for (const activation of contextualActivations) {
            const current = sources.get(activation.gate) ?? new Set();
            current.add(activation.source);
            sources.set(activation.gate, current);
        }
        return this.registry
            .getAll()
            .filter((channel) => sources.has(channel.gateA) && sources.has(channel.gateB))
            .map((channel) => {
            const channelSources = [
                ...(sources.get(channel.gateA) ?? []),
                ...(sources.get(channel.gateB) ?? []),
            ];
            const uniqueSources = [...new Set(channelSources)].sort();
            const temporary = !(natal.has(channel.gateA) && natal.has(channel.gateB));
            return {
                channel,
                sources: uniqueSources,
                temporary,
                ability: channel.nativeBehavior,
                edgeFunction: (input) => ({
                    channelId: channel.id,
                    ability: channel.nativeBehavior,
                    input,
                    sources: uniqueSources,
                    temporary,
                }),
            };
        });
    }
}
exports.EmergentChannelResolver = EmergentChannelResolver;
//# sourceMappingURL=EmergentChannelFunction.js.map