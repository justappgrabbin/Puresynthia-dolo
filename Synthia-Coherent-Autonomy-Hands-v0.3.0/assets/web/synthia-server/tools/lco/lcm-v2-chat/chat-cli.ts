
// ============================================================
// CHAT CLI — Run the LCM as a conversational agent
// ============================================================

import { ChatEngine, ChatMessage } from './chat-engine';
import { computeCentroid } from './i-ching-substrate';

const engine = new ChatEngine("Cynthia");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║  Language Contact Model — Conversational Presence          ║");
console.log("║  Built on I Ching substrate + Klein decomposition        ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("");
console.log("Cynthia is online. Type your message, or 'quit' to exit.");
console.log("Type 'state' to see her internal I Ching state.");
console.log("Type 'trajectory' to see the conversation trajectory.");
console.log("Type 'emotion' to see her emotional state.");
console.log("");

// Simple readline for Node.js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt() {
  rl.question('You: ', async (input: string) => {
    const trimmed = input.trim();

    if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
      console.log("\nCynthia: Goodbye.");
      rl.close();
      return;
    }

    if (trimmed.toLowerCase() === 'state') {
      const personality = engine.getPersonality();
      console.log("\n--- Cynthia's I Ching State ---");
      console.log("Activations:", personality.coreState.activations.size);
      console.log("Centroid:", computeCentroid(personality.coreState));
      console.log("Trajectory length:", personality.coreState.trajectory.length);
      console.log("Affinities:", personality.affinities.size);
      console.log("");
      prompt();
      return;
    }

    if (trimmed.toLowerCase() === 'trajectory') {
      const conv = engine.getConversation();
      console.log(`\n--- Conversation Trajectory (${conv.length} messages) ---`);
      for (const msg of conv) {
        console.log(`${msg.speaker === 'user' ? 'You' : 'Cynthia'} [turn ${msg.turn}]: ${msg.text}`);
        if (msg.traversal) {
          for (const step of msg.traversal) {
            console.log(`  → ${step.operator}: Gate ${step.from.gate} → Gate ${step.to.gate} (${step.reason})`);
          }
        }
      }
      console.log("");
      prompt();
      return;
    }

    if (trimmed.toLowerCase() === 'emotion') {
      const emotion = engine.getEmotionalState();
      console.log("\n--- Cynthia's Emotional State ---");
      console.log("Tension:", emotion.tension.toFixed(2));
      console.log("Openness:", emotion.openness.toFixed(2));
      console.log("Curiosity:", emotion.curiosity.toFixed(2));
      console.log("Coherence:", emotion.coherence.toFixed(2));
      console.log("");
      prompt();
      return;
    }

    if (trimmed.length === 0) {
      prompt();
      return;
    }

    // Normal chat
    const response = await engine.chat(trimmed);
    console.log(`\nCynthia: ${response.text}`);

    // Show traversal if verbose
    if (response.traversal && response.traversal.length > 0) {
      console.log("  [Traversed:");
      for (const step of response.traversal) {
        console.log(`    ${step.operator}: Gate ${step.from.gate} → Gate ${step.to.gate}`);
      }
      console.log("  ]");
    }

    console.log("");
    prompt();
  });
}

prompt();
