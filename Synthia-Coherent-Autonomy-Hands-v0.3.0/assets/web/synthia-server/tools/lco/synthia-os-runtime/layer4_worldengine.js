/**
 * WorldEngine - 3D World Builder from I Ching Symbols
 * ==================================================
 *
 * Based on Sheldon Klein's Meta-Symbolic Simulation System.
 *
 * WorldEngine converts I Ching concepts into 3D world descriptions
 * that can be rendered by a game engine (Unity, Unreal, etc.).
 *
 * What it does:
 * 1. Receives a scenario from AutoNovel
 * 2. Maps scenario elements to 3D assets and properties
 * 3. Generates a world description (JSON format)
 * 4. Outputs data that any game engine can render
 *
 * Feature space: [space, light, sound, texture, movement, life]
 *   space: how the environment is structured
 *   light: lighting conditions
 *   sound: ambient audio
 *   texture: surface qualities
 *   movement: how things move in the space
 *   life: how alive the environment feels
 */

const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');

class WorldEngine {
  constructor() {
    this.name = "WorldEngine";
    this.version = "1.0";
    this.featureSpace = [0, 1, 0, 1, 0, 1];  // Tool signature in mesh

    // Asset library (mappings from concepts to 3D descriptions)
    this.assets = this._buildAssetLibrary();

    // World history
    this.worlds = [];
  }

  // ============================================================
  // ASSET LIBRARY
  // ============================================================

  _buildAssetLibrary() {
    /**
     * Map I Ching concepts to 3D world elements.
     * Each element has properties that any game engine can use.
     */
    return {
      // Trigram-based environments
      trigrams: {
        heaven: {
          sky: "clear_blue", ground: "clouds", lighting: "bright_directional",
          atmosphere: "open", color: [0.5, 0.7, 1.0], fog: 0.1
        },
        earth: {
          sky: "overcast", ground: "soil", lighting: "soft_diffuse",
          atmosphere: "enclosed", color: [0.4, 0.3, 0.2], fog: 0.3
        },
        water: {
          sky: "stormy", ground: "water", lighting: "reflective",
          atmosphere: "flowing", color: [0.2, 0.4, 0.6], fog: 0.2
        },
        fire: {
          sky: "sunset", ground: "lava", lighting: "warm_point",
          atmosphere: "energetic", color: [1.0, 0.5, 0.2], fog: 0.1
        },
        thunder: {
          sky: "dark_clouds", ground: "rock", lighting: "flashing",
          atmosphere: "tense", color: [0.3, 0.3, 0.4], fog: 0.2
        },
        wind: {
          sky: "moving_clouds", ground: "grass", lighting: "shifting",
          atmosphere: "changing", color: [0.6, 0.7, 0.5], fog: 0.15
        },
        mountain: {
          sky: "misty", ground: "stone", lighting: "shadowed",
          atmosphere: "still", color: [0.5, 0.5, 0.4], fog: 0.4
        },
        lake: {
          sky: "mirror", ground: "water", lighting: "reflective",
          atmosphere: "calm", color: [0.4, 0.6, 0.7], fog: 0.1
        }
      },

      // Center-based cities
      centers: {
        head: {
          architecture: "floating_islands", buildings: "crystalline",
          scale: "vast", gravity: "low", particles: "sparks"
        },
        ajna: {
          architecture: "library", buildings: "bookshelves_infinite",
          scale: "intimate", gravity: "normal", particles: "dust_motes"
        },
        throat: {
          architecture: "amphitheater", buildings: "stages",
          scale: "medium", gravity: "normal", particles: "sound_waves"
        },
        g_center: {
          architecture: "labyrinth", buildings: "mirrors",
          scale: "confusing", gravity: "normal", particles: "reflections"
        },
        ego: {
          architecture: "arena", buildings: "trophies",
          scale: "impressive", gravity: "normal", particles: "flames"
        },
        sacral: {
          architecture: "garden", buildings: "greenhouses",
          scale: "fertile", gravity: "normal", particles: "pollen"
        },
        spleen: {
          architecture: "catacombs", buildings: "alarms",
          scale: "claustrophobic", gravity: "normal", particles: "spores"
        },
        solar_plexus: {
          architecture: "ocean", buildings: "waves",
          scale: "fluid", gravity: "variable", particles: "bubbles"
        },
        root: {
          architecture: "cave", buildings: "pressure_gauges",
          scale: "deep", gravity: "heavy", particles: "steam"
        }
      },

      // NPC archetypes
      npcs: {
        mirror: {
          form: "reflective_humanoid", material: "chrome",
          animation: "mimic", sound: "echo"
        },
        shadow: {
          form: "dark_silhouette", material: "smoke",
          animation: "creep", sound: "whisper"
        },
        guide: {
          form: "elderly_wanderer", material: "cloth",
          animation: "gesture", sound: "calm_voice"
        },
        doubt: {
          form: "fractured_face", material: "glass",
          animation: "shatter", sound: "static"
        },
        muse: {
          form: "ethereal_figure", material: "light",
          animation: "float", sound: "music"
        },
        critic: {
          form: "stern_judge", material: "stone",
          animation: "point", sound: "gavel"
        }
      }
    };
  }

