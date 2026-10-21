import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SynthiaTermite } = require('../extensions/termite-coat/synthia-termite.js');

export class TermiteHost {
  constructor({ workspaceRoot = process.cwd(), cognitive = null, ...options } = {}) {
    this.termite = new SynthiaTermite({ workspaceRoot, ...options });
    if (cognitive) this.termite.attachCognitiveAdapter(cognitive);
  }
  ingest(name, bytes) { return this.termite.ingest(name, bytes); }
  verify(id) { return this.termite.verifyArtifact(id); }
  proposals() { return this.termite.getMutationProposals(); }
  commit(proposalId, approved) { return this.termite.commitMutation(proposalId, approved); }
  snapshot() { return this.termite.snapshot(); }
  start() { return this.termite.start(); }
  stop() { return this.termite.stop(); }
}
export default TermiteHost;
