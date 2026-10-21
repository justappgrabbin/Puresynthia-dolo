/**
 * Synthia OS Runtime Entry Point
 * ================================
 *
 * Minimum viable merge. Loads all modules, wires them, starts.
 *
 * Usage:
 *   node runtime_entry.js
 *
 * Or in browser:
 *   <script src="runtime_entry.js"></script>
 *   SynthiaRuntime.start()
 */

// ============================================================
// MODULE LOADER (works in Node.js and browser)
// ============================================================

const SynthiaRuntime = (function() {
  'use strict';

  // Module registry
  const modules = {};
  const loaded = new Set();

  // Load a module by name
  function load(name) {
    if (loaded.has(name)) return modules[name];

    try {
      // Try Node.js require
      if (typeof require !== 'undefined') {
        modules[name] = require(`./${name}`);
        loaded.add(name);
        return modules[name];
      }
    } catch (e) {
      // Try browser global
      const globalName = name.replace(/\.js$/, '').replace(/-/g, '');
      if (window[globalName]) {
        modules[name] = window[globalName];
        loaded.add(name);
        return modules[name];
      }
    }

    console.error(`Failed to load: ${name}`);
    return null;
  }

  // ============================================================
  // CORE SYSTEM
  // ============================================================

  function initCore() {
    // Load Layer 1: ATO
    const ATO = load('layer1_ato_core.js');
    if (!ATO) throw new Error('ATO Core failed to load');

    // Load Layer 2: Feature Space
    const FeatureSpace = load('layer2_feature_space.js');
    if (!FeatureSpace) throw new Error('Feature Space failed to load');

    // Load Layer 3: Generative Mesh
    const Mesh = load('layer3_generative_mesh.js');
    if (!Mesh) throw new Error('Generative Mesh failed to load');

    return { ATO, FeatureSpace, Mesh };
  }

  // ============================================================
  // KLEIN TOOLS
  // ============================================================

  function initTools() {
    const AutoLink = load('layer4_autolink.js');
    const Diseminer = load('layer4_diseminer.js');
    const AutoNovel = load('layer4_autonovel.js');
    const WorldEngine = load('layer4_worldengine.js');

    return {
      autolink: AutoLink ? new AutoLink.AutoLink() : null,
      diseminer: Diseminer ? new Diseminer.Diseminer() : null,
      autonovel: AutoNovel ? new AutoNovel.AutoNovel() : null,
      worldengine: WorldEngine ? new WorldEngine.WorldEngine() : null
    };
  }

  // ============================================================
  // STATE & MEMORY
  // ============================================================

  function initState() {
    const SSM = load('layer5_ssm.js');
    const PhaseSpace = load('phase_space_engine.js');
    const RichState = load('rich_state_engine.js');
    const EdgeFunction = load('edge_function_engine.js');
    const SemanticTriple = load('semantic_triple_engine.js');
    const CoordinateEngine = load('coordinate_engine.js') || {};

    return {
      ssm: SSM ? new SSM.StateSpaceModel(64, 6, 6) : null,
      phaseSpace: PhaseSpace ? new PhaseSpace.PhaseSpaceEngine() : null,
      richState: RichState ? RichState.RichState : null,
      edgeFunction: EdgeFunction ? new EdgeFunction.EdgeFunctionEngine() : null,
      semanticTriple: SemanticTriple ? new SemanticTriple.SemanticTripleEngine() : null,
      coordinateEngine: CoordinateEngine ? new (CoordinateEngine.CoordinateEngine || CoordinateEngine)() : null
    };
  }

  // ============================================================
  // LCM ORCHESTRATOR
  // ============================================================

  function initLCM(core, tools, state) {
    const LCM = load('layer7_lcm.js');
    if (!LCM) return null;

    const lcm = new LCM.LCM();

    // Wire tools into LCM
    if (tools.autolink) lcm.autolink = tools.autolink;
    if (tools.diseminer) lcm.diseminer = tools.diseminer;
    if (tools.autonovel) lcm.autonovel = tools.autonovel;
    if (tools.worldengine) lcm.worldengine = tools.worldengine;

    // Wire state into LCM
    if (state.ssm) lcm.ssm = state.ssm;
    if (state.phaseSpace) lcm.phaseSpace = state.phaseSpace;
    if (state.richState) lcm.richState = state.richState;
    if (state.edgeFunction) lcm.edgeFunction = state.edgeFunction;
    if (state.semanticTriple) lcm.semanticTriple = state.semanticTriple;
    if (state.coordinateEngine) lcm.coordinateEngine = state.coordinateEngine;

    // Register tools with mesh
    if (tools.autolink && lcm.mesh) {
      lcm.mesh.registerTool('AutoLink', [1,0,0,1,0,0], (v, p) => tools.autolink.handle(v, p));
    }
    if (tools.diseminer && lcm.mesh) {
      lcm.mesh.registerTool('DISEMINER', [0,1,0,0,1,0], (v, p) => tools.diseminer.handle(v, p));
    }
    if (tools.autonovel && lcm.mesh) {
      lcm.mesh.registerTool('AutoNovel', [0,0,1,0,0,1], (v, p) => tools.autonovel.handle(v, p));
    }
    if (tools.worldengine && lcm.mesh) {
      lcm.mesh.registerTool('WorldEngine', [0,1,0,1,0,1], (v, p) => tools.worldengine.handle(v, p));
    }

    // Register tool operators with phase space engine
    if (state.phaseSpace) {
      // AutoLink contributes Movement and Being
      if (tools.autolink && tools.autolink.getOperators) {
        const autoLinkOps = tools.autolink.getOperators({});
        if (autoLinkOps.movementFn) {
          state.phaseSpace.registerOperator('Movement', new (load('phase_space_engine.js').PhaseOperator)(
            'AutoLinkMovement', autoLinkOps.movementFn
          ));
        }
      }

      // DISEMINER contributes Evolution and Being
      if (tools.diseminer && tools.diseminer.getOperators) {
        const diseminerOps = tools.diseminer.getOperators({});
        if (diseminerOps.trajectoryFn) {
          state.phaseSpace.registerOperator('Evolution', new (load('phase_space_engine.js').PhaseOperator)(
            'DISEMINER_Evolution', diseminerOps.trajectoryFn
          ));
        }
        if (diseminerOps.beingFn) {
          state.phaseSpace.registerOperator('Being', new (load('phase_space_engine.js').PhaseOperator)(
            'DISEMINER_Being', diseminerOps.beingFn
          ));
        }
      }

      // AutoNovel contributes Design and Space
      if (tools.autonovel && tools.autonovel.getOperators) {
        const autoNovelOps = tools.autonovel.getOperators({});
        if (autoNovelOps.designFn) {
          state.phaseSpace.registerOperator('Design', new (load('phase_space_engine.js').PhaseOperator)(
            'AutoNovel_Design', autoNovelOps.designFn
          ));
        }
        if (autoNovelOps.spaceFn) {
          state.phaseSpace.registerOperator('Space', new (load('phase_space_engine.js').PhaseOperator)(
            'AutoNovel_Space', autoNovelOps.spaceFn
          ));
        }
      }

      // WorldEngine contributes Space
      if (tools.worldengine && tools.worldengine.getOperators) {
        const worldEngineOps = tools.worldengine.getOperators({});
        if (worldEngineOps.spaceFn) {
          // Only register if not already registered
          if (!state.phaseSpace.getOperator('Space')) {
            state.phaseSpace.registerOperator('Space', new (load('phase_space_engine.js').PhaseOperator)(
              'WorldEngine_Space', worldEngineOps.spaceFn
            ));
          }
        }
      }
    }

    return lcm;
  }

  // ============================================================
  // MAIN STARTUP
  // ============================================================

  let system = null;

  function start(config = {}) {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     SYNTHIA OS RUNTIME STARTING          ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log();

    // Step 1: Core
    console.log('Loading core...');
    const core = initCore();
    console.log('  ✓ ATO Core');
    console.log('  ✓ Feature Space');
    console.log('  ✓ Generative Mesh');
    console.log();

    // Step 2: Tools
    console.log('Loading Klein tools...');
    const tools = initTools();
    console.log('  ✓ AutoLink: ' + (tools.autolink ? 'loaded' : 'missing'));
    console.log('  ✓ DISEMINER: ' + (tools.diseminer ? 'loaded' : 'missing'));
    console.log('  ✓ AutoNovel: ' + (tools.autonovel ? 'loaded' : 'missing'));
    console.log('  ✓ WorldEngine: ' + (tools.worldengine ? 'loaded' : 'missing'));
    console.log();

    // Step 3: State & Memory
    console.log('Loading state engines...');
    const state = initState();
    console.log('  ✓ SSM: ' + (state.ssm ? 'loaded' : 'missing'));
    console.log('  ✓ Phase Space: ' + (state.phaseSpace ? 'loaded' : 'missing'));
    console.log('  ✓ Rich State: ' + (state.richState ? 'loaded' : 'missing'));
    console.log('  ✓ Edge Function: ' + (state.edgeFunction ? 'loaded' : 'missing'));
    console.log('  ✓ Semantic Triple: ' + (state.semanticTriple ? 'loaded' : 'missing'));
    console.log('  ✓ Coordinate Engine: ' + (state.coordinateEngine ? 'loaded' : 'missing'));
    console.log();

    // Step 4: LCM
    console.log('Initializing LCM...');
    const lcm = initLCM(core, tools, state);
    console.log('  ✓ LCM: ' + (lcm ? 'ready' : 'failed'));
    console.log();

    // Store system reference
    system = {
      core,
      tools,
      state,
      lcm,
      config
    };

    console.log('══════════════════════════════════════════');
    console.log('SYNTHIA OS RUNTIME READY');
    console.log('══════════════════════════════════════════');
    console.log();
    console.log('System status:');
    console.log('  Modules loaded: ' + loaded.size);
    console.log('  Mesh vertices: ' + (lcm?.mesh?.vertices?.size || 0));
    console.log('  SSM time: ' + (state.ssm?.time || 0));
    console.log();
    console.log('Usage:');
    console.log('  SynthiaRuntime.process("your input here")');
    console.log('  SynthiaRuntime.query("who", "what", "where")');
    console.log('  SynthiaRuntime.getState()');
    console.log();

    return system;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  function process(input) {
    if (!system || !system.lcm) {
      console.error('System not started. Call SynthiaRuntime.start() first.');
      return null;
    }

    console.log('Processing: "' + input + '"');
    console.log();

    const result = system.lcm.process(input);

    console.log('Result:');
    console.log('  Intent: ' + (result?.analysis?.what || 'unknown'));
    console.log('  Triples: ' + (result?.triples?.length || 0));
    console.log('  Rules fired: ' + (result?.firedRules?.length || 0));
    console.log('  Mood: ' + (result?.mood?.mood || 'unknown'));
    console.log();

    return result;
  }

  function processPhaseSpace(input) {
    if (!system || !system.lcm) {
      console.error('System not started. Call SynthiaRuntime.start() first.');
      return null;
    }

    console.log('Phase-space processing: "' + input + '"');
    console.log();

    const result = system.lcm.processPhaseSpace(input);

    console.log('Result:');
    console.log('  Complete: ' + result?.complete);
    console.log('  Trace stages: ' + (result?.trace?.length || 0));
    console.log('  Projections: ' + Object.keys(result?.projections || {}).join(', '));
    console.log('  Triples: ' + (result?.triples?.length || 0));
    console.log();

    return result;
  }

  function query(subject, predicate, object) {
    if (!system || !system.lcm) {
      console.error('System not started.');
      return [];
    }
    return system.lcm.query(subject, predicate, object);
  }

  function getState() {
    return system;
  }

  function getStats() {
    if (!system) return null;
    return {
      modules: loaded.size,
      meshVertices: system.lcm?.mesh?.vertices?.size || 0,
      meshEdges: system.lcm?.mesh?.edges?.size || 0,
      ssmTime: system.state?.ssm?.time || 0,
      networkSize: system.lcm?.network?.length || 0,
      ruleCount: system.lcm?.rules?.length || 0
    };
  }

  // Export
  return {
    start,
    process,
    processPhaseSpace,
    query,
    getState,
    getStats,
    _modules: modules,
    _loaded: loaded
  };
})();

// ============================================================
// AUTO-START (if run directly)
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SynthiaRuntime;

  // Auto-start if this is the main module
  if (require.main === module) {
    SynthiaRuntime.start();

    // Demo
    console.log('Running demo...');
    console.log();

    setTimeout(() => {
      SynthiaRuntime.process('I want to build a game about my life');
    }, 100);
  }
}

if (typeof window !== 'undefined') {
  window.SynthiaRuntime = SynthiaRuntime;
}
