/**
 * Tool Runtime Engine
 * ==================
 *
 * Every tool is just another transform in the pipeline.
 *
 * Contract:
 *   input: RichState + context
 *   output: RichState + artifacts
 *
 * Tools are swappable. They all speak the same language.
 *
 * Built-in tools:
 *   - Parser: text → RichState
 *   - Extractor: RichState → features
 *   - Reasoner: RichState → conclusions
 *   - Renderer: RichState → visual output
 *   - CodeGen: RichState → code
 *   - Validator: RichState → validation
 *   - Simulator: RichState → simulation
 *   - Research: RichState → knowledge
 */

class ToolRuntimeEngine {
  constructor() {
    this.tools = new Map();     // name -> tool
    this.pipelines = new Map(); // name -> [tool names]
    this.history = [];
  }

  /**
   * Register a tool.
   */
  register(name, tool) {
    this.tools.set(name, {
      name: name,
      transform: tool.transform || ((state, ctx) => state),
      validate: tool.validate || (() => true),
      config: tool.config || {}
    });
  }

  /**
   * Create a pipeline from tool names.
   */
  createPipeline(name, toolNames) {
    this.pipelines.set(name, toolNames);
  }

  /**
   * Execute a single tool.
   */
  execute(toolName, state, context = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        state: state
      };
    }

    // Validate
    if (!tool.validate(state, context)) {
      return {
        success: false,
        error: `Validation failed for tool: ${toolName}`,
        state: state
      };
    }

    // Execute
    const startTime = Date.now();
    const result = tool.transform(state, context);
    const endTime = Date.now();

    // Record
    this.history.push({
      tool: toolName,
      time: startTime,
      duration: endTime - startTime,
      input: state.identity?.id,
      output: result.identity?.id || result
    });

    return {
      success: true,
      state: result,
      tool: toolName,
      duration: endTime - startTime
    };
  }

  /**
   * Execute a pipeline.
   */
  executePipeline(pipelineName, state, context = {}) {
    const toolNames = this.pipelines.get(pipelineName);
    if (!toolNames) {
      return {
        success: false,
        error: `Pipeline not found: ${pipelineName}`,
        state: state
      };
    }

    let currentState = state;
    const results = [];

    for (const toolName of toolNames) {
      const result = this.execute(toolName, currentState, context);
      results.push(result);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          state: currentState,
          results: results
        };
      }

      currentState = result.state;
    }

    return {
      success: true,
      state: currentState,
      pipeline: pipelineName,
      results: results
    };
  }

  /**
   * Get all available tools.
   */
  getTools() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all pipelines.
   */
  getPipelines() {
    return Array.from(this.pipelines.keys());
  }
}

// ============================================================
// BUILT-IN TOOLS
// ============================================================

const BuiltInTools = {
  /**
   * Parser: text → RichState
   */
  Parser: {
    transform: (state, ctx) => {
      const text = ctx.text || state.text || '';
      // Parse text into initial state
      return {
        ...state,
        text: text,
        parsed: {
          tokens: text.split(/\s+/),
          sentiment: 0.5,  // placeholder
          entities: []
        }
      };
    },
    validate: (state, ctx) => !!ctx.text || !!state.text
  },

  /**
   * Extractor: RichState → features
   */
  Extractor: {
    transform: (state, ctx) => {
      const features = {
        vector: state.geometry?.vector || [0,0,0,0,0,0],
        energy: state.energy?.level || 0.5,
        edges: state.edges?.active?.length || 0,
        triples: state.semantics?.triples?.length || 0
      };
      return {
        ...state,
        features: features
      };
    }
  },

  /**
   * Reasoner: RichState → conclusions
   */
  Reasoner: {
    transform: (state, ctx) => {
      const conclusions = [];
      if (state.energy?.level > 0.8) {
        conclusions.push('high_energy');
      }
      if (state.edges?.active?.length > 5) {
        conclusions.push('highly_connected');
      }
      return {
        ...state,
        conclusions: conclusions
      };
    }
  },

  /**
   * Renderer: RichState → visual output
   */
  Renderer: {
    transform: (state, ctx) => {
      // Generate visual description from state
      const visual = {
        color: state.coordinates?.color || 0,
        tone: state.coordinates?.tone || 0,
        brightness: state.energy?.level || 0.5,
        form: state.identity?.form || 'undefined'
      };
      return {
        ...state,
        visual: visual
      };
    }
  },

  /**
   * CodeGen: RichState → code
   */
  CodeGen: {
    transform: (state, ctx) => {
      // Generate code from state structure
      const code = {
        language: ctx.language || 'javascript',
        structure: {
          type: state.identity?.type || 'unknown',
          fields: Object.keys(state).filter(k => k !== 'memory'),
          methods: state.affordances?.available || []
        }
      };
      return {
        ...state,
        code: code
      };
    }
  },

  /**
   * Validator: RichState → validation
   */
  Validator: {
    transform: (state, ctx) => {
      const errors = [];
      if (!state.identity) errors.push('missing_identity');
      if (!state.geometry) errors.push('missing_geometry');
      if (state.energy?.level < 0) errors.push('negative_energy');

      return {
        ...state,
        validation: {
          valid: errors.length === 0,
          errors: errors
        }
      };
    }
  },

  /**
   * Simulator: RichState → simulation
   */
  Simulator: {
    transform: (state, ctx) => {
      // Simulate next state
      const steps = ctx.steps || 1;
      const trajectory = [];
      let current = state;

      for (let i = 0; i < steps; i++) {
        // Simple simulation: energy decays, edges strengthen
        if (current.energy) {
          current.energy.level *= (1 - current.energy.dissipation);
        }
        trajectory.push({ ...current });
      }

      return {
        ...state,
        simulation: {
          steps: steps,
          trajectory: trajectory,
          finalEnergy: trajectory[trajectory.length - 1]?.energy?.level
        }
      };
    }
  },

  /**
   * Research: RichState → knowledge
   */
  Research: {
    transform: (state, ctx) => {
      // Query knowledge from state relations
      const knowledge = {
        related: state.edges?.active?.map(e => e.target) || [],
        patterns: state.memory?.traces?.map(t => t.trace) || [],
        gaps: state.affordances?.conditional || []
      };
      return {
        ...state,
        knowledge: knowledge
      };
    }
  }
};

const ToolRuntimeModule = { ToolRuntimeEngine, BuiltInTools };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolRuntimeModule;
}

if (typeof window !== 'undefined') {
  window.ToolRuntime = ToolRuntimeModule;
}