  // ============================================================
  // WORLD GENERATION
  // ============================================================

  /**
   * Generate a 3D world from a scenario.
   */
  buildWorld(scenario) {
    const worldId = `world_${this.worlds.length}_${Date.now()}`;

    // Determine environment from scenario archetype
    const environment = this._determineEnvironment(scenario);

    // Build the world description
    const world = {
      id: worldId,
      name: scenario.name,
      archetype: scenario.archetype,
      hexagrams: scenario.hexagrams,
      gates: scenario.gates,

      // Environment
      environment: environment,

      // Lighting
      lighting: this._buildLighting(scenario),

      // Audio
      audio: this._buildAudio(scenario),

      // Structures
      structures: this._buildStructures(scenario, environment),

      // NPCs
      npcs: this._buildNPCs(scenario),

      // Interactive elements
      interactables: this._buildInteractables(scenario),

      // Atmosphere
      atmosphere: this._buildAtmosphere(scenario),

      // Metadata
      generated: Date.now(),
      status: "ready"
    };

    this.worlds.push(world);
    return world;
  }

  /**
   * Determine the environment from scenario archetype.
   */
  _determineEnvironment(scenario) {
    // Map archetype to trigram
    const archetypeToTrigram = {
      "avoidance": "water",
      "repetition": "earth",
      "initiation": "heaven",
      "waiting": "mountain",
      "conflict": "thunder",
      "transformation": "fire",
      "community": "lake",
      "exhaustion": "water"
    };

    const trigramName = archetypeToTrigram[scenario.archetype] || "earth";
    const trigram = this.assets.trigrams[trigramName];

    // Determine center from gates
    let centerName = "g_center";
    if (scenario.gates && scenario.gates.length > 0) {
      const gate = scenario.gates[0];
      // Find which center this gate belongs to
      for (const [center, gates] of Object.entries(FeatureSpace.CENTER_GATES)) {
        if (gates.includes(gate)) {
          centerName = center;
          break;
        }
      }
    }

    const center = this.assets.centers[centerName] || this.assets.centers.g_center;

    return {
      trigram: trigramName,
      trigramData: trigram,
      center: centerName,
      centerData: center,
      sky: trigram.sky,
      ground: trigram.ground,
      lighting: trigram.lighting,
      atmosphere: trigram.atmosphere,
      color: trigram.color,
      fog: trigram.fog,
      architecture: center.architecture,
      scale: center.scale,
      gravity: center.gravity,
      particles: center.particles
    };
  }

