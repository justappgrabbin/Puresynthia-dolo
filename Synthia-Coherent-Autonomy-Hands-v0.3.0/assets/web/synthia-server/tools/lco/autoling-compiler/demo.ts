
/**
 * AUTOLING Pattern Recognition Compiler - Demo Script
 * 
 * Usage: ts-node demo.ts
 * 
 * This demonstrates the full pipeline:
 * 1. Ingest a situation
 * 2. W-H Interrogation
 * 3. Gate Lock Convergence
 * 4. Multi-Modal Compilation
 * 5. MESSY Simulation
 * 6. AUTOLING Grammar Learning
 */

import { UniversalEngine } from './universal-engine';
import { OutputModality } from './transduction-engine';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  AUTOLING Pattern Recognition Compiler v1.0                ║');
  console.log('║  69,120-node Mesh | W-H Interrogative Core | MESSY Sim     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  const engine = new UniversalEngine({
    convergenceThreshold: 0.75,
    maxRecursiveDepth: 7,
    autoSimulate: true,
    autoLearn: true,
    outputModalities: ['story', 'code', 'image', 'video', 'game']
  });

  // Test inputs representing different situations
  const testInputs = [
    {
      raw: 'I am standing at the edge of a great decision, feeling the weight of what comes next. The path forward is unclear but the pull is strong. I need to create something new that has never existed before.',
      sourceType: 'situation' as const
    },
    {
      raw: 'The system is broken. We need to repair what has been spoiled and transform the old architecture into something that serves the present moment. The revolution must be gentle but complete.',
      sourceType: 'text' as const
    },
    {
      raw: 'function processData(input) { return input.map(x => x * 2).filter(x => x > 10); }',
      sourceType: 'code' as const
    }
  ];

  for (let i = 0; i < testInputs.length; i++) {
    const input = testInputs[i];
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`TEST CASE ${i + 1}: ${input.sourceType.toUpperCase()}`);
    console.log(`Input: "${input.raw.substring(0, 80)}..."`);
    console.log();

    const output = await engine.process(input);

    // Display convergence results
    console.log('📍 CONVERGENCE RESULTS');
    console.log(`   Locked: ${output.manifest.convergence.is_locked}`);
    console.log(`   Gate: ${output.manifest.convergence.locked_gate_id ? output.manifest.convergence.locked_gate_id + 1 : 'N/A'}`);
    console.log(`   Confidence: ${output.manifest.convergence.confidence_score.toFixed(3)}`);
    console.log(`   Depth: ${output.manifest.convergence.recursive_depth}`);
    console.log(`   Processing time: ${output.processingTime.toFixed(2)}ms`);
    console.log();

    // Display W-H containers
    console.log('🔍 W-H EXTRACTION');
    for (const [probe, container] of Object.entries(output.manifest.h_containers)) {
      console.log(`   ${probe.toUpperCase()}: ${container.contact_clues.slice(0, 5).join(', ')}${container.contact_clues.length > 5 ? '...' : ''}`);
      console.log(`      Confidence: ${container.confidence.toFixed(2)} | Candidates: ${container.node_links.length}`);
    }
    console.log();

    // Display compiled artifacts
    if (output.manifest.convergence.is_locked) {
      console.log('🎨 COMPILED ARTIFACTS');
      for (const [modality, artifact] of Object.entries(output.artifacts)) {
        console.log(`   [${modality.toUpperCase()}] Gate ${artifact.gateId}: ${artifact.gateName}`);
        console.log(`      Dimension: ${artifact.dimension}`);
        console.log(`      Hexagram: ${artifact.hexagram}`);
        console.log(`      Content preview: ${artifact.content.substring(0, 100)}...`);
        console.log();
      }
    }

    // Display simulation state
    if (output.simulation) {
      console.log('🌊 MESSY SIMULATION');
      console.log(`   Active nodes: ${output.simulation.activeNodes.length}`);
      console.log(`   Attractor basins: ${output.simulation.attractorBasins.length}`);
      console.log(`   Entropy: ${output.simulation.entropy.toFixed(3)}`);
      console.log(`   Coherence: ${output.simulation.coherence.toFixed(3)}`);
      console.log();
    }

    // Display grammar learning
    if (output.grammarRules.length > 0) {
      console.log('📚 AUTOLING GRAMMAR');
      console.log(`   Rules coined: ${output.grammarRules.length}`);
      console.log(`   Accepted: ${output.grammarRules.filter(r => r.accepted).length}`);
      console.log(`   Types: ${output.grammarRules.map(r => r.type).join(', ')}`);
      console.log();
    }

    console.log();
  }

  // Final engine query
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔮 ENGINE STATE QUERY');
  const query = engine.query('What is the current state of the system?');
  console.log(`   ${query.answer}`);
  console.log(`   Active gates: [${query.activeGates.join(', ')}]`);
  console.log(`   Emotional weather: ${query.emotionalWeather.dominant} (fear: ${query.emotionalWeather.fear.toFixed(2)}, hope: ${query.emotionalWeather.hope.toFixed(2)}, desire: ${query.emotionalWeather.desire.toFixed(2)})`);
  console.log(`   Grammar: ${query.grammarStats.total} total, ${query.grammarStats.accepted} accepted`);
  console.log();

  // Mesh state
  console.log('🕸️  MESH STATE');
  const meshState = engine.getMeshState();
  console.log(`   Total nodes: ${meshState.totalNodes.toLocaleString()}`);
  console.log(`   Active nodes: ${meshState.activeNodes}`);
  console.log(`   Active gates: ${meshState.activeGates.length}`);
  console.log(`   By dimension: ${JSON.stringify(meshState.byDimension)}`);
  console.log(`   Top nodes: ${meshState.topNodes.slice(0, 5).map(n => `G${n.gate}(${n.dimension})`).join(', ')}`);
  console.log();

  console.log('✅ Demo complete.');
}

main().catch(console.error);
