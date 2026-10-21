// bootstrap.js — THE WIRING
//
// Creates the mesh, instantiates all tools, registers them with Head,
// and exports the fully wired system as a single importable object.
//
// Usage:
//   import { system } from './bootstrap.js';
//   const result = await system.head.dispatch({ lines: [1,0,1,0,1,0] });

import { Mesh } from './mesh.js';
import { ToolBase } from './ToolBase.js';
import { Head } from './head.js';
import { SemanticOS } from './semanticOS.js';
import { SheldonKleinCompiler } from './sheldonKleinCompiler.js';

// Klein tools
import { AIHub } from './aiHub.js';
import { AnalogyEngine } from './analogyEngine.js';
import { AutoLing } from './autoling.js';
import { GitHubRAG } from './githubRAG.js';
import { Diseminer } from './diseminer.js';
import { IChingGrammar } from './iChingGrammar.js';
import { LanguageContact } from './languageContact.js';
import { Messy } from './messy.js';
import { NovelWriter } from './novelWriter.js';
import { HistoricalMonteCarlo } from './historicalMonteCarlo.js';

// Create Mesh
const mesh = new Mesh();

// Instantiate All Tools
const semanticOS = new SemanticOS(mesh);
const sheldonKlein = new SheldonKleinCompiler(mesh);
const head = new Head(mesh);
const aiHub = new AIHub(mesh);
const analogyEngine = new AnalogyEngine(mesh);
const autoLing = new AutoLing(mesh);
const githubRAG = new GitHubRAG(mesh);
const diseminer = new Diseminer(mesh);
const iChingGrammar = new IChingGrammar(mesh);
const languageContact = new LanguageContact(mesh);
const messy = new Messy(mesh);
const novelWriter = new NovelWriter(mesh);
const historicalMonteCarlo = new HistoricalMonteCarlo(mesh);

// Register All Tools with Head
head.register('SemanticOS', semanticOS);
head.register('SheldonKleinCompiler', sheldonKlein);
head.register('AIHub', aiHub);
head.register('AnalogyEngine', analogyEngine);
head.register('AutoLing', autoLing);
head.register('GitHubRAG', githubRAG);
head.register('Diseminer', diseminer);
head.register('IChingGrammar', iChingGrammar);
head.register('LanguageContact', languageContact);
head.register('Messy', messy);
head.register('NovelWriter', novelWriter);
head.register('HistoricalMonteCarlo', historicalMonteCarlo);

// Wire Mesh Subscriptions for Cross-Tool Communication
// When SemanticOS resolves a state, SheldonKleinCompiler can verify it
mesh.subscribe('core.semanticos', (msg) => {
  if (msg.payload.event === 'STATE_RESOLVED') {
    const state = semanticOS.getState(msg.payload.hash);
    if (state) {
      const convergence = sheldonKlein.verifyConvergence(state, 0.85);
      mesh.publish('lang.sheldonklein', 'MeshObserver', {
        event: 'AUTO_VERIFY',
        stateHash: msg.payload.hash,
        ...convergence
      });
    }
  }
});

// When Head dispatches, log to a central trace channel
mesh.subscribe('head.dispatch', (msg) => {
  mesh.publish('system.trace', 'MeshObserver', {
    event: 'HEAD_DISPATCH',
    timestamp: msg.timestamp,
    decision: msg.payload
  });
});

// When any tool publishes a result, log to trace
const toolChannels = [
  'symbol.iching', 'sim.messy', 'reason.analogy', 'lang.contact',
  'sim.montecarlo', 'lang.diseminer', 'code.githubrag', 'lang.autoling',
  'hub.ninthcenter', 'narrative.novelwriter', 'core.semanticos', 'lang.sheldonklein'
];

toolChannels.forEach((channel) => {
  mesh.subscribe(channel, (msg) => {
    mesh.publish('system.trace', 'MeshObserver', {
      event: 'TOOL_OUTPUT',
      channel: msg.channel,
      source: msg.source,
      payloadType: typeof msg.payload,
      timestamp: msg.timestamp
    });
  });
});

// Export the Wired System
export const system = {
  mesh,
  head,
  semanticOS,
  sheldonKlein,
  aiHub,
  analogyEngine,
  autoLing,
  githubRAG,
  diseminer,
  iChingGrammar,
  languageContact,
  messy,
  novelWriter,
  historicalMonteCarlo,

  // Convenience: full pipeline from text -> compiled coordinates -> resolved state
  async parseAndResolve(text, domain = 'human') {
    const compiled = sheldonKlein.compile(text);
    const state = semanticOS.resolve({
      who: { id: 'auto-generated', namespace: 'synthia' },
      what: { type: 'parsed_query', traits: { input: text, confidence: compiled.confidence } },
      where: { trajectory: [compiled.coordinates.gate], position: `${compiled.coordinates.zodiac}-${compiled.coordinates.house}` },
      when: { temporalMarker: Date.now(), cyclePhase: 'present' },
      why: { constraints: ['structural_fidelity'], purpose: 'state_resolution' },
      coordinates: compiled.coordinates,
      domain
    });
    return { compiled, state };
  },

  // Convenience: run a tool through Head dispatch
  async dispatch(input) {
    return head.dispatch(input);
  }
};

// Default export for convenience
export default system;