  /**
   * Build lighting description.
   */
  _buildLighting(scenario) {
    const hex = scenario.hexagrams[0] || 1;
    const hexData = FeatureSpace.HEXAGRAMS[hex];

    // Yang lines = bright, yin lines = dim
    const yangCount = hexData.vector.filter(b => b === 1).length;
    const brightness = yangCount / 6;

    return {
      type: brightness > 0.5 ? "bright" : "dim",
      brightness: brightness,
      color: scenario.archetype === "transformation" ? [1.0, 0.5, 0.2] :
             scenario.archetype === "avoidance" ? [0.3, 0.3, 0.4] :
             [0.8, 0.8, 0.9],
      shadows: scenario.archetype === "avoidance" ? "long" : "soft",
      sources: [
        { type: "ambient", intensity: brightness * 0.5 },
        { type: "directional", intensity: brightness, angle: 45 }
      ]
    };
  }

  /**
   * Build audio description.
   */
  _buildAudio(scenario) {
    const sounds = {
      "avoidance": ["heartbeat", "whispers", "footsteps"],
      "repetition": ["clock_ticking", "echo", "loop"],
      "initiation": ["birds", "wind", "bells"],
      "waiting": ["silence", "distant_sound", "breathing"],
      "conflict": ["thunder", "clashing", "shouting"],
      "transformation": ["fire_crackling", "metal_heating", "chanting"],
      "community": ["laughter", "conversation", "music"],
      "exhaustion": ["dripping_water", "heavy_breathing", "static"]
    };

    return {
      ambient: sounds[scenario.archetype] || ["silence"],
      reverb: scenario.archetype === "exhaustion" ? "long" : "medium",
      volume: 0.6
    };
  }

  /**
   * Build structures (buildings, objects, terrain).
   */
  _buildStructures(scenario, environment) {
    const structures = [];

    // Main structure based on center architecture
    structures.push({
      type: "main_building",
      architecture: environment.architecture,
      scale: environment.scale,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      material: "primary",
      color: environment.color
    });

    // Gate structures (one per gate in scenario)
    if (scenario.gates) {
      scenario.gates.forEach((gate, i) => {
        const angle = (i / scenario.gates.length) * Math.PI * 2;
        const radius = 10;
        structures.push({
          type: "gate",
          gateNumber: gate,
          hexagram: FeatureSpace.HEXAGRAMS[gate]?.name || "Unknown",
          position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
          rotation: [0, -angle, 0],
          material: "stone",
          color: [0.5, 0.5, 0.5],
          glow: FeatureSpace.HEXAGRAMS[gate]?.vector[0] === 1 ? 0.8 : 0.2  // Yang lines glow
        });
      });
    }

    return structures;
  }

  /**
   * Build NPCs from scenario characters.
   */
  _buildNPCs(scenario) {
    if (!scenario.npcs) return [];

    return scenario.npcs.map((npc, i) => {
      const asset = this.assets.npcs[npc.name.toLowerCase().replace("the ", "")] || {
        form: "humanoid", material: "default", animation: "idle", sound: "voice"
      };

      return {
        id: `npc_${i}`,
        name: npc.name,
        role: npc.role,
        form: asset.form,
        material: asset.material,
        animation: asset.animation,
        sound: asset.sound,
        position: [Math.cos(i * 2) * 3, 0, Math.sin(i * 2) * 3],
        vector: npc.vector,
        dialogue: []  // To be filled by scenario
      };
    });
  }

  /**
   * Build interactive elements (choices, portals, objects).
   */
  _buildInteractables(scenario) {
    if (!scenario.choices) return [];

    return scenario.choices.map((choice, i) => {
      const angle = (i / scenario.choices.length) * Math.PI * 2;
      const radius = 5;

      return {
        type: "choice_portal",
        choiceIndex: i,
        text: choice.text,
        line: choice.line,
        hexagram: choice.hexagram,
        position: [Math.cos(angle) * radius, 1, Math.sin(angle) * radius],
        color: choice.line <= 3 ? [0.2, 0.5, 1.0] : [1.0, 0.5, 0.2],  // Lower lines = blue, upper = orange
        glow: 0.6,
        particle: "sparkles"
      };
    });
  }

