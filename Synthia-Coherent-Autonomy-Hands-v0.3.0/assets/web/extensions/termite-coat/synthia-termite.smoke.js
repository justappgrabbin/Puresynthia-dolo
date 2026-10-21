const { SynthiaTermite } = require('./synthia-termite.js');

async function main() {
  const a = new SynthiaTermite({ initialNodes: 16, seed: 'alpha', workspaceRoot: __dirname });
  const b = new SynthiaTermite({ initialNodes: 12, seed: 'beta', workspaceRoot: __dirname });

  const artifact = a.ingest('demo.ts', 'export function add(a:number,b:number){ return a+b; }');
  for (let i = 0; i < 8; i++) await a.tick();

  const coat = a.verifyArtifact(artifact.id);
  if (!coat.verification.valid) throw new Error(`Artifact coat invalid: ${coat.reasons.join(', ')}`);

  a.registerPeer({ id: b.getIdentity(), publicKey: b.getPubkey(), trusted: true, capabilities: b.getCapabilities(), communities: ['smoke'], lastSeen: Date.now() });
  b.registerPeer({ id: a.getIdentity(), publicKey: a.getPubkey(), trusted: true, capabilities: a.getCapabilities(), communities: ['smoke'], lastSeen: Date.now() });

  const transfer = a.createPeerTransfer(b.getIdentity());
  const accepted = b.receivePeerTransfer(transfer, true);
  if (!accepted.accepted) throw new Error(`Transfer rejected: ${accepted.reasons.join(', ')}`);

  const saved = a.saveState('.synthia/smoke-state.json');
  console.log(JSON.stringify({
    population: a.getPopulation(),
    artifactType: artifact.type,
    address: artifact.address,
    coatDecision: coat.decision,
    coatValid: coat.verification.valid,
    transferAccepted: accepted.accepted,
    saved,
    coherence: a.getVitalSigns().coherence,
    unresolvedGaps: a.getGaps().length,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