  /**
   * Build atmosphere (fog, particles, weather).
   */
  _buildAtmosphere(scenario) {
    return {
      fog: {
        density: scenario.archetype === "exhaustion" ? 0.5 : 0.2,
        color: [0.5, 0.5, 0.6]
      },
      particles: {
        type: scenario.archetype === "initiation" ? "pollen" :
              scenario.archetype === "transformation" ? "embers" :
              scenario.archetype === "avoidance" ? "dust" : "mist",
        density: 0.3,
        movement: "drift"
      },
      weather: {
        type: scenario.archetype === "conflict" ? "storm" :
               scenario.archetype === "waiting" ? "calm" : "clear",
        intensity: 0.5
      }
    };
  }

  // ============================================================
  // MESH INTEGRATION
  // ============================================================

  /**
   * Handler for when this tool is called from the mesh.
   */
  handle(vertex, params = {}) {
    if (params.scenario) {
      return this.buildWorld(params.scenario);
    }
    if (params.worldId) {
      return this.worlds.find(w => w.id === params.worldId);
    }
    return {
      worlds: this.worlds.length,
      assets: Object.keys(this.assets).length
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================


  // ============================================================
  // PHASE-SPACE OPERATOR HOOKS
  // ============================================================

  /**
   * Return operators for the five phase-space stages.
   * WorldEngine is primarily a Space renderer.
   */
  getOperators(context) {
    return {
      // Space: Convert final embedded state into navigable spatial structure
      spaceFn: (state, ctx) => {
        const world = this._renderFromState(state);

        return {
          state: {
            ...state,
            world: world,
            rendered: true
          },
          events: [
            { type: 'worldengine_space', environment: world.environment?.trigram },
            { type: 'worldengine_rendered', structures: world.structures?.length }
          ]
        };
      }
    };
  }

  // Render world from computed state (not from fixed archetype lookup)
  _renderFromState(state) {
    const vector = state.vector || [0,0,0,0,0,0];
    const situation = state.situation || {};
    const identity = state.identity || {};

    // Determine environment from computed state vector
    const environment = this._environmentFromVector(vector, situation);

    // Build structures from state's situated form
    const structures = this._structuresFromState(state);

    // Build NPCs from state's relations
    const npcs = this._npcsFromRelations(state);

    // Build interactables from state's portals
    const interactables = this._interactablesFromPortals(state);

    return {
      id: `world_${identity.id || Date.now()}`,
      name: identity.name || 'Unknown World',
      archetype: situation.archetype || 'emerging',
      environment: environment,
      structures: structures,
      npcs: npcs,
      interactables: interactables,
      atmosphere: this._atmosphereFromVector(vector)
    };
  }

  _environmentFromVector(vector, situation) {
    // Determine trigram from vector (not from fixed archetype mapping)
    const upper = vector.slice(3, 6).map(v => v > 0 ? 1 : 0);
    const lower = vector.slice(0, 3).map(v => v > 0 ? 1 : 0);

    // Find matching trigram
    const trigrams = {
      '111': 'heaven', '000': 'earth', '010': 'water', '101': 'fire',
      '001': 'thunder', '110': 'wind', '100': 'mountain', '011': 'lake'
    };

    const upperKey = upper.join('');
    const lowerKey = lower.join('');

    const upperTrigram = trigrams[upperKey] || 'earth';
    const lowerTrigram = trigrams[lowerKey] || 'earth';

    // Determine center from active coordinates
    const activeCoords = vector.map((v, i) => ({ val: v, idx: i })).filter(c => Math.abs(c.val) > 0.5);
    const centerIndex = activeCoords.length > 0 ? activeCoords[0].idx % 9 : 4;
    const centers = ['head', 'ajna', 'throat', 'g_center', 'ego', 'sacral', 'spleen', 'solar_plexus', 'root'];

    return {
      trigram: upperTrigram,
      lowerTrigram: lowerTrigram,
      center: centers[centerIndex] || 'g_center',
      sky: this._trigramToSky(upperTrigram),
      ground: this._trigramToGround(lowerTrigram),
      lighting: this._vectorToLighting(vector),
      color: this._vectorToColor(vector),
      fog: this._vectorToFog(vector),
      architecture: situation.form || 'emerging',
      scale: situation.stability || 'fluid'
    };
  }

  _trigramToSky(trigram) {
    const map = {
      heaven: 'clear_blue', earth: 'overcast', water: 'stormy',
      fire: 'sunset', thunder: 'dark_clouds', wind: 'moving_clouds',
      mountain: 'misty', lake: 'mirror'
    };
    return map[trigram] || 'clear';
  }

  _trigramToGround(trigram) {
    const map = {
      heaven: 'clouds', earth: 'soil', water: 'water',
      fire: 'lava', thunder: 'rock', wind: 'grass',
      mountain: 'stone', lake: 'water'
    };
    return map[trigram] || 'earth';
  }

  _vectorToLighting(vector) {
    const yangCount = vector.filter(v => v > 0).length;
    if (yangCount > 4) return 'bright';
    if (yangCount > 2) return 'soft';
    return 'dim';
  }

  _vectorToColor(vector) {
    // Color from vector components
    return [
      Math.abs(vector[0] || 0),
      Math.abs(vector[2] || 0),
      Math.abs(vector[4] || 0)
    ];
  }

  _vectorToFog(vector) {
    const variance = vector.reduce((s, v) => s + (v - 0.5) ** 2, 0) / vector.length;
    return Math.min(0.5, variance);
  }

  _structuresFromState(state) {
    const structures = [];
    const form = state.form || 'emerging';

    // Main structure from form
    structures.push({
      type: 'main',
      architecture: form,
      position: [0, 0, 0]
    });

    // Gate structures from portals
    if (state.portals) {
      state.portals.forEach((portal, i) => {
        const angle = (i / state.portals.length) * Math.PI * 2;
        structures.push({
          type: 'gate',
          gateNumber: portal.hexagram || i,
          position: [Math.cos(angle) * 10, 0, Math.sin(angle) * 10]
        });
      });
    }

    return structures;
  }

  _npcsFromRelations(state) {
    const npcs = [];
    const relations = state.relations || [];

    relations.forEach((rel, i) => {
      npcs.push({
        name: `Entity_${rel.target}`,
        role: rel.type === 'close' ? 'ally' : 'observer',
        form: 'humanoid',
        position: [Math.cos(i) * 5, 0, Math.sin(i) * 5]
      });
    });

    return npcs;
  }

  _interactablesFromPortals(state) {
    const interactables = [];
    const portals = state.portals || [];

    portals.forEach((portal, i) => {
      const angle = (i / portals.length) * Math.PI * 2;
      interactables.push({
        type: 'choice_portal',
        choiceIndex: i,
        text: portal.choice || 'Enter',
        line: portal.line || 1,
        hexagram: portal.hexagram || 1,
        position: [Math.cos(angle) * 5, 1, Math.sin(angle) * 5]
      });
    });

    return interactables;
  }

  _atmosphereFromVector(vector) {
    return {
      fog: { density: this._vectorToFog(vector) },
      particles: {
        type: vector[0] > 0 ? 'embers' : 'mist',
        density: Math.abs(vector[1] || 0)
      }
    };
  }

  toString() {
    return `WorldEngine(v=${this.version}, worlds=${this.worlds.length}, assets=${Object.keys(this.assets).length})`;
  }
}

const WorldEngineModule = { WorldEngine };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldEngineModule;
}

if (typeof window !== 'undefined') {
  window.WorldEngine = WorldEngineModule;
}
